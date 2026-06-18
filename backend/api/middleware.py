# backend/api/middleware.py
from django.db import close_old_connections
# We remove the model imports from the top of the file
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async

@database_sync_to_async
def get_user(token_key):
    # --- THIS IS THE FIX ---
    # We import the models here, inside the function, so they are only
    # loaded after the main Django app is ready.
    from rest_framework.authtoken.models import Token
    from django.contrib.auth.models import AnonymousUser
    
    try:
        if token_key:
            token = Token.objects.get(key=token_key)
            return token.user
    except Token.DoesNotExist:
        return AnonymousUser()
    return AnonymousUser()

class TokenAuthMiddleware(BaseMiddleware):
    def __init__(self, inner):
        super().__init__(inner)

    async def __call__(self, scope, receive, send):
        close_old_connections()
        try:
            # Get the token from the query string of the WebSocket URL
            token_key = (dict((x.split('=') for x in scope['query_string'].decode().split("&")))).get('token', None)
        except ValueError:
            token_key = None

        scope['user'] = await get_user(token_key)
        return await super().__call__(scope, receive, send)