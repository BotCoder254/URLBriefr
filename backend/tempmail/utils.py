"""
Utility functions for tempmail integration.
"""
from django.utils import timezone
from .models import TempEmailSession


def is_tempmail_address(email_address):
    """Check if an email address is a temporary email address."""
    from django.conf import settings
    domain = getattr(settings, 'TEMPMAIL_DOMAIN', 'yourdomain.com')
    return email_address.endswith(f'@{domain}')


def get_active_tempmail_session(email_address):
    """Get active tempmail session for an email address."""
    if not is_tempmail_address(email_address):
        return None
    
    return TempEmailSession.objects.filter(
        email_address=email_address,
        is_active=True,
        expires_at__gt=timezone.now()
    ).first()


def create_tempmail_session_for_email(email_address, duration_minutes=60):
    """Create a tempmail session for a specific email address."""
    if not is_tempmail_address(email_address):
        return None
    
    # Check if session already exists
    existing_session = get_active_tempmail_session(email_address)
    if existing_session:
        return existing_session
    
    # Extract the local part (before @)
    local_part = email_address.split('@')[0]
    
    # Create session with specific email
    from datetime import timedelta
    expires_at = timezone.now() + timedelta(minutes=duration_minutes)
    
    session = TempEmailSession.objects.create(
        email_address=email_address,
        expires_at=expires_at,
        ip_address='127.0.0.1'  # Default for system-generated
    )
    
    return session


def extend_tempmail_session(email_address, minutes=30):
    """Extend a tempmail session."""
    session = get_active_tempmail_session(email_address)
    if session:
        session.extend_session(minutes)
        return session
    return None