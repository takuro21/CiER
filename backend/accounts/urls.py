from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # 認証関連
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', views.profile, name='profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('badges/', views.BadgeListView.as_view(), name='badge_list'),
    
    # サロン管理
    path('salons/', views.SalonListCreateView.as_view(), name='salon_list_create'),
    path('salons/<int:pk>/', views.SalonDetailView.as_view(), name='salon_detail'),
    
    # スタッフ管理
    path('staff/', views.staff_list, name='staff_list'),
    path('staff/<int:user_id>/role/', views.update_staff_role, name='update_staff_role'),
    
    # スタイリストプロフィール
    path('stylist-profiles/', views.StylistProfileListCreateView.as_view(), name='stylist_profile_list_create'),
    path('stylist-profiles/<int:pk>/', views.StylistProfileDetailView.as_view(), name='stylist_profile_detail'),
    
    # 予約関連
    path('available-stylists/', views.available_stylists, name='available_stylists'),
    path('auto-assign-stylist/', views.auto_assign_stylist, name='auto_assign_stylist'),
]
