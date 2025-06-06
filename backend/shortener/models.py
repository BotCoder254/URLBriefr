from django.db import models
from django.conf import settings
import string
import random
from django.utils import timezone

def generate_short_code(length=6):
    """Generate a random short code for URL."""
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))


class ShortenedURL(models.Model):
    """Model to store shortened URLs."""
    
    original_url = models.URLField(max_length=2000)
    short_code = models.CharField(max_length=15, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_accessed = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    # Track the owner of the URL (can be null for guest users)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='shortened_urls',
        null=True,
        blank=True
    )
    
    # Counters
    access_count = models.PositiveIntegerField(default=0)
    
    # Custom settings
    title = models.CharField(max_length=255, blank=True, null=True)
    is_custom_code = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    # A/B testing flag
    is_ab_test = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.short_code} -> {self.original_url[:50]}..."
    
    def save(self, *args, **kwargs):
        # Generate a random short code if one is not provided
        if not self.short_code:
            self.short_code = self.generate_unique_code()
        super().save(*args, **kwargs)
    
    def generate_unique_code(self):
        """Generate a unique short code that doesn't exist yet."""
        code = generate_short_code()
        while ShortenedURL.objects.filter(short_code=code).exists():
            code = generate_short_code()
        return code
    
    def is_expired(self):
        """Check if the URL is expired."""
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False
    
    def increment_counter(self):
        """Increment access counter and update last accessed time."""
        self.access_count += 1
        self.last_accessed = timezone.now()
        self.save(update_fields=['access_count', 'last_accessed'])
        
    @classmethod
    def deactivate_expired_urls(cls):
        """Find and deactivate all expired URLs."""
        now = timezone.now()
        expired_urls = cls.objects.filter(
            expires_at__lt=now,
            is_active=True
        )
        
        count = expired_urls.count()
        if count > 0:
            expired_urls.update(is_active=False)
            
        return count


class ABTestVariant(models.Model):
    """Model to store A/B test variants for a shortened URL."""
    
    shortened_url = models.ForeignKey(
        ShortenedURL,
        on_delete=models.CASCADE,
        related_name='variants'
    )
    destination_url = models.URLField(max_length=2000)
    weight = models.PositiveIntegerField(default=50)  # Percentage weight (0-100)
    name = models.CharField(max_length=100, default="Variant")  # Name for the variant (e.g., "Version A")
    
    # Analytics
    access_count = models.PositiveIntegerField(default=0)
    conversion_count = models.PositiveIntegerField(default=0)  # Optional: for tracking conversions
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.name} ({self.weight}%) -> {self.destination_url[:50]}..."
    
    def increment_counter(self):
        """Increment access counter."""
        self.access_count += 1
        self.save(update_fields=['access_count'])
    
    def increment_conversion(self):
        """Increment conversion counter."""
        self.conversion_count += 1
        self.save(update_fields=['conversion_count'])
