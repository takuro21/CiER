from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from .models import User, Badge, Salon, StylistProfile
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserSerializer,
    BadgeSerializer,
    SalonSerializer,
    StylistProfileSerializer,
    StylistManagementSerializer
)
from .permissions import (
    IsSalonManager, 
    IsSalonOwner, 
    CanManageUser,
    IsStylistOrManager,
    CanManageStylistProfile
)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """ユーザー登録"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """ログイン"""
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    """プロフィール取得"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """プロフィール更新"""
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BadgeListView(generics.ListAPIView):
    """バッジ一覧"""
    serializer_class = BadgeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Badge.objects.filter(user=self.request.user)


# サロン管理用ビュー
class SalonListCreateView(generics.ListCreateAPIView):
    """サロン一覧・作成"""
    serializer_class = SalonSerializer
    permission_classes = [IsSalonOwner]
    queryset = Salon.objects.all()


class SalonDetailView(generics.RetrieveUpdateDestroyAPIView):
    """サロン詳細・更新・削除"""
    serializer_class = SalonSerializer
    permission_classes = [IsSalonManager]
    queryset = Salon.objects.all()


# スタイリスト管理用ビュー
@api_view(['GET'])
@permission_classes([IsSalonManager])
def staff_list(request):
    """スタッフ一覧（管理者用）"""
    user = request.user
    manageable_users = user.get_manageable_users()
    serializer = StylistManagementSerializer(manageable_users, many=True)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsSalonManager])
def update_staff_role(request, user_id):
    """スタッフの役割更新"""
    target_user = get_object_or_404(User, id=user_id)
    
    # 権限チェック
    if not request.user.can_manage_user(target_user):
        return Response(
            {'error': 'この操作を実行する権限がありません。'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # オーナーのみが管理者権限を付与可能
    if 'is_manager' in request.data and not request.user.is_owner:
        return Response(
            {'error': 'オーナーのみが管理者権限を付与できます。'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = UserSerializer(target_user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StylistProfileListCreateView(generics.ListCreateAPIView):
    """スタイリストプロフィール一覧・作成"""
    serializer_class = StylistProfileSerializer
    permission_classes = [IsStylistOrManager]
    
    def get_queryset(self):
        user = self.request.user
        if user.can_manage_staff():
            return StylistProfile.objects.all()
        else:
            return StylistProfile.objects.filter(user=user)


class StylistProfileDetailView(generics.RetrieveUpdateDestroyAPIView):
    """スタイリストプロフィール詳細・更新・削除"""
    serializer_class = StylistProfileSerializer
    permission_classes = [CanManageStylistProfile]
    queryset = StylistProfile.objects.all()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_stylists(request):
    """利用可能なスタイリスト一覧"""
    from django.utils import timezone
    
    # クエリパラメータから日時を取得
    date_str = request.GET.get('date')
    time_str = request.GET.get('time')
    
    if date_str and time_str:
        try:
            datetime_str = f"{date_str} {time_str}"
            target_datetime = timezone.datetime.strptime(datetime_str, "%Y-%m-%d %H:%M")
            target_datetime = timezone.make_aware(target_datetime)
        except ValueError:
            return Response(
                {'error': '日時の形式が正しくありません。'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    else:
        target_datetime = timezone.now()
    
    # 利用可能なスタイリストを取得
    available_profiles = StylistProfile.objects.filter(
        is_active=True,
        accepts_walk_ins=True
    ).order_by('priority_level')
    
    # 時間チェック
    available_profiles = [
        profile for profile in available_profiles 
        if profile.is_available_at(target_datetime)
    ]
    
    serializer = StylistProfileSerializer(available_profiles, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])  # 予約システムからの呼び出し用
def auto_assign_stylist(request):
    """自動スタイリスト割り当て"""
    from django.utils import timezone
    
    date_str = request.data.get('date')
    time_str = request.data.get('time')
    
    if not date_str or not time_str:
        return Response(
            {'error': '日時が指定されていません。'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        datetime_str = f"{date_str} {time_str}"
        target_datetime = timezone.datetime.strptime(datetime_str, "%Y-%m-%d %H:%M")
        target_datetime = timezone.make_aware(target_datetime)
    except ValueError:
        return Response(
            {'error': '日時の形式が正しくありません。'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # 利用可能なスタイリストを優先度順で取得
    available_profiles = StylistProfile.objects.filter(
        is_active=True,
        accepts_walk_ins=True
    ).order_by('priority_level')
    
    for profile in available_profiles:
        if profile.is_available_at(target_datetime):
            # 既存の予約をチェック
            from bookings.models import Appointment
            existing_appointment = Appointment.objects.filter(
                stylist=profile.user,
                appointment_date=target_datetime.date(),
                start_time=target_datetime.time()
            ).exists()
            
            if not existing_appointment:
                return Response({
                    'stylist': StylistProfileSerializer(profile).data,
                    'assigned': True
                })
    
    return Response({
        'stylist': None,
        'assigned': False,
        'message': '指定時間に利用可能なスタイリストがいません。'
    })
