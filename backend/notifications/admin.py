from django.contrib import admin
from .models import Notification, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'type', 'read', 'urgent', 'created_at']
    list_filter = ['type', 'read', 'urgent', 'created_at']
    search_fields = ['title', 'message', 'user__username']
    ordering = ['-created_at']
    readonly_fields = ['created_at']


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'email_notifications', 'appointment_reminders', 'cancellation_alerts']
    search_fields = ['user__username']
