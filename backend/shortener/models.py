from django.db import models
from django.conf import settings
import string
import random
from django.utils import timezone

def generate_short_code(length=6):
    """Generate a random short code for URL."""
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))


class Tag(models.Model):
    """Model to store tags for organizing URLs."""
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=20, default="#3B82F6")  # Default blue color
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tags'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('name', 'user')
        ordering = ['name']
    
    def __str__(self):
        return self.name


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
    
    # Tags for organization
    tags = models.ManyToManyField(Tag, related_name='urls', blank=True)
    
    # Folder/organization
    folder = models.CharField(max_length=100, blank=True, null=True)
    
    # Custom redirect page settings
    use_redirect_page = models.BooleanField(default=False)
    redirect_page_type = models.CharField(
        max_length=20, 
        choices=[
            ('default', 'Default'),
            ('rocket', 'Rocket Animation'),
            ('working', 'People Working'),
            ('digging', 'Digging Animation'),
        ],
        default='default',
        blank=True
    )
    redirect_delay = models.PositiveSmallIntegerField(default=3, help_text="Delay in seconds before redirecting")
    custom_redirect_message = models.CharField(max_length=255, blank=True, null=True)
    brand_name = models.CharField(max_length=100, blank=True, null=True)
    brand_logo_url = models.URLField(max_length=2000, blank=True, null=True)

    def __str__(self):
        return f"{self.short_code} -> {self.original_url[:50]}..."
    
    def save(self, *args, **kwargs):
        # Generate a random short code if one is not provided
        if not self.short_code:
            self.short_code = self.generate_unique_code()
        super().save(*args, **kwargs)
        # Refresh from database to ensure we have the latest state
        if 'update_fields' not in kwargs:
            self.refresh_from_db()
    
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
        
    def update_expiration(self):
        """Update expiration date based on expiration_type."""
        if hasattr(self, 'expiration_type') and self.expiration_type:
            if self.expiration_type == 'days' and hasattr(self, 'expiration_days'):
                # Set expiration to N days from now
                days = getattr(self, 'expiration_days', 0)
                if days and int(days) > 0:
                    self.expires_at = timezone.now() + timezone.timedelta(days=int(days))
                    print(f"Set expiration to {days} days from now: {self.expires_at}")
                else:
                    self.expires_at = None
            elif self.expiration_type == 'date' and hasattr(self, 'expiration_date'):
                # Set to specific date
                date = getattr(self, 'expiration_date', None)
                if date:
                    self.expires_at = date
                    print(f"Set expiration to specific date: {self.expires_at}")
                else:
                    self.expires_at = None
            elif self.expiration_type == 'none':
                # No expiration
                self.expires_at = None
                print("Removed expiration date")
            else:
                print(f"Unknown expiration type: {self.expiration_type}")
        else:
            print(f"No expiration type provided: {getattr(self, 'expiration_type', 'None')}")
    
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
