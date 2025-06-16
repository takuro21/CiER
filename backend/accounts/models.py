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
