# apps/chat/views.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Room, Message
from .serializers import RoomSerializer, MessageSerializer
from .pagination import MessageCursorPagination
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

class RoomListCreateView(generics.ListCreateAPIView):
    """
    GET  — list all rooms the current user is a member of
    POST — create a new room (DM or group)
    """
    serializer_class = RoomSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        # only return rooms this user belongs to
        return Room.objects.filter(
            members=self.request.user
        ).prefetch_related('members', 'messages').order_by('-created_at')

    def create(self, request, *args, **kwargs):
        print("REQUEST DATA:", request.data)

        is_group = request.data.get('is_group', False)
        member_ids = request.data.get('member_ids', [])
        print("is_group =", is_group)
        print("member_ids =", member_ids)

        if not is_group:
            existing = Room.objects.filter(
                is_group=False,
                members=request.user
            )
            for member_id in member_ids:
                existing = existing.filter(members__id=member_id)
            print("Rooms for current user:")
            print(
                list(
                    Room.objects.filter(
                        is_group=False,
                        members=request.user
                    ).values("id")
                )
            )

            print("Final queryset:")
            print(list(existing.values("id")))
            if existing.exists():
                room = existing.first()
                serializer = self.get_serializer(room)
                return Response(serializer.data, status=status.HTTP_200_OK)

        return super().create(request, *args, **kwargs)


class RoomDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    — retrieve room details
    PATCH  — update room (name, avatar)
    DELETE — delete room (only creator or group creator can delete)
    """
    serializer_class = RoomSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Room.objects.filter(members=self.request.user)

    def destroy(self, request, *args, **kwargs):
        room = self.get_object()
        # Only the room creator can delete, or if it's a DM, any member can delete for themselves
        if room.is_group and room.created_by != request.user:
            return Response(
                {'detail': 'Only the group creator can delete this group.'},
                status=status.HTTP_403_FORBIDDEN
            )
        # For DMs, remove the user from the room instead of deleting
        if not room.is_group:
            room.members.remove(request.user)
            if room.members.count() == 0:
                room.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        # For groups, delete the entire room
        room.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MessageListView(generics.ListAPIView):
    """
    GET — fetch message history for a room (paginated, newest first)
    Used for infinite scroll — React Query's useInfiniteQuery calls this
    with a cursor/page param.
    """
    serializer_class = MessageSerializer
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = MessageCursorPagination

    def get_queryset(self):
        room_id = self.kwargs['room_id']

        # verify user is a member before returning messages
        try:
            room = Room.objects.get(id=room_id, members=self.request.user)
        except Room.DoesNotExist:
            return Message.objects.none()

        return room.messages.select_related('sender').prefetch_related(
            'reads', 'reactions'
        ).order_by('-created_at')  # newest first for infinite scroll


class ClearMessagesView(APIView):
    """
    DELETE — clear all messages in a room (only room creator can do this)
    """
    permission_classes = (permissions.IsAuthenticated,)

    def delete(self, request, room_id):
        try:
            room = Room.objects.get(id=room_id, members=request.user)
        except Room.DoesNotExist:
            return Response(
                {'detail': 'Room not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Only creator can clear messages
        if room.created_by != request.user:
            return Response(
                {'detail': 'Only the room creator can clear messages.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Delete all messages in the room
        room.messages.all().delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
    

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def saved_messages_room(request):
    room, created = Room.objects.get_or_create(
        created_by=request.user,
        is_saved_messages=True,
        defaults={
            'name': 'Saved Messages',
        }
    )
    if created:
        room.members.add(request.user)
    
    serializer = RoomSerializer(room, context={'request': request})
    return Response(serializer.data)