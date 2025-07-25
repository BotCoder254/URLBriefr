"""
Custom email backend that routes emails to temporary email addresses
to the tempmail system instead of sending them externally.
"""
import logging
from django.core.mail.backends.base import BaseEmailBackend
from django.conf import settings
from .models import TempEmailSession, TempEmailMessage
from django.utils import timezone
import uuid

logger = logging.getLogger(__name__)


class TempMailBackend(BaseEmailBackend):
    """
    Email backend that intercepts emails sent to temporary email addresses
    and delivers them to the tempmail system.
    """
    
    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        # Fallback to SMTP for non-tempmail addresses
        from django.core.mail.backends.smtp import EmailBackend
        self.smtp_backend = EmailBackend(fail_silently=fail_silently, **kwargs)
    
    def send_messages(self, email_messages):
        """
        Send email messages, routing tempmail addresses to the tempmail system
        and others to the regular SMTP backend.
        """
        if not email_messages:
            return 0
        
        sent_count = 0
        tempmail_messages = []
        smtp_messages = []
        
        # Separate tempmail and regular email messages
        for message in email_messages:
            has_tempmail = False
            for recipient in message.to:
                if self._is_tempmail_address(recipient):
                    tempmail_messages.append((message, recipient))
                    has_tempmail = True
            
            if not has_tempmail:
                smtp_messages.append(message)
        
        # Send regular emails via SMTP
        if smtp_messages:
            try:
                sent_count += self.smtp_backend.send_messages(smtp_messages)
            except Exception as e:
                logger.error(f"Error sending SMTP emails: {str(e)}")
                if not self.fail_silently:
                    raise
        
        # Process tempmail messages
        for message, recipient in tempmail_messages:
            try:
                if self._deliver_to_tempmail(message, recipient):
                    sent_count += 1
            except Exception as e:
                logger.error(f"Error delivering to tempmail {recipient}: {str(e)}")
                if not self.fail_silently:
                    raise
        
        return sent_count
    
    def _is_tempmail_address(self, email_address):
        """Check if an email address is a temporary email address."""
        from django.conf import settings
        domain = getattr(settings, 'TEMPMAIL_DOMAIN', 'yourdomain.com')
        return email_address.endswith(f'@{domain}')
    
    def _deliver_to_tempmail(self, message, recipient):
        """Deliver an email message to the tempmail system."""
        try:
            # Find the active session for this email address
            session = TempEmailSession.objects.filter(
                email_address=recipient,
                is_active=True,
                expires_at__gt=timezone.now()
            ).first()
            
            if not session:
                logger.warning(f"No active session found for tempmail address: {recipient}")
                return False
            
            # Extract message content
            subject = message.subject or ''
            from_email = message.from_email or 'noreply@urlbriefr.com'
            
            # Get message body
            body_text = ''
            body_html = ''
            
            if hasattr(message, 'body') and message.body:
                body_text = message.body
            
            # Handle multipart messages
            if hasattr(message, 'alternatives') and message.alternatives:
                for content, content_type in message.alternatives:
                    if content_type == 'text/html':
                        body_html = content
                        break
            
            # If no plain text body but we have HTML, extract text
            if not body_text and body_html:
                # Simple HTML to text conversion
                import re
                body_text = re.sub(r'<[^>]+>', '', body_html)
                body_text = body_text.replace('&nbsp;', ' ').replace('&amp;', '&')
                body_text = body_text.replace('&lt;', '<').replace('&gt;', '>')
            
            # Create the tempmail message
            temp_message = TempEmailMessage.objects.create(
                session=session,
                message_id=f"django_{uuid.uuid4()}",
                sender_email=from_email,
                sender_name=getattr(message, 'from_name', ''),
                subject=subject,
                body_text=body_text,
                body_html=body_html,
                headers={
                    'From': from_email,
                    'To': recipient,
                    'Subject': subject,
                    'Date': timezone.now().isoformat(),
                    'Message-ID': f"django_{uuid.uuid4()}",
                },
                expires_at=session.expires_at
            )
            
            logger.info(f"Delivered email to tempmail: {from_email} -> {recipient} (Subject: {subject})")
            return True
            
        except Exception as e:
            logger.error(f"Error delivering email to tempmail: {str(e)}")
            return False