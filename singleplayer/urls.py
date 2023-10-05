from django.urls import path
from . import views

app_name = "singleplayer"
urlpatterns = [
    path("", views.home, name="home"),
    path("game/", views.game, name="game"),
    path("game/move/", views.user_move, name="move"),
    path("game/setup/", views.setup, name="setup"),
    path("game/AIsettings/", views.AIsettings, name="AIsettings")
]