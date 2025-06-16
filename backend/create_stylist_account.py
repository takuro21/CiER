#!/usr/bin/env python
import os
import sys
import django

# Django設定を読み込み
sys.path.append('/Users/ty/CiER/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cier_project.settings')
django.setup()

from accounts.models import User
from bookings.models import Stylist, Service, StylistService

def create_stylist_account():
    # スタイリスト用のユーザーを作成
    try:
        stylist_user = User.objects.get(username='stylist_test')
        print(f"✅ スタイリストユーザー '{stylist_user.username}' は既に存在します")
    except User.DoesNotExist:
        stylist_user = User.objects.create_user(
            username='stylist_test',
            email='stylist@example.com',
            password='stylist123',
            first_name='太郎',
            last_name='美容師',
            user_type='stylist'
        )
        print(f"✅ スタイリストユーザー '{stylist_user.username}' を作成しました")

    # スタイリストプロフィールを作成
    try:
        stylist = Stylist.objects.get(user=stylist_user)
        print(f"✅ スタイリストプロフィールは既に存在します")
    except Stylist.DoesNotExist:
        stylist = Stylist.objects.create(
            user=stylist_user,
            bio='経験豊富な美容師です。お客様に最高のサービスを提供します。',
            experience_years=5,
            is_available=True
        )
        print(f"✅ スタイリストプロフィールを作成しました")

    # サービスを作成
    services_data = [
        {'name': 'カット', 'description': 'ヘアカット', 'duration_minutes': 60, 'price': '4000'},
        {'name': 'カラー', 'description': 'ヘアカラー', 'duration_minutes': 120, 'price': '8000'},
        {'name': 'パーマ', 'description': 'パーマ', 'duration_minutes': 90, 'price': '6000'},
        {'name': 'シャンプー', 'description': 'シャンプー＆ブロー', 'duration_minutes': 30, 'price': '2000'},
    ]

    for service_data in services_data:
        service, created = Service.objects.get_or_create(
            name=service_data['name'],
            defaults={
                'description': service_data['description'],
                'duration_minutes': service_data['duration_minutes'],
                'price': service_data['price'],
                'is_active': True
            }
        )
        if created:
            print(f"✅ サービス '{service.name}' を作成しました")
        else:
            print(f"✅ サービス '{service.name}' は既に存在します")

        # スタイリスト-サービスの関連付け
        stylist_service, created = StylistService.objects.get_or_create(
            stylist=stylist,
            service=service,
            defaults={
                'duration_minutes': service_data['duration_minutes'],
                'price_override': service_data['price'],
                'is_available': True
            }
        )
        if created:
            print(f"✅ スタイリスト-サービス関連付け '{service.name}' を作成しました")

    print("\n🎉 スタイリストアカウントのセットアップが完了しました！")
    print(f"👤 ユーザー名: {stylist_user.username}")
    print(f"🔐 パスワード: stylist123")
    print(f"📧 メール: {stylist_user.email}")

if __name__ == '__main__':
    create_stylist_account()
