# Generated by Django 4.2.3 on 2023-09-14 13:31

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='MultiplayerGame',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('owner_color', models.CharField(max_length=10)),
                ('owner_online', models.BooleanField(default=False)),
                ('opponent_online', models.BooleanField(default=False)),
                ('winner', models.CharField(blank=True, max_length=20, null=True)),
                ('status', models.IntegerField(choices=[(1, 'Created'), (2, 'Started'), (3, 'Ended')], default=1)),
                ('opponent', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='opponent', to=settings.AUTH_USER_MODEL)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='owner', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
