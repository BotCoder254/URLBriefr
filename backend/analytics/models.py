from django.db import models
from shortener.models import ShortenedURL
from django.utils import timezone

class ClickEvent(models.Model):
    """Model to store click analytics for shortened URLs."""
    
    url = models.ForeignKey(
        ShortenedURL, 
        on_delete=models.CASCADE,
        related_name='clicks'
    )
    timestamp = models.DateTimeField(default=timezone.now)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    # Device info
    user_agent = models.TextField(blank=True, null=True)
    browser = models.CharField(max_length=100, blank=True, null=True)
    device = models.CharField(max_length=100, blank=True, null=True)
    os = models.CharField(max_length=100, blank=True, null=True)
    
    # Location info (can be populated by IP geolocation)
    country = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    
    # Referrer info
    referrer = models.URLField(max_length=2000, blank=True, null=True)
    
    # Session identifier
    session_id = models.CharField(max_length=100, blank=True, null=True)
    
    class Meta:
        ordering = ['-timestamp']
        
    def __str__(self):
        return f"{self.url.short_code} - {self.timestamp}"

class UserSession(models.Model):
    """Model to track visitor sessions for retention metrics and funnel analysis."""
    
    url = models.ForeignKey(
        ShortenedURL,
        on_delete=models.CASCADE,
        related_name='sessions'
    )
    session_id = models.CharField(max_length=100)
    visitor_id = models.CharField(max_length=100, blank=True, null=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    # Session timestamps
    first_visit = models.DateTimeField(default=timezone.now)
    last_visit = models.DateTimeField(default=timezone.now)
    visit_count = models.PositiveIntegerField(default=1)
    
    # Funnel stages
    reached_destination = models.BooleanField(default=False)
    completed_action = models.BooleanField(default=False)
    
    # Device info (from first visit)
    user_agent = models.TextField(blank=True, null=True)
    browser = models.CharField(max_length=100, blank=True, null=True)
    device = models.CharField(max_length=100, blank=True, null=True)
    os = models.CharField(max_length=100, blank=True, null=True)
    
    class Meta:
        ordering = ['-last_visit']
        unique_together = ('url', 'session_id')
        
    def __str__(self):
        return f"Session {self.session_id[:8]}... - {self.url.short_code}"
    
    def update_visit(self):
        """Update the session with a new visit."""
        self.last_visit = timezone.now()
        self.visit_count += 1
        self.save(update_fields=['last_visit', 'visit_count'])
