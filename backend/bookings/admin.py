from django.contrib import admin
from .models import Service, Stylist, Appointment


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'duration_minutes', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name']


@admin.register(Stylist)
class StylistAdmin(admin.ModelAdmin):
    list_display = ['user', 'experience_years', 'is_available']
    list_filter = ['is_available']
    search_fields = ['user__username']


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['customer', 'stylist', 'service', 'appointment_date', 'status']
    list_filter = ['status', 'appointment_date']
    search_fields = ['customer__username', 'stylist__user__username']
    date_hierarchy = 'appointment_date'
