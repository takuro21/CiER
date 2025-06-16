#!/usr/bin/env python
"""
Salon Master用のテストデータを作成するスクリプト
"""
import os
import sys
import django
from django.utils import timezone
from datetime import time

# Djangoの設定
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cier_project.settings')
django.setup()

from accounts.models import User, Salon, StylistProfile


def create_salon_master_data():
    """Salon Master用のテストデータを作成"""
    
    print("=== Salon Master テストデータ作成開始 ===")
    
    # サロンを作成
    salon, created = Salon.objects.get_or_create(
        name="CiER Beauty Salon",
        defaults={
            'address': '東京都渋谷区渋谷1-1-1',
            'phone_number': '03-1234-5678',
            'email': 'info@cier-salon.com',
            'description': 'プロフェッショナルな美容サービスを提供する現代的なサロンです。',
            'opening_time': time(9, 0),
            'closing_time': time(19, 0),
            'auto_assign_enabled': True
        }
    )
    if created:
        print(f"✓ サロン '{salon.name}' を作成しました")
    else:
        print(f"✓ サロン '{salon.name}' は既に存在します")
    
    # オーナーアカウントを作成
    owner, created = User.objects.get_or_create(
        username="salon_owner",
        defaults={
            'email': 'owner@cier-salon.com',
            'first_name': '美容',
            'last_name': 'オーナー',
            'user_type': 'stylist',
            'phone_number': '090-1111-2222',
            'is_owner': True,
            'is_manager': True
        }
    )
    if created:
        owner.set_password('salonowner123')
        owner.save()
        print(f"✓ オーナー '{owner.username}' を作成しました (パスワード: salonowner123)")
    else:
        # 既存ユーザーをオーナーに設定
        owner.is_owner = True
        owner.is_manager = True
        owner.save()
        print(f"✓ '{owner.username}' をオーナーに設定しました")
    
    # オーナーのスタイリストプロフィールを作成
    owner_profile, created = StylistProfile.objects.get_or_create(
        user=owner,
        defaults={
            'salon': salon,
            'bio': 'サロンオーナー兼トップスタイリスト。15年の経験を持ち、最新のトレンドを取り入れたスタイリングが得意です。',
            'experience_years': 15,
            'specialties': ['カット', 'カラー', 'パーマ', 'トリートメント'],
            'working_hours_start': time(9, 0),
            'working_hours_end': time(18, 0),
            'accepts_walk_ins': True,
            'priority_level': 1,
            'is_active': True
        }
    )
    if created:
        print(f"✓ オーナープロフィールを作成しました")
    
    # 店長アカウントを作成
    manager, created = User.objects.get_or_create(
        username="salon_manager",
        defaults={
            'email': 'manager@cier-salon.com',
            'first_name': '美容',
            'last_name': '店長',
            'user_type': 'stylist',
            'phone_number': '090-2222-3333',
            'is_owner': False,
            'is_manager': True
        }
    )
    if created:
        manager.set_password('salonmanager123')
        manager.save()
        print(f"✓ 店長 '{manager.username}' を作成しました (パスワード: salonmanager123)")
    else:
        manager.is_manager = True
        manager.save()
        print(f"✓ '{manager.username}' を店長に設定しました")
    
    # 店長のスタイリストプロフィールを作成
    manager_profile, created = StylistProfile.objects.get_or_create(
        user=manager,
        defaults={
            'salon': salon,
            'bio': 'スタイリスト兼店長として、お客様のご要望に丁寧にお応えします。特にカットとカラーが得意分野です。',
            'experience_years': 10,
            'specialties': ['カット', 'カラー', 'ヘアアレンジ'],
            'working_hours_start': time(9, 30),
            'working_hours_end': time(18, 30),
            'accepts_walk_ins': True,
            'priority_level': 2,
            'is_active': True
        }
    )
    if created:
        print(f"✓ 店長プロフィールを作成しました")
    
    # 一般スタイリストアカウントを作成
    stylists_data = [
        {
            'username': 'stylist_takeshi',
            'email': 'takeshi@cier-salon.com',
            'first_name': '健',
            'last_name': '田中',
            'bio': '若手スタイリストとして、トレンドを重視したスタイリングを提供します。',
            'experience_years': 3,
            'specialties': ['カット', 'カラー'],
            'priority_level': 3
        },
        {
            'username': 'stylist_yuki',
            'email': 'yuki@cier-salon.com',
            'first_name': '雪',
            'last_name': '佐藤',
            'bio': '女性のお客様に人気のスタイリスト。優しい対応とセンスの良いスタイリングが評判です。',
            'experience_years': 5,
            'specialties': ['カット', 'パーマ', 'トリートメント'],
            'priority_level': 4
        },
        {
            'username': 'stylist_hiroshi',
            'email': 'hiroshi@cier-salon.com',
            'first_name': '寛',
            'last_name': '鈴木',
            'bio': 'ベテランスタイリスト。幅広い年齢層のお客様に対応できる技術と経験を持っています。',
            'experience_years': 8,
            'specialties': ['カット', 'カラー', 'パーマ', 'ヘアアレンジ'],
            'priority_level': 2
        }
    ]
    
    for stylist_data in stylists_data:
        username = stylist_data['username']
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': stylist_data['email'],
                'first_name': stylist_data['first_name'],
                'last_name': stylist_data['last_name'],
                'user_type': 'stylist',
                'phone_number': f'090-{hash(username) % 9000 + 1000}-{hash(username) % 9000 + 1000}',
                'is_owner': False,
                'is_manager': False
            }
        )
        if created:
            user.set_password(f'{username}123')
            user.save()
            print(f"✓ スタイリスト '{user.username}' を作成しました (パスワード: {username}123)")
        
        # スタイリストプロフィールを作成
        profile, created = StylistProfile.objects.get_or_create(
            user=user,
            defaults={
                'salon': salon,
                'bio': stylist_data['bio'],
                'experience_years': stylist_data['experience_years'],
                'specialties': stylist_data['specialties'],
                'working_hours_start': time(10, 0),
                'working_hours_end': time(18, 0),
                'accepts_walk_ins': True,
                'priority_level': stylist_data['priority_level'],
                'is_active': True
            }
        )
        if created:
            print(f"✓ {user.first_name} {user.last_name}のプロフィールを作成しました")
    
    print("\n=== 作成完了 ===")
    print("📊 統計:")
    print(f"  - サロン数: {Salon.objects.count()}")
    print(f"  - 総ユーザー数: {User.objects.count()}")
    print(f"  - スタイリスト数: {User.objects.filter(user_type='stylist').count()}")
    print(f"  - オーナー数: {User.objects.filter(is_owner=True).count()}")
    print(f"  - 店長数: {User.objects.filter(is_manager=True).count()}")
    print(f"  - スタイリストプロフィール数: {StylistProfile.objects.count()}")
    
    print("\n=== ログイン情報 ===")
    print("オーナー: salon_owner / salonowner123")
    print("店長: salon_manager / salonmanager123")
    print("スタイリスト: stylist_takeshi / stylist_takeshi123")
    print("           stylist_yuki / stylist_yuki123")
    print("           stylist_hiroshi / stylist_hiroshi123")


if __name__ == '__main__':
    create_salon_master_data()
