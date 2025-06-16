from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Badge


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'password_confirm',
            'user_type', 'phone_number', 'first_name', 'last_name'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("パスワードが一致しません。")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('ユーザー名またはパスワードが正しくありません。')
            if not user.is_active:
                raise serializers.ValidationError('このアカウントは無効です。')
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('ユーザー名とパスワードの両方を入力してください。')


class UserSerializer(serializers.ModelSerializer):
    total_bookings = serializers.SerializerMethodField()
    referral_count = serializers.SerializerMethodField()
    badges = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'user_type',
            'phone_number', 'first_name', 'last_name',
            'profile_image', 'created_at', 'total_bookings',
            'referral_count', 'badges'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_total_bookings(self, obj):
        # 予約数を取得
        from bookings.models import Appointment
        return Appointment.objects.filter(customer=obj).count()
    
    def get_referral_count(self, obj):
        # 紹介数を取得
        return obj.referrals_made.filter(is_successful=True).count()
    
    def get_badges(self, obj):
        # バッジを取得
        badges = obj.badges.all()
        return [{'id': b.id, 'name': b.get_badge_type_display(), 'icon': '🏆'} for b in badges]


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ['id', 'badge_type', 'earned_date', 'referral_count']
