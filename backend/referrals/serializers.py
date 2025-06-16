from rest_framework import serializers
from .models import ReferralLink, Referral
from accounts.serializers import UserSerializer


class ReferralLinkSerializer(serializers.ModelSerializer):
    referral_url = serializers.ReadOnlyField()
    
    class Meta:
        model = ReferralLink
        fields = ['id', 'referral_code', 'referral_url', 'is_active', 'created_at']


class ReferralSerializer(serializers.ModelSerializer):
    referrer = UserSerializer(read_only=True)
    referred_user = UserSerializer(read_only=True)
    
    class Meta:
        model = Referral
        fields = [
            'id', 'referrer', 'referred_user', 'is_successful', 'created_at'
        ]
