from django.utils import timezone
from celery import shared_task
from .models import ShortenedURL

@shared_task
def deactivate_expired_urls():
    """
    Celery task to deactivate expired URLs.
    This task should be scheduled to run periodically.
    """
    count = ShortenedURL.deactivate_expired_urls()
    return f"Deactivated {count} expired URLs" 