from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from django.contrib.auth.models import User
from datetime import datetime, timedelta, time
from django.utils import timezone
from .models import Service, Stylist, Appointment, StylistService, StylistBookingLink, ManualAppointment
from .serializers import (
    ServiceSerializer,
    StylistSerializer,
    AppointmentCreateSerializer,
    AppointmentSerializer,
    StylistBookingLinkSerializer,
    ManualAppointmentSerializer,
    ManualAppointmentCreateSerializer
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
    """予約作成（支払いオプション対応・ゲスト予約対応・自動割り当て対応）"""
    serializer = AppointmentCreateSerializer(data=request.data)
    if serializer.is_valid():
        payment_method = serializer.validated_data.pop('payment_method', 'in_person')
        referral_code = serializer.validated_data.pop('referral_code', None)
        start_time = serializer.validated_data.pop('start_time', None)
        guest_info = request.data.get('guest_info', None)
        auto_assign = request.data.get('auto_assign', False)  # 自動割り当てフラグ
        pay_now = (payment_method == 'online')
        
        # 自動割り当ての場合、スタイリストを自動選択
        if auto_assign and not serializer.validated_data.get('stylist'):
            from accounts.models import StylistProfile
            
            appointment_date = serializer.validated_data['appointment_date']
            appointment_datetime = datetime.combine(appointment_date, start_time) if start_time else None
            
            if appointment_datetime:
                # 利用可能なスタイリストを優先度順で取得
                available_profiles = StylistProfile.objects.filter(
                    is_active=True,
                    accepts_walk_ins=True
                ).order_by('priority_level')
                
                assigned_stylist = None
                for profile in available_profiles:
                    if profile.is_available_at(appointment_datetime):
                        # 既存の予約をチェック
                        existing_appointment = Appointment.objects.filter(
                            stylist__user=profile.user,
                            appointment_date=appointment_date,
                            start_time=start_time
                        ).exists()
                        
                        if not existing_appointment:
                            # 対応するStylistモデルを取得または作成
                            stylist, created = Stylist.objects.get_or_create(
                                user=profile.user,
                                defaults={
                                    'bio': profile.bio,
                                    'experience_years': profile.experience_years,
                                    'is_available': True
                                }
                            )
                            assigned_stylist = stylist
                            break
                
                if assigned_stylist:
                    serializer.validated_data['stylist'] = assigned_stylist
                else:
                    return Response({
                        'error': '指定時間に利用可能なスタイリストがいません。',
                        'available_times': []  # TODO: 利用可能な時間を提案
                    }, status=status.HTTP_400_BAD_REQUEST)
        
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


# ブッキングリンク管理のビュー
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_booking_link(request):
    """スタイリストのブッキングリンク管理"""
    try:
        stylist = request.user.stylist_profile
    except:
        return Response(
            {'error': 'スタイリストプロフィールが見つかりません'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        try:
            booking_link = stylist.booking_link
            serializer = StylistBookingLinkSerializer(booking_link)
            return Response(serializer.data)
        except StylistBookingLink.DoesNotExist:
            return Response({'message': 'ブッキングリンクが作成されていません'})
    
    elif request.method == 'POST':
        # ブッキングリンクを作成または更新
        booking_link, created = StylistBookingLink.objects.get_or_create(
            stylist=stylist,
            defaults={
                'max_advance_days': request.data.get('max_advance_days', 30),
                'allow_guest_booking': request.data.get('allow_guest_booking', True)
            }
        )
        
        if not created:
            # 既存のリンクを更新
            booking_link.max_advance_days = request.data.get('max_advance_days', booking_link.max_advance_days)
            booking_link.allow_guest_booking = request.data.get('allow_guest_booking', booking_link.allow_guest_booking)
            booking_link.is_active = request.data.get('is_active', booking_link.is_active)
            booking_link.save()
        
        serializer = StylistBookingLinkSerializer(booking_link)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(['GET'])
def get_stylist_by_booking_code(request, booking_code):
    """ブッキングコードからスタイリスト情報を取得"""
    try:
        booking_link = StylistBookingLink.objects.get(
            unique_code=booking_code,
            is_active=True
        )
        serializer = StylistSerializer(booking_link.stylist)
        return Response({
            'stylist': serializer.data,
            'booking_settings': {
                'max_advance_days': booking_link.max_advance_days,
                'allow_guest_booking': booking_link.allow_guest_booking
            }
        })
    except StylistBookingLink.DoesNotExist:
        return Response(
            {'error': '無効なブッキングコードです'},
            status=status.HTTP_404_NOT_FOUND
        )


# 手動予約管理のビュー
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manual_appointments(request):
    """手動予約の一覧取得・作成"""
    try:
        stylist = request.user.stylist_profile
    except:
        return Response(
            {'error': 'スタイリストプロフィールが見つかりません'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        # 手動予約の一覧を取得
        appointments = ManualAppointment.objects.filter(stylist=stylist)
        
        # 日付でフィルタリング
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        if date_from:
            appointments = appointments.filter(appointment_date__date__gte=date_from)
        if date_to:
            appointments = appointments.filter(appointment_date__date__lte=date_to)
        
        serializer = ManualAppointmentSerializer(appointments, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # 手動予約を作成
        serializer = ManualAppointmentCreateSerializer(data=request.data)
        if serializer.is_valid():
            manual_appointment = serializer.save(
                stylist=stylist,
                created_by=request.user
            )
            
            # 通知を作成
            from notifications.views import create_notification
            create_notification(
                user=request.user,
                notification_type='appointment',
                title='手動予約を作成しました',
                message=f'{manual_appointment.customer_name}様の予約を作成しました（{manual_appointment.appointment_date.strftime("%Y年%m月%d日 %H:%M")}）',
                data={
                    'appointment_id': manual_appointment.id,
                    'customer_name': manual_appointment.customer_name,
                    'service_name': manual_appointment.service.name,
                    'appointment_time': manual_appointment.appointment_date.strftime("%H:%M")
                }
            )
            
            return_serializer = ManualAppointmentSerializer(manual_appointment)
            return Response(return_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def manual_appointment_detail(request, appointment_id):
    """手動予約の詳細取得・更新・削除"""
    try:
        stylist = request.user.stylist_profile
        appointment = ManualAppointment.objects.get(
            id=appointment_id,
            stylist=stylist
        )
    except ManualAppointment.DoesNotExist:
        return Response(
            {'error': '予約が見つかりません'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        serializer = ManualAppointmentSerializer(appointment)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = ManualAppointmentSerializer(appointment, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        appointment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([])
def create_walk_in_appointment(request):
    """指名なし予約専用エンドポイント（自動スタイリスト割り当て）"""
    from datetime import datetime
    from accounts.models import StylistProfile, User
    
    # 自動スタイリスト割り当てロジック
    appointment_date_str = request.data.get('appointment_date')
    service_id = request.data.get('service_id')
    
    if not appointment_date_str or not service_id:
        return Response(
            {'error': '予約日時とサービスIDが必要です'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        appointment_date = datetime.fromisoformat(appointment_date_str.replace('Z', '+00:00'))
        service = Service.objects.get(id=service_id)
    except (ValueError, Service.DoesNotExist):
        return Response(
            {'error': '無効な日時またはサービスIDです'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # 利用可能なスタイリストを検索
    available_profiles = StylistProfile.objects.filter(
        is_active=True,
        accepts_walk_ins=True
    )
    
    best_stylist_user = None
    for profile in available_profiles:
        # 新しいAppointmentモデル（予定）を想定してUserを直接使用
        # 実際のシステムでは、Appointmentモデルを新しいものに変更する必要があります
        
        # 仮想的な競合チェック（簡単版）
        # 実際の本格運用時はより詳細なスケジュール管理が必要
        
        best_stylist_user = profile.user
        break  # 最初に見つかったスタイリストを使用
    
    if not best_stylist_user:
        return Response(
            {'error': '利用可能なスタイリストがいません'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # walk-in予約用の簡単なユーザー作成（ゲストユーザー）
    try:
        customer_email = request.data.get('customer_email')
        customer_name = request.data.get('customer_name')
        customer_phone = request.data.get('customer_phone')
        
        # ゲストユーザーを作成または取得
        customer_user, created = User.objects.get_or_create(
            email=customer_email,
            defaults={
                'username': f"guest_{customer_email}",
                'first_name': customer_name,
                'is_active': False  # ゲストユーザーとしてマーク
            }
        )
        
        # 古いStylistモデルが必要な場合は作成
        stylist_obj, created = Stylist.objects.get_or_create(
            user=best_stylist_user,
            defaults={
                'bio': f'{best_stylist_user.get_full_name()}のプロフィール',
                'experience_years': 5,
                'is_available': True
            }
        )
        
        # 予約作成
        appointment = Appointment.objects.create(
            customer=customer_user,
            stylist=stylist_obj,
            service=service,
            appointment_date=appointment_date,
            status='RESERVED',
            total_amount=service.price,
            notes=request.data.get('notes', 'Walk-in予約（自動割り当て）'),
            requires_payment=False
        )
        
        serializer = AppointmentSerializer(appointment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': f'予約作成エラー: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([])
def get_available_walk_in_times(request):
    """指名なし予約用の利用可能時間取得"""
    from accounts.models import StylistProfile
    
    date_str = request.GET.get('date')
    service_id = request.GET.get('service_id')
    
    if not date_str or not service_id:
        return Response(
            {'error': '日付とサービスIDが必要です'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        appointment_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        service = Service.objects.get(id=service_id)
    except (ValueError, Service.DoesNotExist):
        return Response(
            {'error': '無効な日付またはサービスIDです'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # 利用可能なスタイリストを取得
    available_profiles = StylistProfile.objects.filter(
        is_active=True,
        accepts_walk_ins=True
    )
    
    available_times = []
    time_slots = []
    
    # 9:00から18:00までの30分刻みのタイムスロットを生成
    current_time = time(9, 0)
    end_time = time(18, 0)
    
    while current_time < end_time:
        time_slots.append(current_time)
        current_time = (datetime.combine(appointment_date, current_time) + timedelta(minutes=30)).time()
    
    for time_slot in time_slots:
        appointment_datetime = datetime.combine(appointment_date, time_slot)
        
        # 利用可能なスタイリストがいるかチェック
        has_available_stylist = False
        for profile in available_profiles:
            if profile.is_available_at(appointment_datetime):
                # 既存の予約をチェック（appointment_dateはDateTimeField）
                existing_appointment = Appointment.objects.filter(
                    stylist__user=profile.user,
                    appointment_date=appointment_datetime
                ).exists()
                
                if not existing_appointment:
                    has_available_stylist = True
                    break
        
        if has_available_stylist:
            available_times.append({
                'time': time_slot.strftime('%H:%M'),
                'display': time_slot.strftime('%H:%M'),
                'available': True
            })
    
    return Response({
        'date': date_str,
        'service': ServiceSerializer(service).data,
        'available_times': available_times
    })