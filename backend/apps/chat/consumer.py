# apps/chat/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Room, Message, MessageRead

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):

    # ─── Connection ────────────────────────────────────────────────

    async def connect(self):
        """
        Called when a client opens a WebSocket connection.
        We reject anonymous users immediately.
        Then we join all the room groups this user is a member of.
        """
        self.user = self.scope['user']

        # reject unauthenticated connections
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)  # 4001 = our custom "unauthorized" code
            return

        # join all room groups the user belongs to
        # this means they'll receive messages from all their rooms
        self.room_groups = []
        user_rooms = await self.get_user_rooms()
        print("ROOM COUNT:", len(user_rooms))

        for room in user_rooms:
            group_name = room.get_channel_group_name()
            self.room_groups.append(group_name)
            await self.channel_layer.group_add(group_name, self.channel_name)

        # also join a personal channel for direct notifications
        # format: user_<uuid-without-dashes>
        self.personal_group = f"user_{self.user.id.hex}"
        await self.channel_layer.group_add(self.personal_group, self.channel_name)

        await self.accept()

        # mark user as online and notify their contacts
        await self.set_user_online(True)
        await self.broadcast_online_status(True)

    async def disconnect(self, close_code):
        """
        Called when the connection closes — browser tab closed,
        internet lost, user logged out etc.
        """
        if not hasattr(self, 'user') or not self.user.is_authenticated:
            return

        # leave all room groups
        for group_name in getattr(self, 'room_groups', []):
            await self.channel_layer.group_discard(group_name, self.channel_name)

        await self.channel_layer.group_discard(self.personal_group, self.channel_name)

        # mark offline and notify contacts
        await self.set_user_online(False)
        await self.broadcast_online_status(False)

    # ─── Receiving messages from the client ────────────────────────

    async def receive(self, text_data):
        """
        Called every time the client sends a message over the WebSocket.
        We parse the JSON and route to the right handler based on 'type'.
        """
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        message_type = data.get('type')

        # route to the correct handler
        handlers = {
            'ping':           self.handle_ping,
            'send_message':   self.handle_send_message,
            'typing_start':   self.handle_typing_start,
            'typing_stop':    self.handle_typing_stop,
            'message_read':   self.handle_message_read,
        }

        handler = handlers.get(message_type)
        if handler:
            await handler(data)

    # ─── Client → Server handlers ──────────────────────────────────

    async def handle_ping(self, data):
        """
        Client is sending a ping to keep the connection alive.
        Just send back a pong.
        """
        await self.send(text_data=json.dumps({'type': 'pong'}))

    async def handle_send_message(self, data):
        """
        Client sent a message. Save it to the DB then broadcast
        it to everyone in the room (including the sender).
        """
        room_id = data.get('room_id')
        content = data.get('content', '').strip()

        if not content or not room_id:
            return

        # verify user is actually a member of this room
        room = await self.get_room(room_id)
        if not room:
            return

        # save to database
        message = await self.save_message(room, content)

        # broadcast to everyone in the room via Redis
        await self.safe_group_send(
            room.get_channel_group_name(),
            {
                'type': 'chat_message',   # maps to the chat_message method below
                'message_id': str(message.id),
                'room_id': str(room.id),
                'sender_id': str(self.user.id),
                'sender_username': self.user.username,
                'content': content,
                'created_at': message.created_at.isoformat(),
            }
        )

    async def handle_typing_start(self, data):
        room_id = data.get('room_id')
        room = await self.get_room(room_id)
        if not room:
            return

        # broadcast to the room — everyone sees "John is typing..."
        await self.safe_group_send(
            room.get_channel_group_name(),
            {
                'type': 'typing_indicator',
                'room_id': room_id,
                'user_id': str(self.user.id),
                'username': self.user.username,
                'is_typing': True,
            }
        )

    async def handle_typing_stop(self, data):
        room_id = data.get('room_id')
        room = await self.get_room(room_id)
        if not room:
            return

        await self.safe_group_send(
            room.get_channel_group_name(),
            {
                'type': 'typing_indicator',
                'room_id': room_id,
                'user_id': str(self.user.id),
                'username': self.user.username,
                'is_typing': False,
            }
        )

    async def handle_message_read(self, data):
        """
        Client is telling us they've seen a message.
        Save the read receipt and notify the sender.
        """
        message_id = data.get('message_id')
        if not message_id:
            return

        message = await self.get_message(message_id)
        if not message:
            return

        # save read receipt (unique_together means no duplicates)
        already_read = await self.mark_message_read(message)
        if already_read:
            return  # don't broadcast if already marked

        # notify the room about the read receipt
        room = await self.get_room_from_message(message)
        await self.safe_group_send(
            room.get_channel_group_name(),
            {
                'type': 'read_receipt',
                'message_id': message_id,
                'room_id': str(room.id),
                'user_id': str(self.user.id),
                'username': self.user.username,
            }
        )

    # ─── Server → Client senders ───────────────────────────────────
    # These methods are called by group_send — they push JSON to the client.
    # The method name must match the 'type' in group_send, with dots→underscores.

    async def chat_message(self, event):
        """Pushes a new message to this specific WebSocket connection."""
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message_id': event['message_id'],
            'room_id': event['room_id'],
            'sender_id': event['sender_id'],
            'sender_username': event['sender_username'],
            'content': event['content'],
            'created_at': event['created_at'],
        }))

    async def typing_indicator(self, event):
        """Pushes typing status to this connection."""
        await self.send(text_data=json.dumps({
            'type': 'typing_indicator',
            'room_id': event['room_id'],
            'user_id': event['user_id'],
            'username': event['username'],
            'is_typing': event['is_typing'],
        }))

    async def read_receipt(self, event):
        """Pushes read receipt to this connection."""
        await self.send(text_data=json.dumps({
            'type': 'message_read',
            'message_id': event['message_id'],
            'room_id': event['room_id'],
            'user_id': event['user_id'],
            'username': event['username'],
        }))

    async def online_status(self, event):
        """Pushes online/offline status to this connection."""
        await self.send(text_data=json.dumps({
            'type': 'online_status',
            'user_id': event['user_id'],
            'username': event['username'],
            'is_online': event['is_online'],
        }))

    # ─── Channel layer helpers ────────────────────────────────────
    async def safe_group_send(self, group_name, message):
        """
        Safely send a message to a group, handling Redis timeouts gracefully.
        If Redis is unavailable, log the error but don't crash the connection.
        """
        try:
            await self.channel_layer.group_send(group_name, message)
        except Exception as e:
            # Log but don't crash — the connection should stay alive
            print(f'Error sending to group {group_name}: {e}')

    # ─── Database helpers ──────────────────────────────────────────
    # All DB operations must be wrapped in database_sync_to_async
    # because the consumer runs in async context but Django ORM is sync.

    @database_sync_to_async
    def get_user_rooms(self):
        return list(Room.objects.filter(members=self.user))

    @database_sync_to_async
    def get_room(self, room_id):
        try:
            return Room.objects.get(id=room_id, members=self.user)
        except Room.DoesNotExist:
            return None  # user is not a member — reject silently

    @database_sync_to_async
    def get_message(self, message_id):
        try:
            return Message.objects.select_related('room').get(id=message_id)
        except Message.DoesNotExist:
            return None

    @database_sync_to_async
    def get_room_from_message(self, message):
        return message.room

    @database_sync_to_async
    def save_message(self, room, content):
        return Message.objects.create(
            room=room,
            sender=self.user,
            content=content,
        )

    @database_sync_to_async
    def mark_message_read(self, message):
        """Returns True if already read, False if newly marked."""
        obj, created = MessageRead.objects.get_or_create(
            message=message,
            user=self.user,
        )
        return not created  # created=True means it's new

    @database_sync_to_async
    def set_user_online(self, is_online):
        from django.utils import timezone
        User.objects.filter(id=self.user.id).update(
            is_online=is_online,
            last_seen=timezone.now() if not is_online else None,
        )

    @database_sync_to_async
    def get_user_contact_rooms(self):
        return list(Room.objects.filter(members=self.user))

    async def broadcast_online_status(self, is_online):
        """
        Tell everyone in every shared room that this user
        came online or went offline.
        """
        rooms = await self.get_user_contact_rooms()
        notified_groups = set()

        for room in rooms:
            group = room.get_channel_group_name()
            if group in notified_groups:
                continue  # avoid sending to same group twice
            notified_groups.add(group)

            await self.safe_group_send(group, {
                'type': 'online_status',
                'user_id': str(self.user.id),
                'username': self.user.username,
                'is_online': is_online,
            })