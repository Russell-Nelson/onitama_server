from django.urls import path

from . import views

app_name = "multiplayer"
urlpatterns = [
    path("", views.lobby, name="lobby"),
    path("test/", views.test, name="test"),
    path("create/", views.create, name="create"),
    path("join/<str:game_id>/", views.join, name="join"),
    path("<str:game_id>/", views.game, name="game"),
]