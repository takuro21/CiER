from django.urls import path
from . import views

urlpatterns = [
    path('services/', views.ServiceListView.as_view(), name='service_list'),
    path('stylists/', views.StylistListView.as_view(), name='stylist_list'),
    path('appointments/', views.create_appointment, name='create_appointment'),
    path('appointments/list/', views.appointment_list, name='appointment_list'),
    path('appointments/available-slots/', views.get_available_time_slots, name='available_time_slots'),
    path('stripe/webhook/', views.stripe_webhook, name='stripe_webhook'),
    
    # ブッキングリンク管理
    path('booking-link/', views.manage_booking_link, name='manage_booking_link'),
    path('booking-code/<str:booking_code>/', views.get_stylist_by_booking_code, name='get_stylist_by_booking_code'),
    
    # 手動予約管理
    path('manual-appointments/', views.manual_appointments, name='manual_appointments'),
    path('manual-appointments/<int:appointment_id>/', views.manual_appointment_detail, name='manual_appointment_detail'),
    
    # 指名なし予約（自動割り当て）
    path('walk-in/appointment/', views.create_walk_in_appointment, name='create_walk_in_appointment'),
    path('walk-in/available-times/', views.get_available_walk_in_times, name='get_available_walk_in_times'),
]
