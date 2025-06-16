from django.urls import path
from . import views

urlpatterns = [
    path('', views.get_notifications, name='get-notifications'),
    path('<int:notification_id>/', views.mark_notification_read, name='mark-notification-read'),
    path('<int:notification_id>/delete/', views.delete_notification, name='delete-notification'),
    path('mark-all-read/', views.mark_all_notifications_read, name='mark-all-notifications-read'),
    path('unread-count/', views.get_unread_count, name='get-unread-count'),
    path('preferences/', views.notification_preferences, name='notification-preferences'),
]
