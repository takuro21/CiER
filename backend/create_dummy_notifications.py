#!/usr/bin/env python
import os
import sys
import django
from datetime import datetime, timedelta

# Django設定の初期化
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cier_project.settings')
django.setup()

from django.contrib.auth import get_user_model
from notifications.models import Notification

def create_dummy_notifications():
    """ダミー通知データを作成"""
    
    User = get_user_model()
    
    # スタイリストユーザーを取得（存在しない場合は作成）
    try:
        stylist_user = User.objects.get(username='stylist1')
    except User.DoesNotExist:
        stylist_user = User.objects.create_user(
            username='stylist1',
            email='stylist1@example.com',
            password='password123',
            first_name='田中',
            last_name='美容師',
            user_type='stylist'
        )
    
    # 既存の通知をクリア
    Notification.objects.filter(user=stylist_user).delete()
    
    # ダミー通知データ
    notifications_data = [
        {
            'type': 'appointment',
            'title': '新しい予約',
            'message': '田中様から15:00にカットのご予約をいただきました',
            'urgent': False,
            'read': False,
            'data': {
                'appointment_id': 1,
                'customer_name': '田中様',
                'service_name': 'カット',
                'appointment_time': '15:00'
            },
            'created_at': datetime.now() - timedelta(minutes=30)
        },
        {
            'type': 'reminder',
            'title': '予約リマインダー',
            'message': '佐藤様の予約まで30分です',
            'urgent': True,
            'read': False,
            'data': {
                'appointment_id': 2,
                'customer_name': '佐藤様',
                'service_name': 'カラー',
                'appointment_time': '11:30'
            },
            'created_at': datetime.now() - timedelta(hours=1)
        },
        {
            'type': 'cancellation',
            'title': 'キャンセル通知',
            'message': '山田様の予約がキャンセルされました',
            'urgent': False,
            'read': True,
            'data': {
                'appointment_id': 3,
                'customer_name': '山田様',
                'service_name': 'パーマ',
                'appointment_time': '14:30'
            },
            'created_at': datetime.now() - timedelta(hours=2)
        },
        {
            'type': 'review',
            'title': '新しいレビュー',
            'message': '鈴木様から5つ星のレビューをいただきました',
            'urgent': False,
            'read': True,
            'data': {
                'customer_name': '鈴木様',
                'rating': 5
            },
            'created_at': datetime.now() - timedelta(hours=3)
        },
        {
            'type': 'system',
            'title': 'システム更新',
            'message': 'スケジュール管理機能が更新されました',
            'urgent': False,
            'read': True,
            'data': {},
            'created_at': datetime.now() - timedelta(days=1)
        },
        {
            'type': 'appointment',
            'title': '明日の予約',
            'message': '高橋様から明日の10:00にカット&カラーのご予約をいただきました',
            'urgent': False,
            'read': False,
            'data': {
                'appointment_id': 4,
                'customer_name': '高橋様',
                'service_name': 'カット&カラー',
                'appointment_time': '10:00'
            },
            'created_at': datetime.now() - timedelta(hours=4)
        }
    ]
    
    # 通知を作成
    created_count = 0
    for notification_data in notifications_data:
        notification = Notification.objects.create(
            user=stylist_user,
            type=notification_data['type'],
            title=notification_data['title'],
            message=notification_data['message'],
            urgent=notification_data['urgent'],
            read=notification_data['read'],
            data=notification_data['data'],
            created_at=notification_data['created_at']
        )
        created_count += 1
        print(f"作成された通知: {notification.title}")
    
    print(f"\n{created_count}件のダミー通知を作成しました。")
    
    # 統計情報を表示
    total_notifications = Notification.objects.filter(user=stylist_user).count()
    unread_notifications = Notification.objects.filter(user=stylist_user, read=False).count()
    urgent_notifications = Notification.objects.filter(user=stylist_user, urgent=True).count()
    
    print(f"総通知数: {total_notifications}")
    print(f"未読通知数: {unread_notifications}")
    print(f"緊急通知数: {urgent_notifications}")

if __name__ == "__main__":
    create_dummy_notifications()
