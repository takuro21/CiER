from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Referral
from accounts.models import Badge


@receiver(post_save, sender=Referral)
def update_referral_badges(sender, instance, **kwargs):
    """紹介成功時にバッジを更新"""
    if instance.is_successful:
        referrer = instance.referrer
        successful_count = Referral.objects.filter(
            referrer=referrer,
            is_successful=True
        ).count()
        
        # バッジの基準
        badge_thresholds = {
            'bronze': 1,
            'silver': 5,
            'gold': 10,
            'platinum': 20,
        }
        
        for badge_type, threshold in badge_thresholds.items():
            if successful_count >= threshold:
                badge, created = Badge.objects.get_or_create(
                    user=referrer,
                    badge_type=badge_type,
                    defaults={'referral_count': successful_count}
                )
                if not created:
                    badge.referral_count = successful_count
                    badge.save()
