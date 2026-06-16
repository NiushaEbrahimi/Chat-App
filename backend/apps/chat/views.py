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