from django.db import models
from django.contrib.auth.models import User
import uuid

class MultiplayerGame(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE,related_name="owner")
    opponent = models.ForeignKey(User, on_delete=models.CASCADE,related_name="opponent", null=True)
    owner_color= models.CharField(max_length=10)
    owner_online = models.BooleanField(default=False)
    opponent_online = models.BooleanField(default=False)
    winner = models.CharField(max_length=20, null=True, blank=True)
    CHOICES=(
        (1,"Created"),
        (2,"Started"),
        (3,"Ended"))
    status = models.IntegerField(default=1,choices=CHOICES)