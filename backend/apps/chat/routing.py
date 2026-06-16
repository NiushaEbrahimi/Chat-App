# apps/chat/routing.py
from django.urls import re_path
from .consumer import ChatConsumer

# WebSocket URL patterns — separate from your REST urls.py
# re_path because WebSocket URLs need regex
websocket_urlpatterns = [
    re_path(r'^ws/chat/$', ChatConsumer.as_asgi()),
]