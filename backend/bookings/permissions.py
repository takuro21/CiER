from rest_framework import permissions


class IsAuthenticatedOrGuestWithReferral(permissions.BasePermission):
    """
    認証されたユーザーまたは紹介コード付きのゲストに許可
    """
    
    def has_permission(self, request, view):
        # GET, HEAD, OPTIONS リクエストは常に許可
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # ユーザーが認証されている場合は許可
        if request.user and request.user.is_authenticated:
            return True
        
        # 認証されていない場合、紹介コードがあるかチェック
        if request.method == 'POST':
            referral_code = request.data.get('referral_code')
            guest_info = request.data.get('guest_info')
            
            # 紹介コードとゲスト情報がある場合は許可
            return bool(referral_code and guest_info)
        
        return False
