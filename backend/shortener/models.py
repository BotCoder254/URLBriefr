from django.db import models
from django.conf import settings
import string
import random
from django.utils import timezone
import hashlib
import ipaddress

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


class IPRestriction(models.Model):
    """Model to store IP restrictions for URLs."""
    TYPE_CHOICES = [
        ('allow', 'Allow List'),
        ('block', 'Block List'),
    ]
    
    restriction_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='block')
    ip_address = models.CharField(max_length=50)  # Can be single IP or CIDR notation
    description = models.CharField(max_length=255, blank=True, null=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ip_restrictions',
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.restriction_type}: {self.ip_address}"
    
    def is_ip_match(self, ip_to_check):
        """Check if an IP address matches this restriction."""
        try:
            # Handle CIDR notation
            if '/' in self.ip_address:
                network = ipaddress.ip_network(self.ip_address, strict=False)
                ip = ipaddress.ip_address(ip_to_check)
                return ip in network
            # Handle single IP
            else:
                return self.ip_address == ip_to_check
        except ValueError:
            return False


class MalwareDetectionResult(models.Model):
    """Model to store malware detection results for URLs."""
    STATUS_CHOICES = [
        ('clean', 'Clean'),
        ('suspicious', 'Suspicious'),
        ('malicious', 'Malicious'),
        ('phishing', 'Phishing'),
        ('spam', 'Spam'),
        ('pending', 'Pending Scan'),
        ('error', 'Scan Error'),
    ]
    
    url = models.URLField(max_length=2000)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    scan_date = models.DateTimeField(auto_now=True)
    details = models.TextField(blank=True, null=True)
    threat_types = models.JSONField(default=dict, blank=True, null=True)
    confidence_score = models.FloatField(default=0.0)  # 0-1 score for confidence in detection
    
    def __str__(self):
        return f"{self.url[:50]}... - {self.status}"


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
    
    # Favorite feature
    is_favorite = models.BooleanField(default=False)
    
    # Malware detection
    malware_detection = models.OneToOneField(
        MalwareDetectionResult,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shortened_url'
    )
    
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
    
    # Security features
    integrity_hash = models.CharField(max_length=64, blank=True, null=True, help_text="SHA-256 hash to verify URL integrity")
    enable_ip_restrictions = models.BooleanField(default=False, help_text="Enable IP-based access control")
    ip_restrictions = models.ManyToManyField(IPRestriction, related_name='urls', blank=True)
    spoofing_protection = models.BooleanField(default=False, help_text="Enable protection against link spoofing")
    
    # One-time use link feature
    one_time_use = models.BooleanField(default=False, help_text="Link expires after first use")
    
    # Live preview feature
    enable_preview = models.BooleanField(default=False, help_text="Enable live preview of destination content")
    preview_image = models.URLField(max_length=2000, blank=True, null=True, help_text="URL to preview image of destination")
    preview_description = models.TextField(blank=True, null=True, help_text="Description of destination content")
    preview_title = models.CharField(max_length=255, blank=True, null=True, help_text="Title of destination content")
    preview_updated_at = models.DateTimeField(null=True, blank=True, help_text="When the preview was last updated")
    
    # Cloning info
    cloned_from = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='clones',
        help_text="The original URL this was cloned from"
    )

    def __str__(self):
        return f"{self.short_code} -> {self.original_url[:50]}..."
    
    def save(self, *args, **kwargs):
        # Generate a random short code if one is not provided
        if not self.short_code:
            self.short_code = self.generate_unique_code()
            
        # Generate integrity hash if it's enabled but not set
        if self.spoofing_protection and not self.integrity_hash:
            self.generate_integrity_hash()
            
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
    
    def generate_integrity_hash(self):
        """Generate SHA-256 hash for tamper-proof verification."""
        data = f"{self.original_url}|{self.short_code}|{settings.SECRET_KEY}"
        self.integrity_hash = hashlib.sha256(data.encode()).hexdigest()
        return self.integrity_hash
    
    def verify_integrity(self):
        """Verify the URL hasn't been tampered with."""
        if not self.integrity_hash:
            return False
        
        expected_hash = self.generate_integrity_hash()
        return self.integrity_hash == expected_hash
    
    def is_ip_allowed(self, ip_address):
        """Check if an IP address is allowed to access this URL."""
        if not self.enable_ip_restrictions:
            return True
            
        # Get all restrictions for this URL
        restrictions = self.ip_restrictions.all()
        
        # If no restrictions, allow access
        if not restrictions.exists():
            return True
            
        # Check allow list first
        allow_list = restrictions.filter(restriction_type='allow')
        if allow_list.exists():
            # If there's an allow list, IP must be in it
            for restriction in allow_list:
                if restriction.is_ip_match(ip_address):
                    return True
            return False
        
        # Otherwise, check block list
        block_list = restrictions.filter(restriction_type='block')
        for restriction in block_list:
            if restriction.is_ip_match(ip_address):
                return False
                
        # If not in any block list, allow access
        return True
        
    def toggle_favorite(self):
        """Toggle the favorite status of the URL."""
        self.is_favorite = not self.is_favorite
        self.save(update_fields=['is_favorite'])
        return self.is_favorite
    
    def scan_for_malware(self):
        """Initiate a scan for malware and phishing."""
        from .tasks import scan_url_for_threats
        
        # Create or update malware detection result
        if self.malware_detection:
            detection_result = self.malware_detection
        else:
            detection_result = MalwareDetectionResult(url=self.original_url)
            detection_result.save()
            self.malware_detection = detection_result
            self.save(update_fields=['malware_detection'])
            
        # Set status to pending
        detection_result.status = 'pending'
        detection_result.save(update_fields=['status'])
        
        try:
            # Try to use Celery for asynchronous processing
            scan_url_for_threats.delay(self.id)
            detection_result.details = "Scan in progress..."
            detection_result.save(update_fields=['details'])
        except Exception as e:
            # If Celery is not available or fails, handle the scan directly
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to queue malware scan task: {str(e)}")
            
            try:
                # Try to perform a simple scan directly
                from .tasks import simple_url_safety_check
                result = simple_url_safety_check(self.original_url)
                detection_result.status = result['status']
                detection_result.details = result['details'] + " (Performed synchronously due to worker unavailability)"
                detection_result.confidence_score = result['confidence']
                detection_result.save()
                logger.info(f"Performed synchronous fallback scan for URL {self.id}: {result['status']}")
            except Exception as inner_e:
                logger.error(f"Failed to perform direct scan: {str(inner_e)}")
                detection_result.status = 'error'
                detection_result.details = f"Scan failed: Worker unavailable and direct scan error: {str(inner_e)}"
                detection_result.save()
            
        return {
            'success': True,
            'message': 'Scan initiated',
            'status': detection_result.status,
            'details': detection_result.details,
            'fallback_used': 'worker unavailable' in detection_result.details if detection_result.details else False
        }
    
    def clone(self, user=None, modifications=None):
        """Clone this URL with optional modifications."""
        if modifications is None:
            modifications = {}
            
        # Create a new instance but don't save yet
        clone = ShortenedURL(
            original_url=modifications.get('original_url', self.original_url),
            title=modifications.get('title', f"Clone of {self.title or self.short_code}"),
            user=user or self.user,
            cloned_from=self,
            is_active=modifications.get('is_active', self.is_active),
            is_custom_code=False,  # Always generate a new code for clones
            use_redirect_page=modifications.get('use_redirect_page', self.use_redirect_page),
            redirect_page_type=modifications.get('redirect_page_type', self.redirect_page_type),
            redirect_delay=modifications.get('redirect_delay', self.redirect_delay),
            custom_redirect_message=modifications.get('custom_redirect_message', self.custom_redirect_message),
            brand_name=modifications.get('brand_name', self.brand_name),
            brand_logo_url=modifications.get('brand_logo_url', self.brand_logo_url),
            folder=modifications.get('folder', self.folder),
            enable_ip_restrictions=modifications.get('enable_ip_restrictions', self.enable_ip_restrictions),
            spoofing_protection=modifications.get('spoofing_protection', self.spoofing_protection),
        )
        
        # Set expiration if provided
        if 'expires_at' in modifications:
            clone.expires_at = modifications['expires_at']
        elif self.expires_at:
            # If the original has an expiration, copy it
            clone.expires_at = self.expires_at
            
        # Save the clone to generate a new short code
        clone.save()
        
        # Copy tags if not specified in modifications
        if 'tags' not in modifications and self.tags.exists():
            clone.tags.set(self.tags.all())
            
        # Copy IP restrictions if enabled and not specified
        if clone.enable_ip_restrictions and 'ip_restrictions' not in modifications and self.ip_restrictions.exists():
            clone.ip_restrictions.set(self.ip_restrictions.all())
            
        return clone
        
    @classmethod
    def deactivate_expired_urls(cls):
        """Deactivate all URLs that have expired."""
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


class SpoofingAttempt(models.Model):
    """Model to track link spoofing attempts."""
    ip_address = models.CharField(max_length=50)
    user_agent = models.TextField(blank=True, null=True)
    attempt_time = models.DateTimeField(auto_now_add=True)
    short_code = models.CharField(max_length=15)
    reason = models.CharField(max_length=255)
    
    def __str__(self):
        return f"{self.ip_address} - {self.short_code} - {self.attempt_time}"
