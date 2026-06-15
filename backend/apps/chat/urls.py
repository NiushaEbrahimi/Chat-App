# apps/chat/urls.py
from django.urls import path
from .views import RoomListCreateView, MessageListView, saved_messages_room

urlpatterns = [
    path('rooms/', RoomListCreateView.as_view()),
    path('rooms/saved/', saved_messages_room),
    path('rooms/<uuid:room_id>/messages/', MessageListView.as_view()),
]