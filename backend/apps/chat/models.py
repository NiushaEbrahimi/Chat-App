import uuid
from django.db import models
from django.conf import settings


class Room(models.Model):
    """
    Represents a conversation — either a DM between two users
    or a group chat with multiple members.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, null=True, blank=True)  # null for DMs
    is_group = models.BooleanField(default=False)
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='rooms'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_rooms'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    avatar = models.ImageField(upload_to='room_avatars/', null=True, blank=True)
    is_saved_messages = models.BooleanField(default=False)

    def __str__(self):
        return self.name or f"DM ({self.id})"

    def get_channel_group_name(self):
        # this is the Redis channel group name for this room
        # all members of this room subscribe to this group
        return f"room_{self.id.hex}"
    def get_avatar(self, requesting_user):
        # saved messages → use a fixed default (or None, handle in frontend)
        if self.is_saved_messages:
            return None  # frontend shows a Bookmark icon instead

        # DM → return the other person's avatar
        if not self.is_group:
            other = self.members.exclude(id=requesting_user.id).first()
            return other.avatar.url if other and other.avatar else None

        # group → return the group's own uploaded avatar
        return self.avatar.url if self.avatar else None


class Message(models.Model):
    class MessageType(models.TextChoices):
        TEXT = 'text', 'Text'
        IMAGE = 'image', 'Image'
        FILE = 'file', 'File'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    content = models.TextField(blank=True)
    message_type = models.CharField(
        max_length=10,
        choices=MessageType.choices,
        default=MessageType.TEXT
    )
    attachment = models.FileField(upload_to='attachments/', null=True, blank=True)
    is_edited = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    # db_index=True because we query messages by time constantly

    class Meta:
        ordering = ['created_at']  # oldest first

    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"


class MessageRead(models.Model):
    """
    Tracks which users have read which messages.
    One row per user per message.
    """
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reads')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('message', 'user')  # can't read the same message twice


class Reaction(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    emoji = models.CharField(max_length=10)  # stores the actual emoji character

    class Meta:
        unique_together = ('message', 'user', 'emoji')  # one of each emoji per user