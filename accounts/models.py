from django.db import models
from django.contrib.auth.models import AbstractUser

class OnitamaUser(AbstractUser):
    rating = models.IntegerField(default=1000)