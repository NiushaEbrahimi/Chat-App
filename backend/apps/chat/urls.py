# apps/chat/urls.py
from django.urls import path
from .views import RoomListCreateView, MessageListView

urlpatterns = [
    path('rooms/', RoomListCreateView.as_view()),
    path('rooms/<uuid:room_id>/messages/', MessageListView.as_view()),
]