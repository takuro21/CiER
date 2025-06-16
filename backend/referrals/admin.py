from django.contrib import admin
from .models import ReferralLink, Referral


@admin.register(ReferralLink)
class ReferralLinkAdmin(admin.ModelAdmin):
    list_display = ['referrer', 'referral_code', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['referrer__username']
    readonly_fields = ['referral_code']


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = ['referrer', 'referred_user', 'is_successful', 'created_at']
    list_filter = ['is_successful', 'created_at']
    search_fields = ['referrer__username', 'referred_user__username']
