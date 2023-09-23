from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import OnitamaUser
class OnitamaUserAdmin(UserAdmin):
    pass

# Register your models here.
admin.site.register(OnitamaUser, OnitamaUserAdmin)