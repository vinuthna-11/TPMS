# backend/tpms/asgi.py
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from api.middleware import TokenAuthMiddleware # Import your new middleware
import api.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tpms.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": TokenAuthMiddleware( # Use your new middleware here
        URLRouter(
            api.routing.websocket_urlpatterns
        )
    ),
})