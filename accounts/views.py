from django.contrib.auth.forms import UserCreationForm
from django.urls import reverse_lazy
from django.views import generic
from django.views.generic.edit import CreateView

from .forms import OnitamaUserCreationForm


class SignUpView(generic.CreateView):
    form_class = OnitamaUserCreationForm
    success_url = reverse_lazy("login")
    template_name = "registration/signup.html"