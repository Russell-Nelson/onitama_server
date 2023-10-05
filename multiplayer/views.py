from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login
from django.http import HttpResponseRedirect
from django.urls import reverse
from .models import MultiplayerGame
from .models import OnitamaUser
import random

@login_required
def lobby(request):
    return render(request, "multiplayer/lobby.html", {
        "games": MultiplayerGame.objects.filter(status=1),
        "leaders": OnitamaUser.objects.all().order_by('-rating').values()[0:5]
    })

def test(request):
    return render(request, "multiplayer/designtest.html")

def room(request, room_name):
    return render(request, "multiplayer/room.html", {"room_name": room_name})

@login_required
def game(request, game_id):
    game = MultiplayerGame.objects.get(pk=game_id)
    colors = ["red", "blue"]
    username = request.user.username
    rating = request.user.rating
    if request.user == game.owner:
        is_owner = "true"
        user_color = game.owner_color
        colors.remove(user_color)
        opponent_color = colors[0]
    else:
        is_owner = "false"
        opponent_color = game.owner_color
        colors.remove(opponent_color)
        user_color = colors[0]
        
    return render(request, "multiplayer/game.html", 
                  {"game_id": game_id, 
                   "user_color": user_color,
                   "opponent_color": opponent_color,
                   "is_owner": is_owner,
                   "username": username,
                   "rating": rating})

@login_required
def create(request):
    color = random.choice(["red", "blue"])
    game = MultiplayerGame(owner=request.user, owner_color=color)
    game.save()
    return HttpResponseRedirect(reverse("multiplayer:game", args=(game.id,)))

@login_required
def join(request, game_id):
    game = MultiplayerGame.objects.get(pk=game_id)
    if (game.owner == request.user or game.opponent == request.user):
        return HttpResponseRedirect(reverse("multiplayer:game", args=(game.id,)))
    if (game.opponent is not None):
        return HttpResponseRedirect(reverse("index"))
    
    game.opponent = request.user
    game.save()
    return HttpResponseRedirect(reverse("multiplayer:game", args=(game.id,)))


    
