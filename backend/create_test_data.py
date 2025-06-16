from accounts.models import User, Badge
from bookings.models import Service, Stylist
from referrals.models import ReferralLink

# Badgeは実際に紹介実績がある場合に作成されるため、ここでは作成しません
# 代わりにサービスとスタイリストのデータを作成します

# Create services
Service.objects.create(
    name="カット",
    description="スタイリストによるプロフェッショナルなカット",
    duration_minutes=60,
    price=5000,
    is_active=True
)
Service.objects.create(
    name="カット + カラー",
    description="カットとカラーリングのセット",
    duration_minutes=120,
    price=12000,
    is_active=True
)
Service.objects.create(
    name="カット + パーマ",
    description="カットとパーマのセット",
    duration_minutes=150,
    price=15000,
    is_active=True
)
Service.objects.create(
    name="ヘッドスパ",
    description="リラクゼーション効果のあるヘッドスパ",
    duration_minutes=45,
    price=3000,
    is_active=True
)

# Create stylists
# まずスタイリスト用のユーザーを作成
stylist_user1 = User.objects.create_user(
    username='tanaka_mika',
    email='tanaka@example.com',
    password='password123',
    first_name='美香',
    last_name='田中',
    user_type='stylist'
)
Stylist.objects.create(
    user=stylist_user1,
    bio="10年の経験を持つベテランスタイリスト。カットとカラーが得意です。",
    experience_years=10,
    is_available=True
)

stylist_user2 = User.objects.create_user(
    username='sato_kenta',
    email='sato@example.com',
    password='password123',
    first_name='健太',
    last_name='佐藤',
    user_type='stylist'
)
Stylist.objects.create(
    user=stylist_user2,
    bio="トレンドに敏感な若手スタイリスト。メンズカットが得意です。",
    experience_years=3,
    is_available=True
)

stylist_user3 = User.objects.create_user(
    username='yamada_hanako',
    email='yamada@example.com',
    password='password123',
    first_name='花子',
    last_name='山田',
    user_type='stylist'
)
Stylist.objects.create(
    user=stylist_user3,
    bio="パーマとヘアアレンジのスペシャリスト。結婚式のヘアセットも可能です。",
    experience_years=7,
    is_available=True
)

print("テストデータを作成しました！")
