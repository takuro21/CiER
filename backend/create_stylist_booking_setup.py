#!/usr/bin/env python
import os
import sys
import django

# Django設定の初期化
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cier_project.settings')
django.setup()

from django.contrib.auth import get_user_model
from bookings.models import Stylist, StylistBookingLink, Service, StylistService

def create_booking_link_for_stylist():
    """スタイリスト用のブッキングリンクを作成"""
    
    User = get_user_model()
    
    # スタイリストユーザーを取得または作成
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
        print(f"スタイリストユーザーを作成しました: {stylist_user.username}")
    
    # スタイリストプロフィールを取得または作成
    stylist, created = Stylist.objects.get_or_create(
        user=stylist_user,
        defaults={
            'bio': '経験豊富な美容師です。お客様一人ひとりに合ったスタイルをご提案いたします。',
            'experience_years': 5,
            'is_available': True
        }
    )
    
    if created:
        print(f"スタイリストプロフィールを作成しました: {stylist}")
    
    # サービスを作成
    services_data = [
        {'name': 'カット', 'duration_minutes': 60, 'price': 5000},
        {'name': 'カラー', 'duration_minutes': 120, 'price': 8000},
        {'name': 'パーマ', 'duration_minutes': 90, 'price': 10000},
        {'name': 'シャンプー・ブロー', 'duration_minutes': 30, 'price': 2000},
    ]
    
    for service_data in services_data:
        service, created = Service.objects.get_or_create(
            name=service_data['name'],
            defaults={
                'description': f'{service_data["name"]}サービス',
                'duration_minutes': service_data['duration_minutes'],
                'price': service_data['price'],
                'is_active': True
            }
        )
        
        if created:
            print(f"サービスを作成しました: {service}")
        
        # スタイリストサービスを作成
        stylist_service, created = StylistService.objects.get_or_create(
            stylist=stylist,
            service=service,
            defaults={
                'duration_minutes': service_data['duration_minutes'],
                'is_available': True
            }
        )
        
        if created:
            print(f"スタイリストサービスを作成しました: {stylist_service}")
    
    # ブッキングリンクを作成
    booking_link, created = StylistBookingLink.objects.get_or_create(
        stylist=stylist,
        defaults={
            'max_advance_days': 30,
            'allow_guest_booking': True,
            'is_active': True
        }
    )
    
    if created:
        print(f"ブッキングリンクを作成しました")
        print(f"ユニークコード: {booking_link.unique_code}")
        print(f"ブッキングURL: {booking_link.booking_url}")
    else:
        print(f"既存のブッキングリンク:")
        print(f"ユニークコード: {booking_link.unique_code}")
        print(f"ブッキングURL: {booking_link.booking_url}")
    
    print(f"\n✅ セットアップ完了!")
    print(f"スタイリスト: {stylist_user.first_name} {stylist_user.last_name}")
    print(f"利用可能サービス数: {stylist.stylist_services.count()}")
    print(f"専用予約URL: {booking_link.booking_url}")
    
    return booking_link

if __name__ == "__main__":
    create_booking_link_for_stylist()
