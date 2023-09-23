import json
from .models import MultiplayerGame

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer

class GameConsumer(WebsocketConsumer):
    def connect(self):
        self.game_id = self.scope["url_route"]["kwargs"]["game_id"]
        self.game_group_name = "multiplayer_%s" % self.game_id

        user = self.scope["user"]
        game = MultiplayerGame.objects.get(pk=self.game_id)
        if (game.status != 1):
            return
        
        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.game_group_name, self.channel_name
        )
        
        if user == game.owner:
            game.owner_online = True
        elif user == game.opponent:
            game.opponent_online = True
        game.save()

        self.accept()
        if game.owner_online and game.opponent_online and game.status == 1:
            game.status = 2
            game.save()
            async_to_sync(self.channel_layer.group_send)(
            self.game_group_name, {"type": "setup", "ownerName": game.owner.username, "opponentName": game.opponent.username}
            )

    def disconnect(self, close_code):
        game = MultiplayerGame.objects.get(pk=self.game_id)
        if (game.status == 1):
            game.status = 3
        elif (game.status == 2):
            # send disconnect game winning message
            game.status = 3
            user = self.scope["user"]
            if (game.owner == user):
                game.winner = "opponent"
            else:
                game.winner = "owner"
            game.save()
        # Leave room group
        async_to_sync(self.channel_layer.group_discard)(
            self.game_group_name, self.channel_name
        )
        pass

    def setup(self, event):
        self.send(text_data=json.dumps(event))

    # Receive message from WebSocket
    def receive(self, text_data):
        # TODO: THIS IS PRETTY STUPID LOGIC RIGHT NOW, CHECK WHICH PARTS ARE NECESSARY
        text_data_json = json.loads(text_data)
        if text_data_json['type'] == 'cards':
            async_to_sync(self.channel_layer.group_send)(
            self.game_group_name, text_data_json
        )
        if text_data_json['type'] == 'move':
            async_to_sync(self.channel_layer.group_send)(
            self.game_group_name, text_data_json
        )
        if text_data_json['type'] == 'interrupt':
            async_to_sync(self.channel_layer.group_send)(
            self.game_group_name, text_data_json
        )
        if text_data_json['type'] == 'game_over':
            async_to_sync(self.channel_layer.group_send)(
            self.game_group_name, text_data_json
        )
        return

    # Receive message from room group
    def move(self, data):
        # Send message to WebSocket
        self.send(text_data=json.dumps(data))
    
    def cards(self, event):
        self.send(text_data=json.dumps(event))

    def names(self, data):
        self.send(text_data=json.dumps(data))
    
    def game_over(self, data):       
        game = MultiplayerGame.objects.get(pk=self.game_id)
        game.winner = data["winner"]
        game.status = 3
        game.save()
        # TODO: change to setWinner and ratings calculations within models



class ChatConsumer(WebsocketConsumer):
    def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = "multiplayer_%s" % self.room_name

        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name, self.channel_name
        )

        self.accept()

    def disconnect(self, close_code):
        # Leave room group
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name, self.channel_name
        )

    # Receive message from WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]

        # Send message to room group
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name, {"type": "chat_message", "message": message}
        )

    # Receive message from room group
    def chat_message(self, event):
        message = event["message"]

        # Send message to WebSocket
        self.send(text_data=json.dumps({"message": message}))