from django.contrib import admin
from .models import ShortenedURL

@admin.register(ShortenedURL)
class ShortenedURLAdmin(admin.ModelAdmin):
    """Admin interface for ShortenedURL model."""
    
    list_display = ('short_code', 'truncated_original_url', 'user', 'created_at', 'access_count', 'is_active')
    list_filter = ('is_active', 'is_custom_code', 'created_at')
    search_fields = ('short_code', 'original_url', 'user__email')
    readonly_fields = ('created_at', 'last_accessed', 'access_count')
    fieldsets = (
        (None, {
            'fields': ('original_url', 'short_code', 'title', 'user')
        }),
        ('Status', {
            'fields': ('is_active', 'is_custom_code', 'expires_at')
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
