from django.contrib import admin
from .models import ShortenedURL, Tag, ABTestVariant

@admin.register(ShortenedURL)
class ShortenedURLAdmin(admin.ModelAdmin):
    """Admin interface for ShortenedURL model."""
    
    list_display = ('short_code', 'truncated_original_url', 'user', 'created_at', 'access_count', 'is_active', 'folder')
    list_filter = ('is_active', 'is_custom_code', 'created_at', 'folder', 'tags')
    search_fields = ('short_code', 'original_url', 'user__email', 'folder')
    readonly_fields = ('created_at', 'last_accessed', 'access_count')
    filter_horizontal = ('tags',)
    fieldsets = (
        (None, {
            'fields': ('original_url', 'short_code', 'title', 'user')
        }),
        ('Status', {
            'fields': ('is_active', 'is_custom_code', 'expires_at')
        }),
        ('Organization', {
            'fields': ('folder', 'tags')
        }),
        ('Statistics', {
            'fields': ('access_count', 'created_at', 'last_accessed')
        }),
    )
    
    def truncated_original_url(self, obj):
        """Truncate the original URL for display."""
        if len(obj.original_url) > 50:
            return obj.original_url[:50] + '...'
        return obj.original_url
    
    truncated_original_url.short_description = 'Original URL'

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    """Admin interface for Tag model."""
    
    list_display = ('name', 'color', 'user', 'created_at', 'url_count')
    list_filter = ('created_at', 'user')
    search_fields = ('name', 'user__email')
    readonly_fields = ('created_at',)
    
    def url_count(self, obj):
        """Get the number of URLs with this tag."""
        return obj.urls.count()
    
    url_count.short_description = 'URLs Count'

@admin.register(ABTestVariant)
class ABTestVariantAdmin(admin.ModelAdmin):
    """Admin interface for ABTestVariant model."""
    
    list_display = ('name', 'shortened_url', 'destination_url_truncated', 'weight', 'access_count', 'conversion_count')
    list_filter = ('created_at',)
    search_fields = ('name', 'destination_url', 'shortened_url__short_code')
    readonly_fields = ('access_count', 'conversion_count', 'created_at')
    
    def destination_url_truncated(self, obj):
        """Truncate the destination URL for display."""
        if len(obj.destination_url) > 50:
            return obj.destination_url[:50] + '...'
        return obj.destination_url
    
    destination_url_truncated.short_description = 'Destination URL'
