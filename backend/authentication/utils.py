from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
import logging
import os

logger = logging.getLogger(__name__)

def send_verification_email(user):
    """
    Send an email verification email to the user.
    
    Args:
        user: The user object to send the verification email to
    
    Returns:
        bool: True if the email was sent successfully, False otherwise
    """
    try:
        # Record the time the verification email is sent
        user.email_verification_sent_at = timezone.now()
        user.save()
        
        # Create verification URL
        verification_url = f"{settings.FRONTEND_URL}/verify-email/{str(user.email_verification_token)}/{user.email}/"
        
        # Prepare email context
        context = {
            'user': user,
            'verification_url': verification_url,
            'expiration_days': settings.EMAIL_VERIFICATION_TIMEOUT_DAYS,
        }
        
        # Render email template
        email_html = render_to_string('authentication/email_verification.html', context)
        
        # Create email message
        email = EmailMessage(
            subject='Verify Your Email - URLBriefr',
            body=email_html,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        email.content_subtype = 'html'
        
        # Send email
        email.send(fail_silently=False)
        
        logger.info(f"Verification email sent to {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send verification email to {user.email}: {str(e)}")
        return False


def can_use_mailgun():
    """
    Check if Mailgun is properly configured
    
    Returns:
        bool: True if Mailgun is properly configured, False otherwise
    """
    api_key = settings.ANYMAIL.get("MAILGUN_API_KEY", "")
    domain = settings.ANYMAIL.get("MAILGUN_SENDER_DOMAIN", "")
    
    # Check if keys are not the default values and not empty
    has_api_key = api_key and api_key != "your-mailgun-api-key"
    has_domain = domain and domain != "your-domain.mailgun.org"
    
    return has_api_key and has_domain


def use_gmail_backend():
    """
    Configure the email backend to use Gmail SMTP
    
    Note: This function modifies Django settings at runtime, which is generally not recommended
    for production use. It's provided here for testing and development purposes.
    """
    settings.EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    settings.EMAIL_HOST = 'smtp.gmail.com'
    settings.EMAIL_PORT = 587
    settings.EMAIL_USE_TLS = True
    
    # Log the change
    logger.info("Email backend switched to Gmail SMTP")
    
    
def use_console_backend():
    """
    Configure the email backend to use the console backend
    
    Note: This function modifies Django settings at runtime, which is generally not recommended
    for production use. It's provided here for testing and development purposes.
    """
    settings.EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    
    # Log the change
    logger.info("Email backend switched to console output") 