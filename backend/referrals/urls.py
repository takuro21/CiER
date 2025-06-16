from django.urls import path
from . import views

urlpatterns = [
    path('link/', views.get_referral_link, name='get_referral_link'),
    path('qr-code/', views.get_qr_code, name='get_qr_code'),
    path('list/', views.ReferralListView.as_view(), name='referral_list'),
    path('stats/', views.referral_stats, name='referral_stats'),
    path('validate/<uuid:code>/', views.validate_referral_code, name='validate_referral_code'),
]
