from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin

from .forms import OnitamaUserCreationForm, OnitamaUserChangeForm
from .models import OnitamaUser

class OnitamaUserAdmin(UserAdmin):
    add_form = OnitamaUserCreationForm
    form = OnitamaUserChangeForm
    model = OnitamaUser
    list_display = ['username']
    # fieldsets = UserAdmin.fieldsets + (
    #         (None, {'fields': ('mobile_number', 'birth_date')}),
    # ) #this will allow to change these fields in admin module




# Register your models here.
admin.site.register(OnitamaUser, OnitamaUserAdmin)