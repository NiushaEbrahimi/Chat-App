# config/asgi.py
import os
import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# import routing AFTER django.setup() — order matters here
from apps.chat.routing import websocket_urlpatterns
from apps.chat.middleware import JWTAuthMiddleware

application = ProtocolTypeRouter({
    # regular HTTP requests go through Django as normal
    'http': get_asgi_application(),

    # WebSocket requests go through your consumer
    # JWTAuthMiddleware authenticates the WS connection using the token
    'websocket': JWTAuthMiddleware(
        URLRouter(websocket_urlpatterns)
    ),
})