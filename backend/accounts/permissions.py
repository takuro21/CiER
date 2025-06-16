from rest_framework import permissions


class IsSalonManager(permissions.BasePermission):
    """サロン管理者権限（店長またはオーナー）"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.can_manage_staff()
        )


class IsSalonOwner(permissions.BasePermission):
    """サロンオーナー権限"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_owner
        )


class CanManageUser(permissions.BasePermission):
    """特定ユーザーの管理権限"""
    
    def has_object_permission(self, request, view, obj):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.can_manage_user(obj)
        )


class IsStylistOrManager(permissions.BasePermission):
    """スタイリストまたは管理者権限"""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.user_type == 'stylist' or request.user.can_manage_staff())
        )


class CanManageStylistProfile(permissions.BasePermission):
    """スタイリストプロフィール管理権限"""
    
    def has_object_permission(self, request, view, obj):
        return (
            request.user and 
            request.user.is_authenticated and 
            (obj.user == request.user or request.user.can_manage_user(obj.user))
        )
