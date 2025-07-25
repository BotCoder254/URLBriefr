from django.db import models
from django.utils import timezone
from datetime import timedelta
import uuid
import random
import string


class TempEmailSession(models.Model):
    """Model to store temporary email sessions."""
    
    session_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    email_address = models.EmailField(unique=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    
    # Usage statistics
    message_count = models.PositiveIntegerField(default=0)
    last_accessed = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email_address']),
            models.Index(fields=['session_token']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"{self.email_address} (expires: {self.expires_at})"
    
    @classmethod
    def generate_email(cls, ip_address=None, duration_minutes=30):
        """Generate a new temporary email address."""
        # Generate random email prefix
        prefix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        # Use configured domain for temporary emails
        from django.conf import settings
        domain = getattr(settings, 'TEMPMAIL_DOMAIN', 'yourdomain.com')
        email_address = f"{prefix}@{domain}"
        
        # Ensure uniqueness
        while cls.objects.filter(email_address=email_address).exists():
            prefix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
            email_address = f"{prefix}@tempbriefr.com"
        
        # Create session
        expires_at = timezone.now() + timedelta(minutes=duration_minutes)
        
        session = cls.objects.create(
            email_address=email_address,
            ip_address=ip_address,
            expires_at=expires_at
        )
        
        return session
    
    def is_expired(self):
        """Check if the session is expired."""
        return timezone.now() > self.expires_at
    
    def extend_session(self, minutes=10):
        """Extend the session by specified minutes."""
        self.expires_at = timezone.now() + timedelta(minutes=minutes)
        self.save(update_fields=['expires_at'])
    
    def time_remaining(self):
        """Get remaining time in seconds."""
        if self.is_expired():
            return 0
        return int((self.expires_at - timezone.now()).total_seconds())
    
    @classmethod
    def cleanup_expired(cls):
        """Remove expired sessions and their messages."""
        expired_sessions = cls.objects.filter(expires_at__lt=timezone.now())
        count = expired_sessions.count()
        
        # Delete associated messages first
        for session in expired_sessions:
            session.messages.all().delete()
        
        # Delete expired sessions
        expired_sessions.delete()
        
        return count


class TempEmailMessage(models.Model):
    """Model to store received temporary emails."""
    
    session = models.ForeignKey(
        TempEmailSession,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    
    # Email metadata
    message_id = models.CharField(max_length=255, unique=True)
    sender_email = models.EmailField()
    sender_name = models.CharField(max_length=255, blank=True, null=True)
    subject = models.CharField(max_length=255, blank=True, null=True)
    
    # Email content
    body_text = models.TextField(blank=True, null=True)
    body_html = models.TextField(blank=True, null=True)
    
    # Email headers (stored as JSON)
    headers = models.JSONField(default=dict, blank=True)
    
    # Message status
    is_read = models.BooleanField(default=False)
    received_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    # Security and spam detection
    is_spam = models.BooleanField(default=False)
    spam_score = models.FloatField(default=0.0)
    
    # Message size (in bytes)
    size_bytes = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['-received_at']
        indexes = [
            models.Index(fields=['session', '-received_at']),
            models.Index(fields=['message_id']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"From {self.sender_email}: {self.subject or '(No Subject)'}"
    
    def save(self, *args, **kwargs):
        # Set expiration time if not set
        if not self.expires_at:
            self.expires_at = self.session.expires_at
        
        # Calculate message size
        if not self.size_bytes:
            text_size = len(self.body_text or '')
            html_size = len(self.body_html or '')
            self.size_bytes = text_size + html_size
        
        super().save(*args, **kwargs)
        
        # Update session message count
        self.session.message_count = self.session.messages.count()
        self.session.save(update_fields=['message_count'])
    
    def mark_as_read(self):
        """Mark message as read."""
        if not self.is_read:
            self.is_read = True
            self.save(update_fields=['is_read'])
    
    def is_expired(self):
        """Check if the message is expired."""
        return timezone.now() > self.expires_at
    
    def get_display_body(self):
        """Get the best available body content."""
        if self.body_html:
            return self.body_html
        return self.body_text or ''
    
    def get_sender_display(self):
        """Get formatted sender display."""
        if self.sender_name:
            return f"{self.sender_name} <{self.sender_email}>"
        return self.sender_email
    
    @classmethod
    def cleanup_expired(cls):
        """Remove expired messages."""
        expired_count = cls.objects.filter(expires_at__lt=timezone.now()).count()
        cls.objects.filter(expires_at__lt=timezone.now()).delete()
        return expired_count


class TempEmailAttachment(models.Model):
    """Model to store email attachments."""
    
    message = models.ForeignKey(
        TempEmailMessage,
        on_delete=models.CASCADE,
        related_name='attachments'
    )
    
    filename = models.CharField(max_length=255)
    content_type = models.CharField(max_length=100)
    size_bytes = models.PositiveIntegerField()
    file_data = models.BinaryField()  # Store small attachments directly
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['filename']
    
    def __str__(self):
        return f"{self.filename} ({self.size_bytes} bytes)"
    
    def get_size_display(self):
        """Get human-readable file size."""
        if self.size_bytes < 1024:
            return f"{self.size_bytes} B"
        elif self.size_bytes < 1024 * 1024:
            return f"{self.size_bytes / 1024:.1f} KB"
        else:
            return f"{self.size_bytes / (1024 * 1024):.1f} MB"


class EmailBlacklist(models.Model):
    """Model to store blacklisted email addresses or domains."""
    
    TYPE_CHOICES = [
        ('email', 'Email Address'),
        ('domain', 'Domain'),
    ]
    
    blacklist_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    value = models.CharField(max_length=255, unique=True)
    reason = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['blacklist_type', 'value']),
        ]
    
    def __str__(self):
        return f"{self.blacklist_type}: {self.value}"
    
    @classmethod
    def is_blacklisted(cls, email_address):
        """Check if an email address is blacklisted."""
        # Check exact email match
        if cls.objects.filter(
            blacklist_type='email',
            value=email_address.lower(),
            is_active=True
        ).exists():
            return True
        
        # Check domain match
        domain = email_address.split('@')[-1].lower()
        if cls.objects.filter(
            blacklist_type='domain',
            value=domain,
            is_active=True
        ).exists():
            return True
        
        return False