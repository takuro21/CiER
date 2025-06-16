from django.db import models
from django.contrib.auth.models import User
from django.conf import settings
from django.utils import timezone
import json


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('appointment', '予約'),
        ('cancellation', 'キャンセル'),
        ('reminder', 'リマインダー'),
        ('system', 'システム'),
        ('review', 'レビュー'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    read = models.BooleanField(default=False)
    urgent = models.BooleanField(default=False)
    data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"


class NotificationPreference(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_preferences')
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    appointment_reminders = models.BooleanField(default=True)
    cancellation_alerts = models.BooleanField(default=True)
    review_notifications = models.BooleanField(default=True)
    system_notifications = models.BooleanField(default=True)
    
    def __str__(self):
        return f"通知設定 - {self.user.username}"
