from django.db import models
from django.conf import settings


class Service(models.Model):
    """サービスメニュー"""
    name = models.CharField(max_length=100, verbose_name='サービス名')
    description = models.TextField(blank=True, verbose_name='説明')
    duration_minutes = models.PositiveIntegerField(verbose_name='所要時間（分）')
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='料金'
    )
    is_active = models.BooleanField(default=True, verbose_name='有効')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} - ¥{self.price}"


class Stylist(models.Model):
    """スタイリスト"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='stylist_profile'
    )
    bio = models.TextField(blank=True, verbose_name='自己紹介')
    experience_years = models.PositiveIntegerField(
        default=0,
        verbose_name='経験年数'
    )
    # 既存のservicesフィールド（後で削除予定）
    services = models.ManyToManyField(
        Service,
        blank=True,
        verbose_name='提供サービス（旧）'
    )
    is_available = models.BooleanField(default=True, verbose_name='予約受付中')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"スタイリスト: {self.user.username}"
    
    def get_available_services(self):
        """利用可能なサービス一覧（新しいシステム）"""
        return self.stylist_services.filter(is_available=True)


class StylistService(models.Model):
    """スタイリストとサービスの中間テーブル（美容師ごとの所要時間設定）"""
    stylist = models.ForeignKey(
        Stylist,
        on_delete=models.CASCADE,
        related_name='stylist_services'
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name='stylist_services'
    )
    duration_minutes = models.PositiveIntegerField(
        verbose_name='この美容師での所要時間（分）',
        help_text='このスタイリストがこのサービスを行う際の所要時間'
    )
    price_override = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='価格上書き',
        help_text='空白の場合はサービス標準価格を使用'
    )
    is_available = models.BooleanField(
        default=True,
        verbose_name='提供可能'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['stylist', 'service']
        verbose_name = 'スタイリストサービス'
        verbose_name_plural = 'スタイリストサービス'
    
    def __str__(self):
        return f"{self.stylist.user.username} - {self.service.name} ({self.duration_minutes}分)"
    
    @property
    def effective_price(self):
        """実際の価格（上書き価格または標準価格）"""
        return self.price_override if self.price_override else self.service.price


class Appointment(models.Model):
    """予約"""
    STATUS_CHOICES = [
        ('RESERVED', '予約済み'),
        ('PAID', '支払い済み'),
        ('CANCELLED', 'キャンセル'),
        ('COMPLETED', '完了'),
    ]
    
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='appointments'
    )
    stylist = models.ForeignKey(
        Stylist,
        on_delete=models.CASCADE,
        related_name='appointments'
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE
    )
    appointment_date = models.DateTimeField(verbose_name='予約日時')
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='RESERVED'
    )
    requires_payment = models.BooleanField(
        default=False,
        verbose_name='事前支払い要否'
    )
    stripe_payment_intent_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name='Stripe Payment Intent ID'
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='合計金額'
    )
    notes = models.TextField(
        blank=True,
        verbose_name='備考'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-appointment_date']
    
    def __str__(self):
        return f"{self.customer.username} - {self.service.name} ({self.appointment_date})"
