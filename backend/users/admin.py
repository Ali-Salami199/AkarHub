from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    model = User
    fieldsets = UserAdmin.fieldsets + (
        ('معلومات إضافية', {'fields': ('role', 'phone_number', 'city', 'profile_image', 'is_verified')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('معلومات إضافية', {'fields': ('role', 'phone_number', 'city', 'profile_image', 'is_verified')}),
    )

admin.site.register(User, CustomUserAdmin)
