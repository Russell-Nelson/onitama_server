from django.db import models
from django.contrib.auth.models import AbstractUser

class OnitamaUser(AbstractUser):
    rating = models.IntegerField(default=1000)

    def __str__(self):
        return f"{self.username} ({self.rating})"