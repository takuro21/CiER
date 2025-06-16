from rest_framework import serializers
from .models import Service, Stylist, Appointment, StylistService, StylistBookingLink, ManualAppointment
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


class StylistBookingLinkSerializer(serializers.ModelSerializer):
    """スタイリストブッキングリンクのシリアライザー"""
    stylist_name = serializers.CharField(source='stylist.user.get_full_name', read_only=True)
    
    class Meta:
        model = StylistBookingLink
        fields = [
            'id', 'unique_code', 'booking_url', 'is_active', 
            'max_advance_days', 'allow_guest_booking', 'stylist_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['unique_code', 'booking_url']


class ManualAppointmentSerializer(serializers.ModelSerializer):
    """手動予約のシリアライザー"""
    service_name = serializers.CharField(source='service.name', read_only=True)
    stylist_name = serializers.CharField(source='stylist.user.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = ManualAppointment
        fields = [
            'id', 'service', 'service_name', 'stylist_name', 'customer_name',
            'customer_phone', 'customer_email', 'appointment_date', 
            'duration_minutes', 'notes', 'is_confirmed', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by_name']


class ManualAppointmentCreateSerializer(serializers.ModelSerializer):
    """手動予約作成用のシリアライザー"""
    end_time = serializers.DateTimeField(write_only=True, required=False)
    
    class Meta:
        model = ManualAppointment
        fields = [
            'service', 'customer_name', 'customer_phone', 'customer_email',
            'appointment_date', 'end_time', 'duration_minutes', 'notes', 'is_confirmed'
        ]
    
    def validate(self, data):
        # 終了時間が指定されている場合、duration_minutesを計算
        if data.get('end_time') and data.get('appointment_date'):
            start_time = data['appointment_date']
            end_time = data['end_time']
            
            if end_time <= start_time:
                raise serializers.ValidationError("終了時間は開始時間より後に設定してください。")
            
            duration = (end_time - start_time).total_seconds() / 60
            data['duration_minutes'] = int(duration)
        
        # duration_minutesが設定されていない場合はエラー
        if not data.get('duration_minutes'):
            raise serializers.ValidationError("所要時間または終了時間を指定してください。")
        
        return data
