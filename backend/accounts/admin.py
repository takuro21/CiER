from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Badge


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'user_type', 'is_staff', 'is_active']
    list_filter = ['user_type', 'is_staff', 'is_active']
    fieldsets = UserAdmin.fieldsets + (
        ('追加情報', {'fields': ('user_type', 'phone_number', 'profile_image')}),
    )


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ['user', 'badge_type', 'referral_count', 'earned_date']
    list_filter = ['badge_type', 'earned_date']
    search_fields = ['user__username']
