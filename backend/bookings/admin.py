from django.contrib import admin
from .models import Service, Stylist, Appointment, StylistService, StylistBookingLink, ManualAppointment


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


@admin.register(StylistService)
class StylistServiceAdmin(admin.ModelAdmin):
    list_display = ['stylist', 'service', 'duration_minutes', 'effective_price', 'is_available']
    list_filter = ['is_available', 'service']
    search_fields = ['stylist__user__username', 'service__name']


@admin.register(StylistBookingLink)
class StylistBookingLinkAdmin(admin.ModelAdmin):
    list_display = ['stylist', 'unique_code', 'is_active', 'allow_guest_booking', 'created_at']
    list_filter = ['is_active', 'allow_guest_booking']
    search_fields = ['stylist__user__username', 'unique_code']
    readonly_fields = ['unique_code', 'booking_url', 'created_at', 'updated_at']


@admin.register(ManualAppointment)
class ManualAppointmentAdmin(admin.ModelAdmin):
    list_display = ['customer_name', 'stylist', 'service', 'appointment_date', 'duration_minutes', 'is_confirmed']
    list_filter = ['is_confirmed', 'service', 'stylist']
    search_fields = ['customer_name', 'customer_phone', 'stylist__user__username']
    date_hierarchy = 'appointment_date'
    readonly_fields = ['created_at', 'updated_at']
