from rest_framework import serializers
from .models import Service, Stylist, Appointment, StylistService
from accounts.serializers import UserSerializer


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'name', 'description', 'duration_minutes', 'price', 'is_active']


class StylistServiceSerializer(serializers.ModelSerializer):
    """スタイリスト固有のサービス情報"""
    service = ServiceSerializer(read_only=True)
    effective_price = serializers.ReadOnlyField()
    
    class Meta:
        model = StylistService
        fields = ['id', 'service', 'duration_minutes', 'price_override', 'effective_price', 'is_available']


class StylistSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    services = ServiceSerializer(many=True, read_only=True)  # 後で廃止予定
    stylist_services = StylistServiceSerializer(many=True, read_only=True)  # 新しいフィールド
    
    class Meta:
        model = Stylist
        fields = ['id', 'user', 'bio', 'experience_years', 'services', 'stylist_services', 'is_available']


class AppointmentCreateSerializer(serializers.ModelSerializer):
    payment_method = serializers.ChoiceField(
        choices=[('online', 'オンライン決済'), ('in_person', '店舗支払い')],
        write_only=True
    )
    referral_code = serializers.UUIDField(write_only=True, required=False)
    start_time = serializers.CharField(write_only=True)
    guest_info = serializers.DictField(write_only=True, required=False)
    
    class Meta:
        model = Appointment
        fields = [
            'stylist', 'service', 'appointment_date', 'start_time', 'notes',
            'payment_method', 'referral_code', 'guest_info'
        ]
    
    def validate_appointment_date(self, value):
        from django.utils import timezone
        if value <= timezone.now():
            raise serializers.ValidationError("予約日時は現在時刻より後に設定してください。")
        return value
    
    def validate(self, data):
        # ゲスト情報のバリデーション
        guest_info = data.get('guest_info')
        if guest_info:
            required_fields = ['first_name', 'last_name', 'email', 'phone_number']
            for field in required_fields:
                if not guest_info.get(field):
                    raise serializers.ValidationError(f"ゲスト情報の{field}は必須です。")
        return data


class AppointmentSerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    stylist = StylistSerializer(read_only=True)
    service = ServiceSerializer(read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'customer', 'stylist', 'service', 'appointment_date',
            'status', 'requires_payment', 'total_amount', 'notes',
            'created_at', 'updated_at'
        ]
