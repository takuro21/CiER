#!/usr/bin/env python
"""
testuser5のダミー予約履歴を3件作成するスクリプト
"""
import os
import sys
import django
from datetime import datetime, timedelta

# Django設定
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cier_project.settings')
django.setup()

from accounts.models import User
from bookings.models import Service, Stylist, Appointment

def create_dummy_appointments():
    try:
        # testuser5を取得
        user = User.objects.get(username='testuser5')
        print(f"ユーザー見つかりました: {user.username}")
        
        # 利用可能なサービスを取得
        services = Service.objects.all()
        if not services.exists():
            print("サービスが見つかりません。先にサービスを作成してください。")
            return
        
        # 利用可能なスタイリストを取得
        stylists = Stylist.objects.filter(is_available=True)
        if not stylists.exists():
            print("利用可能なスタイリストが見つかりません。")
            return
        
        # 既存の予約を削除（重複防止）
        existing_appointments = Appointment.objects.filter(customer=user)
        if existing_appointments.exists():
            print(f"既存の予約 {existing_appointments.count()} 件を削除します...")
            existing_appointments.delete()
        
        # ダミー予約データ
        appointments_data = [
            {
                'appointment_date': datetime.now() - timedelta(days=30, hours=10),
                'status': 'COMPLETED',
                'notes': '初回カット・カラー',
            },
            {
                'appointment_date': datetime.now() - timedelta(days=15, hours=14, minutes=30), 
                'status': 'COMPLETED',
                'notes': 'リタッチカラー',
            },
            {
                'appointment_date': datetime.now() - timedelta(days=7, hours=11),
                'status': 'COMPLETED',
                'notes': 'トリートメント',
            }
        ]
        
        # 予約を作成
        created_appointments = []
        for i, appointment_data in enumerate(appointments_data):
            service = services[i % len(services)]  # サービスを循環して選択
            stylist = stylists[i % len(stylists)]  # スタイリストを循環して選択
            
            appointment = Appointment.objects.create(
                customer=user,
                service=service,
                stylist=stylist,
                appointment_date=appointment_data['appointment_date'],
                status=appointment_data['status'],
                total_amount=service.price,
                notes=appointment_data['notes'],
                created_at=datetime.now() - timedelta(days=35-i*7)  # 作成日時も過去にする
            )
            created_appointments.append(appointment)
            print(f"予約 {i+1} 作成完了: {appointment.service.name} - {appointment.stylist.user.last_name} {appointment.stylist.user.first_name}")
        
        print(f"\n✅ 成功: testuser5 用に {len(created_appointments)} 件のダミー予約を作成しました!")
        
        # 作成された予約の詳細を表示
        print("\n📋 作成された予約:")
        for appointment in created_appointments:
            print(f"  - {appointment.appointment_date}")
            print(f"    サービス: {appointment.service.name}")
            print(f"    スタイリスト: {appointment.stylist.user.last_name} {appointment.stylist.user.first_name}")
            print(f"    ステータス: {appointment.status}")
            print(f"    金額: ¥{appointment.total_amount}")
            print()
            
    except User.DoesNotExist:
        print("❌ エラー: testuser5 が見つかりません")
    except Exception as e:
        print(f"❌ エラー: {e}")

if __name__ == '__main__':
    create_dummy_appointments()
