from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from .models import Notification, NotificationPreference
from .serializers import NotificationSerializer, NotificationPreferenceSerializer


class NotificationPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    """
    ユーザーの通知一覧を取得
    """
    notifications = Notification.objects.filter(user=request.user)
    
    # フィルタリング
    notification_type = request.query_params.get('type')
    if notification_type:
        notifications = notifications.filter(type=notification_type)
    
    unread_only = request.query_params.get('unread_only')
    if unread_only == 'true':
        notifications = notifications.filter(read=False)
    
    # ページネーション
    paginator = NotificationPagination()
    page = paginator.paginate_queryset(notifications, request)
    
    if page is not None:
        serializer = NotificationSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """
    通知を既読にする
    """
    try:
        notification = Notification.objects.get(id=notification_id, user=request.user)
        notification.read = True
        notification.save()
        
        serializer = NotificationSerializer(notification)
        return Response(serializer.data)
    
    except Notification.DoesNotExist:
        return Response(
            {'error': '通知が見つかりません'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    """
    すべての通知を既読にする
    """
    notifications = Notification.objects.filter(user=request.user, read=False)
    notifications.update(read=True)
    
    return Response({
        'message': f'{notifications.count()}件の通知を既読にしました',
        'updated_count': notifications.count()
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unread_count(request):
    """
    未読通知数を取得
    """
    count = Notification.objects.filter(user=request.user, read=False).count()
    return Response({'count': count})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notification(request, notification_id):
    """
    通知を削除
    """
    try:
        notification = Notification.objects.get(id=notification_id, user=request.user)
        notification.delete()
        return Response({'message': '通知を削除しました'})
    
    except Notification.DoesNotExist:
        return Response(
            {'error': '通知が見つかりません'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def notification_preferences(request):
    """
    通知設定の取得・更新
    """
    preference, created = NotificationPreference.objects.get_or_create(
        user=request.user
    )
    
    if request.method == 'GET':
        serializer = NotificationPreferenceSerializer(preference)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = NotificationPreferenceSerializer(preference, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def create_notification(user, notification_type, title, message, urgent=False, data=None):
    """
    通知を作成するヘルパー関数
    """
    if data is None:
        data = {}
    
    notification = Notification.objects.create(
        user=user,
        type=notification_type,
        title=title,
        message=message,
        urgent=urgent,
        data=data
    )
    return notification
