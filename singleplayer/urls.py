from django.urls import path
from . import views

app_name = "singleplayer"
urlpatterns = [
    path("", views.home, name="home"),
    path("game/", views.game, name="game"),
    path("move/", views.user_move, name="move"),
    path("setup/", views.setup, name="setup"),
    path("AIsettings/", views.AIsettings, name="AIsettings")
]