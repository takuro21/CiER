from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Badge, Salon, StylistProfile


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'user_type', 'is_manager', 'is_owner', 'is_staff', 'is_active']
    list_filter = ['user_type', 'is_manager', 'is_owner', 'is_staff', 'is_active']
    fieldsets = UserAdmin.fieldsets + (
        ('追加情報', {'fields': ('user_type', 'phone_number', 'profile_image')}),
        ('権限管理', {'fields': ('is_manager', 'is_owner')}),
    )
    search_fields = ['username', 'email', 'first_name', 'last_name']


@admin.register(Salon)
class SalonAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone_number', 'opening_time', 'closing_time', 'auto_assign_enabled', 'created_at']
    list_filter = ['auto_assign_enabled', 'created_at']
    search_fields = ['name', 'address']
    fieldsets = (
        ('基本情報', {
            'fields': ('name', 'address', 'phone_number', 'email', 'description')
        }),
        ('営業設定', {
            'fields': ('opening_time', 'closing_time', 'auto_assign_enabled')
        }),
    )


@admin.register(StylistProfile)
class StylistProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'salon', 'experience_years', 'accepts_walk_ins', 'priority_level', 'is_active']
    list_filter = ['salon', 'accepts_walk_ins', 'is_active', 'experience_years']
    search_fields = ['user__username', 'user__first_name', 'user__last_name']
    fieldsets = (
        ('基本情報', {
            'fields': ('user', 'salon', 'bio', 'experience_years', 'specialties')
        }),
        ('勤務設定', {
            'fields': ('working_hours_start', 'working_hours_end', 'is_active')
        }),
        ('予約設定', {
            'fields': ('accepts_walk_ins', 'priority_level')
        }),
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        elif hasattr(request.user, 'can_manage_staff') and request.user.can_manage_staff():
            # 管理者は管理可能なスタイリストのみ表示
            manageable_users = request.user.get_manageable_users()
            return qs.filter(user__in=manageable_users)
        else:
            # 一般ユーザーは自分のプロフィールのみ
            return qs.filter(user=request.user)


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ['user', 'badge_type', 'referral_count', 'earned_date']
    list_filter = ['badge_type', 'earned_date']
    search_fields = ['user__username']
