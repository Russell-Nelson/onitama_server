from django.db import models
from accounts.models import OnitamaUser
import uuid

class MultiplayerGame(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(OnitamaUser, on_delete=models.CASCADE,related_name="owner")
    opponent = models.ForeignKey(OnitamaUser, on_delete=models.CASCADE,related_name="opponent", null=True)
    owner_color= models.CharField(max_length=10)
    owner_online = models.BooleanField(default=False)
    opponent_online = models.BooleanField(default=False)
    winner = models.CharField(max_length=20, null=True, blank=True)
    CHOICES=(
        (1,"Created"),
        (2,"Started"),
        (3,"Ended"))
    status = models.IntegerField(default=1,choices=CHOICES)

    def setWinner(self, winner):
        self.status = 3
        self.winner = winner
        k = 32

        if winner == "owner":
            winningUser = self.owner
            losingUser = self.opponent
        else:
            winningUser = self.opponent
            losingUser = self.owner
        
        winningProbability = 1 / ( 1 + 10 ** ((losingUser.rating - winningUser.rating) / 400) )
        winningUser.rating += round(k * ( 1 - winningProbability))

        losingProbability = 1 / ( 1 + 10 ** ((winningUser.rating - losingUser.rating) / 400) )
        losingUser.rating += round(k * ( 0 - losingProbability))

        winningUser.save()
        losingUser.save()        
        self.save()
