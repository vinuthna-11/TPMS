# backend/api/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if not self.user.is_authenticated:
            await self.close()
            return
        
        self.room_group_name = f'chat_{self.user.id}'
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        from .models import User # Delayed import
        data = json.loads(text_data)
        message = data['message']
        receiver_id = data['receiver_id']
        
        new_message = await self.save_message(receiver_id, message)
        if new_message is None: return

        message_data = {
            'message': new_message.message,
            'sender': new_message.sender.id,
            'receiver': new_message.receiver.id,
            'timestamp': new_message.timestamp.isoformat()
        }
        
        await self.channel_layer.group_send(f'chat_{receiver_id}', { 
            'type': 'chat_message', 
            'message_data': message_data 
        })

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['message_data']))

    @sync_to_async
    def save_message(self, receiver_id, message):
        from .models import ChatMessage, User
        try:
            receiver = User.objects.get(id=receiver_id)
            chat_message = ChatMessage.objects.create(sender=self.user, receiver=receiver, message=message)
            return chat_message
        except User.DoesNotExist:
            print(f"ERROR: Receiver user with id {receiver_id} not found.")
            return None