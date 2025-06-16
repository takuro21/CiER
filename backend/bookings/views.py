from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from django.contrib.auth.models import User
from datetime import datetime, timedelta, time
from django.utils import timezone
from .models import Service, Stylist, Appointment
from .serializers import (
    ServiceSerializer,
    StylistSerializer,
    AppointmentCreateSerializer,
    AppointmentSerializer
)
from .permissions import IsAuthenticatedOrGuestWithReferral
from referrals.models import ReferralLink, Referral
import stripe

stripe.api_key = settings.STRIPE_SECRET_KEY


class ServiceListView(generics.ListAPIView):
    """サービス一覧"""
    queryset = Service.objects.filter(is_active=True)
    serializer_class = ServiceSerializer
    permission_classes = []


class StylistListView(generics.ListAPIView):
    """スタイリスト一覧"""
    queryset = Stylist.objects.filter(is_available=True)
    serializer_class = StylistSerializer
    permission_classes = []


@api_view(['POST'])
@permission_classes([IsAuthenticatedOrGuestWithReferral])
def create_appointment(request):
    """予約作成（支払いオプション対応・ゲスト予約対応）"""
    serializer = AppointmentCreateSerializer(data=request.data)
    if serializer.is_valid():
        payment_method = serializer.validated_data.pop('payment_method', 'in_person')
        referral_code = serializer.validated_data.pop('referral_code', None)
        start_time = serializer.validated_data.pop('start_time', None)
        guest_info = request.data.get('guest_info', None)
        pay_now = (payment_method == 'online')
        
        # ゲスト予約の場合、一時的なユーザーを作成または取得
        customer = request.user
        if not request.user.is_authenticated and guest_info:
            email = guest_info.get('email')
            if email:
                # 既存のユーザーがいるかチェック
                try:
                    customer = User.objects.get(email=email)
                except User.DoesNotExist:
                    # 新しいゲストユーザーを作成
                    username = f"guest_{email.split('@')[0]}_{User.objects.count()}"
                    customer = User.objects.create_user(
                        username=username,
                        email=email,
                        first_name=guest_info.get('first_name', ''),
                        last_name=guest_info.get('last_name', ''),
                        password=User.objects.make_random_password()
                    )
                    # 電話番号を保存（profileがあれば）
                    if hasattr(customer, 'profile'):
                        customer.profile.phone_number = guest_info.get('phone_number', '')
                        customer.profile.save()
        
        # 基本的な予約作成
        appointment = serializer.save(
            customer=customer,
            requires_payment=pay_now,
            total_amount=serializer.validated_data['service'].price
        )
        
        # 紹介コードの処理
        if referral_code:
            try:
                referral_link = ReferralLink.objects.get(
                    referral_code=referral_code,
                    is_active=True
                )
                if referral_link.referrer != customer:
                    referral = Referral.objects.create(
                        referrer=referral_link.referrer,
                        referred_user=customer,
                        referral_link=referral_link,
                        appointment=appointment,
                        is_successful=True  # 予約完了時点で成功とみなす
                    )
            except ReferralLink.DoesNotExist:
                pass
        
        # 支払い処理
        if pay_now:
            try:
                # 開発環境では Stripe をモック
                if settings.DEBUG:
                    # 開発環境でのモック決済
                    mock_checkout_url = f'http://localhost:3001/checkout/mock?appointment_id={appointment.id}&amount={int(appointment.total_amount)}'
                    return Response({
                        'appointment': AppointmentSerializer(appointment).data,
                        'checkout_url': mock_checkout_url
                    })
                else:
                    # 本番環境では実際のStripe
                    checkout_session = stripe.checkout.Session.create(
                        payment_method_types=['card'],
                        line_items=[{
                            'price_data': {
                                'currency': 'jpy',
                                'product_data': {
                                    'name': appointment.service.name,
                                },
                                'unit_amount': int(appointment.total_amount),
                            },
                            'quantity': 1,
                        }],
                        mode='payment',
                        success_url=f'http://localhost:3000/booking/success?session_id={{CHECKOUT_SESSION_ID}}',
                        cancel_url='http://localhost:3000/booking/cancel',
                        metadata={
                            'appointment_id': appointment.id,
                        }
                    )
                    
                    return Response({
                        'appointment': AppointmentSerializer(appointment).data,
                        'checkout_url': checkout_session.url
                    })
            except Exception as e:
                appointment.delete()
                return Response(
                    {'error': f'支払い処理でエラーが発生しました: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # 支払いなしの場合はそのまま予約確定
            return Response({
                'appointment': AppointmentSerializer(appointment).data,
                'message': '予約が確定しました。お支払いは当日サロンでお願いします。'
            })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def appointment_list(request):
    """予約一覧"""
    if request.user.user_type == 'stylist':
        # スタイリストの場合、自分の予約を取得
        stylist = Stylist.objects.get(user=request.user)
        appointments = Appointment.objects.filter(stylist=stylist)
    else:
        # 顧客の場合、自分の予約を取得
        appointments = Appointment.objects.filter(customer=request.user)
    
    serializer = AppointmentSerializer(appointments, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def stripe_webhook(request):
    """Stripe Webhook"""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return Response(status=400)
    except stripe.error.SignatureVerificationError:
        return Response(status=400)
    
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        appointment_id = session['metadata']['appointment_id']
        
        try:
            appointment = Appointment.objects.get(id=appointment_id)
            appointment.status = 'PAID'
            appointment.stripe_payment_intent_id = session.get('payment_intent')
            appointment.save()
            
            # 紹介成功の処理
            referral = Referral.objects.filter(appointment=appointment).first()
            if referral:
                referral.is_successful = True
                referral.save()
                
                # バッジの更新処理をここに追加
                # update_user_badges(referral.referrer)
        except Appointment.DoesNotExist:
            pass
    
    return Response(status=200)


@api_view(['GET'])
@permission_classes([])
def get_available_time_slots(request):
    """指定された日付、スタイリスト、サービスに対して利用可能な時間枠を返す"""
    date_str = request.GET.get('date')
    stylist_id = request.GET.get('stylist_id')
    service_id = request.GET.get('service_id')
    
    if not all([date_str, stylist_id, service_id]):
        return Response({
            'error': 'date, stylist_id, service_id are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        appointment_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        stylist = Stylist.objects.get(id=stylist_id, is_available=True)
        service = Service.objects.get(id=service_id, is_active=True)
        
        # スタイリスト固有のサービス設定を取得
        stylist_service = StylistService.objects.filter(
            stylist=stylist,
            service=service,
            is_available=True
        ).first()
        
        if not stylist_service:
            return Response({
                'error': 'このスタイリストは選択されたサービスを提供していません'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except (ValueError, Stylist.DoesNotExist, Service.DoesNotExist):
        return Response({
            'error': 'Invalid date, stylist, or service'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # 営業時間の設定 (9:00 - 18:00)
    business_start = time(9, 0)
    business_end = time(18, 0)
    
    # スタイリスト固有の所要時間を使用
    service_duration = stylist_service.duration_minutes
    
    # その日の既存の予約を取得
    existing_appointments = Appointment.objects.filter(
        stylist=stylist,
        appointment_date__date=appointment_date,
        status__in=['RESERVED', 'PAID']
    ).order_by('appointment_date')
    
    # 利用可能な時間枠を生成
    available_slots = []
    current_time = datetime.combine(appointment_date, business_start)
    end_of_day = datetime.combine(appointment_date, business_end)
    
    # 30分刻みで時間枠を生成
    while current_time + timedelta(minutes=service_duration) <= end_of_day:
        slot_start = current_time
        slot_end = current_time + timedelta(minutes=service_duration)
        
        # この時間枠が既存の予約と重複していないかチェック
        is_available = True
        for appointment in existing_appointments:
            # 既存予約の所要時間も考慮
            existing_stylist_service = StylistService.objects.filter(
                stylist=appointment.stylist,
                service=appointment.service
            ).first()
            existing_duration = existing_stylist_service.duration_minutes if existing_stylist_service else appointment.service.duration_minutes
            
            existing_start = appointment.appointment_date
            existing_end = existing_start + timedelta(minutes=existing_duration)
            
            # 時間枠の重複チェック
            if (slot_start < existing_end and slot_end > existing_start):
                is_available = False
                break
        
        if is_available:
            available_slots.append({
                'start_time': slot_start.strftime('%H:%M'),
                'end_time': slot_end.strftime('%H:%M'),
                'display': f"{slot_start.strftime('%H:%M')} - {slot_end.strftime('%H:%M')}"
            })
        
        # 次の30分刻みの時間に進む
        current_time += timedelta(minutes=30)
    
    return Response({
        'available_slots': available_slots,
        'service_duration': service_duration,
        'service_name': service.name,
        'stylist_name': stylist.user.username,
        'effective_price': stylist_service.effective_price
    })
    
    # この時間枠が既存の予約と重複していないかチェック
    is_available = True
    for appointment in existing_appointments:
        existing_start = appointment.appointment_date
        existing_end = existing_start + timedelta(minutes=appointment.service.duration_minutes)
        
        # 時間枠の重複チェック
        if (slot_start < existing_end and slot_end > existing_start):
            is_available = False
            break
        
        if is_available:
            available_slots.append({
                'start_time': slot_start.strftime('%H:%M'),
                'end_time': slot_end.strftime('%H:%M'),
                'display': f"{slot_start.strftime('%H:%M')} - {slot_end.strftime('%H:%M')}"
            })
        
        # 次の30分刻みの時間に進む
        current_time += timedelta(minutes=30)
    
    return Response({
        'available_slots': available_slots,
        'service_duration': service_duration,
        'service_name': service.name
    })
