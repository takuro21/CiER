from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import ReferralLink, Referral
from .serializers import ReferralLinkSerializer, ReferralSerializer
from accounts.serializers import UserSerializer
import qrcode
import io
import base64


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_referral_link(request):
    """紹介リンク取得（なければ作成）"""
    referral_link, created = ReferralLink.objects.get_or_create(
        referrer=request.user,
        defaults={'is_active': True}
    )
    
    serializer = ReferralLinkSerializer(referral_link)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_qr_code(request):
    """QRコード生成"""
    referral_link, _ = ReferralLink.objects.get_or_create(
        referrer=request.user,
        defaults={'is_active': True}
    )
    
    # QRコード生成
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(referral_link.referral_url)
    qr.make(fit=True)
    
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    # 画像をBase64エンコード
    buffer = io.BytesIO()
    qr_img.save(buffer, format='PNG')
    qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return Response({
        'qr_code': f'data:image/png;base64,{qr_code_base64}',
        'referral_url': referral_link.referral_url
    })


class ReferralListView(generics.ListAPIView):
    """紹介実績一覧"""
    serializer_class = ReferralSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Referral.objects.filter(referrer=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def referral_stats(request):
    """紹介統計"""
    total_referrals = Referral.objects.filter(referrer=request.user).count()
    successful_referrals = Referral.objects.filter(
        referrer=request.user,
        is_successful=True
    ).count()
    
    return Response({
        'total_referrals': total_referrals,
        'successful_referrals': successful_referrals,
        'success_rate': (successful_referrals / total_referrals * 100) if total_referrals > 0 else 0
    })


@api_view(['GET'])
@permission_classes([AllowAny])  # 未ログインユーザーでも利用可能
def validate_referral_code(request, code):
    """紹介コード検証"""
    try:
        referral_link = ReferralLink.objects.get(
            referral_code=code,
            is_active=True
        )
        user_serializer = UserSerializer(referral_link.referrer)
        return Response({
            'valid': True,
            'referrer': user_serializer.data,
            'code': str(referral_link.referral_code)
        })
    except ReferralLink.DoesNotExist:
        return Response({
            'valid': False,
            'message': '無効な紹介コードです'
        }, status=404)
