from django.db import models
from django.conf import settings
import string
import random


def generate_referral_code():
    """シンプルな8文字の英数字コードを生成"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choice(characters) for _ in range(8))


class ReferralLink(models.Model):
    """紹介リンク"""
    referrer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='referral_links'
    )
    referral_code = models.CharField(
        max_length=8,
        unique=True,
        default=generate_referral_code,
        verbose_name='紹介コード'
    )
    is_active = models.BooleanField(default=True, verbose_name='有効')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.referrer.username} - {self.referral_code}"
    
    @property
    def referral_url(self):
        return f"http://localhost:3000/invite/{self.referral_code}"


class Referral(models.Model):
    """紹介実績"""
    referrer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='referrals_made'
    )
    referred_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='referrals_received'
    )
    referral_link = models.ForeignKey(
        ReferralLink,
        on_delete=models.CASCADE
    )
    appointment = models.ForeignKey(
        'bookings.Appointment',
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    is_successful = models.BooleanField(
        default=False,
        verbose_name='紹介成功'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['referrer', 'referred_user']
    
    def __str__(self):
        return f"{self.referrer.username} → {self.referred_user.username}"
