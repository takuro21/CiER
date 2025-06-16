from django.urls import path
from . import views

urlpatterns = [
    path('services/', views.ServiceListView.as_view(), name='service_list'),
    path('stylists/', views.StylistListView.as_view(), name='stylist_list'),
    path('appointments/', views.create_appointment, name='create_appointment'),
    path('appointments/list/', views.appointment_list, name='appointment_list'),
    path('appointments/available-slots/', views.get_available_time_slots, name='available_time_slots'),
    path('stripe/webhook/', views.stripe_webhook, name='stripe_webhook'),
]
