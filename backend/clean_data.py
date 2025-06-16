# Clean duplicate data
from bookings.models import Service

# Keep only the first 4 services (original ones)
Service.objects.filter(id__gt=4).delete()

print("重複データを削除しました！")
