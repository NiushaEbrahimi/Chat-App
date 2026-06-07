# apps/chat/views.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Room, Message
from .serializers import RoomSerializer, MessageSerializer


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


class MessageListView(generics.ListAPIView):
    """
    GET — fetch message history for a room (paginated, newest first)
    Used for infinite scroll — React Query's useInfiniteQuery calls this
    with a cursor/page param.
    """
    serializer_class = MessageSerializer
    permission_classes = (permissions.IsAuthenticated,)

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