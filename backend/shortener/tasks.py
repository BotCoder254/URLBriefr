from django.utils import timezone
import requests
import logging
import json
import os
from django.conf import settings

# Import utility functions
from .utils import simple_url_safety_check, check_google_safe_browsing, scan_url_for_threats_sync, deactivate_expired_urls

logger = logging.getLogger(__name__)

# Try to import Celery, but don't fail if it's not available
try:
    from celery import shared_task
    CELERY_AVAILABLE = True
except ImportError:
    CELERY_AVAILABLE = False
    # Create a dummy decorator for when Celery is not available
    def shared_task(func):
        return func

@shared_task
def deactivate_expired_urls_task():
    """
    Celery task to deactivate expired URLs.
    This task should be scheduled to run periodically.
    """
    count = deactivate_expired_urls()
    return f"Deactivated {count} expired URLs"

@shared_task
def scan_url_for_threats(url_id):
    """
    Celery task to scan a URL for malware, phishing, and other threats.
    Uses a combination of reputation databases and APIs.
    """
    return scan_url_for_threats_sync(url_id)

# Functions are now imported from utils.py 