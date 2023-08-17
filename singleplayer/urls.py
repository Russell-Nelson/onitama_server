from django.urls import path
from . import views

urlpatterns = {
    path("", views.index, name="index"),
    path("move/", views.user_move, name="move"),
    path("setup/", views.setup, name="setup")
}