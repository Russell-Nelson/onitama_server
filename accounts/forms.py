from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import OnitamaUser

class OnitamaUserCreationForm(UserCreationForm):

    class Meta(UserCreationForm):
        model = OnitamaUser
        fields = ('username',)

class OnitamaUserChangeForm(UserChangeForm):

    class Meta(UserChangeForm):
        model = OnitamaUser
        fields = ('username',)