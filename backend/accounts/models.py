from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """カスタムユーザーモデル"""
    USER_TYPE_CHOICES = [
        ('customer', '顧客'),
        ('stylist', 'スタイリスト'),
    ]
    
    user_type = models.CharField(
        max_length=10,
        choices=USER_TYPE_CHOICES,
        default='customer'
    )
    
    # 役割管理フラグ
    is_manager = models.BooleanField(
        default=False,
        verbose_name='店長権限',
        help_text='店長として全スタッフを管理する権限'
    )
    is_owner = models.BooleanField(
        default=False,
        verbose_name='オーナー権限',
        help_text='オーナーとして全権限を持つ'
    )
    
    phone_number = models.CharField(
        max_length=15,
        blank=True,
        null=True,
        verbose_name='電話番号'
    )
    profile_image = models.ImageField(
        upload_to='profiles/',
        blank=True,
        null=True,
        verbose_name='プロフィール画像'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"
    
    def can_manage_staff(self):
        """スタッフ管理権限があるかチェック"""
        return self.is_owner or self.is_manager
    
    def can_manage_user(self, user):
        """特定のユーザーを管理できるかチェック"""
        if self.is_owner:
            return True
        if self.is_manager and user.user_type == 'stylist' and not user.is_owner:
            return True
        return self == user  # 自分自身は管理可能
    
    def get_manageable_users(self):
        """管理可能なユーザー一覧を取得"""
        if self.is_owner:
            return User.objects.filter(user_type='stylist')
        elif self.is_manager:
            return User.objects.filter(user_type='stylist', is_owner=False)
        else:
            return User.objects.filter(id=self.id)


class Salon(models.Model):
    """サロン情報"""
    name = models.CharField(max_length=100, verbose_name='サロン名')
    address = models.TextField(verbose_name='住所')
    phone_number = models.CharField(max_length=15, verbose_name='電話番号')
    email = models.EmailField(verbose_name='メールアドレス')
    description = models.TextField(blank=True, verbose_name='説明')
    
    # 営業時間設定
    opening_time = models.TimeField(default='09:00', verbose_name='開店時間')
    closing_time = models.TimeField(default='19:00', verbose_name='閉店時間')
    
    # 自動割り当て設定
    auto_assign_enabled = models.BooleanField(
        default=True, 
        verbose_name='自動割り当て有効',
        help_text='指名なし予約を自動でスタイリストに割り当てる'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name


class StylistProfile(models.Model):
    """スタイリストプロフィール（新しい管理システム用）"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='new_stylist_profile')
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='stylists')
    
    # 基本情報
    bio = models.TextField(blank=True, verbose_name='自己紹介')
    experience_years = models.PositiveIntegerField(default=0, verbose_name='経験年数')
    specialties = models.JSONField(default=list, verbose_name='得意分野')
    
    # スケジュール設定
    working_hours_start = models.TimeField(default='09:00', verbose_name='勤務開始時間')
    working_hours_end = models.TimeField(default='18:00', verbose_name='勤務終了時間')
    
    # 自動割り当て設定
    accepts_walk_ins = models.BooleanField(
        default=True,
        verbose_name='指名なし予約受付',
        help_text='指名なしの予約を受け付けるか'
    )
    priority_level = models.PositiveIntegerField(
        default=1,
        verbose_name='優先度',
        help_text='自動割り当て時の優先度（数字が小さいほど優先）'
    )
    
    # ステータス
    is_active = models.BooleanField(default=True, verbose_name='アクティブ')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['priority_level', 'user__first_name']
    
    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} - {self.salon.name}"
    
    def is_available_at(self, datetime_obj):
        """指定時刻に予約可能かチェック"""
        if not self.is_active or not self.accepts_walk_ins:
            return False
        
        time_obj = datetime_obj.time()
        return self.working_hours_start <= time_obj <= self.working_hours_end


class Badge(models.Model):
    """紹介実績バッジ"""
    BADGE_TYPE_CHOICES = [
        ('bronze', 'ブロンズ'),
        ('silver', 'シルバー'),
        ('gold', 'ゴールド'),
        ('platinum', 'プラチナ'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='badges')
    badge_type = models.CharField(max_length=10, choices=BADGE_TYPE_CHOICES)
    earned_date = models.DateTimeField(auto_now_add=True)
    referral_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        unique_together = ['user', 'badge_type']
    
    def __str__(self):
        return f"{self.user.username} - {self.get_badge_type_display()}"
