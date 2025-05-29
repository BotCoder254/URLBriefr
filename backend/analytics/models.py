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
    
    class Meta:
        ordering = ['-timestamp']
        
    def __str__(self):
        return f"{self.url.short_code} - {self.timestamp}"
