from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Badge, Salon, StylistProfile


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
    can_manage_staff = serializers.SerializerMethodField()
    stylist_profile = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'user_type',
            'phone_number', 'first_name', 'last_name',
            'profile_image', 'created_at', 'total_bookings',
            'referral_count', 'badges', 'is_manager', 
            'is_owner', 'can_manage_staff', 'stylist_profile'
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
    
    def get_can_manage_staff(self, obj):
        return obj.can_manage_staff()
    
    def get_stylist_profile(self, obj):
        if hasattr(obj, 'new_stylist_profile'):
            return StylistProfileSerializer(obj.new_stylist_profile).data
        return None


class SalonSerializer(serializers.ModelSerializer):
    stylists_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Salon
        fields = [
            'id', 'name', 'address', 'phone_number', 'email',
            'description', 'opening_time', 'closing_time',
            'auto_assign_enabled', 'stylists_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_stylists_count(self, obj):
        return obj.stylists.filter(is_active=True).count()


class StylistProfileSerializer(serializers.ModelSerializer):
    user_info = UserSerializer(source='user', read_only=True)
    salon_info = SalonSerializer(source='salon', read_only=True)
    
    class Meta:
        model = StylistProfile
        fields = [
            'id', 'user', 'salon', 'bio', 'experience_years',
            'specialties', 'working_hours_start', 'working_hours_end',
            'accepts_walk_ins', 'priority_level', 'is_active',
            'user_info', 'salon_info', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class StylistManagementSerializer(serializers.ModelSerializer):
    """管理者用スタイリスト管理シリアライザー"""
    user_info = serializers.SerializerMethodField()
    profile_info = serializers.SerializerMethodField()
    recent_appointments = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_manager', 'is_owner', 'is_active', 'user_info',
            'profile_info', 'recent_appointments'
        ]
    
    def get_user_info(self, obj):
        return {
            'full_name': obj.get_full_name() or obj.username,
            'phone_number': obj.phone_number,
            'user_type': obj.get_user_type_display(),
        }
    
    def get_profile_info(self, obj):
        if hasattr(obj, 'new_stylist_profile'):
            profile = obj.new_stylist_profile
            return {
                'bio': profile.bio,
                'experience_years': profile.experience_years,
                'working_hours': f"{profile.working_hours_start} - {profile.working_hours_end}",
                'accepts_walk_ins': profile.accepts_walk_ins,
                'priority_level': profile.priority_level,
            }
        return None
    
    def get_recent_appointments(self, obj):
        # 最近の予約数を取得
        from bookings.models import Appointment
        from django.utils import timezone
        from datetime import timedelta
        
        recent_date = timezone.now() - timedelta(days=30)
        return Appointment.objects.filter(
            stylist=obj,
            appointment_date__gte=recent_date
        ).count()


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ['id', 'badge_type', 'earned_date', 'referral_count']
