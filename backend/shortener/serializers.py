from rest_framework import serializers
from .models import ShortenedURL
from analytics.models import ClickEvent
from django.conf import settings

class ShortenedURLSerializer(serializers.ModelSerializer):
    """Serializer for shortened URLs."""
    
    full_short_url = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    clicks_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ShortenedURL
        fields = [
            'id', 'original_url', 'short_code', 'full_short_url',
            'created_at', 'last_accessed', 'expires_at', 'user',
            'access_count', 'title', 'is_custom_code', 'is_active',
            'is_expired', 'clicks_count'
        ]
        read_only_fields = [
            'id', 'created_at', 'last_accessed',
            'access_count', 'full_short_url', 'is_expired',
            'clicks_count'
        ]
        extra_kwargs = {
            'user': {'required': False}
        }
    
    def get_full_short_url(self, obj):
        """Get the full shortened URL."""
        return f"{settings.URL_SHORTENER_DOMAIN}/s/{obj.short_code}"
    
    def get_is_expired(self, obj):
        """Check if URL is expired."""
        return obj.is_expired()
    
    def get_clicks_count(self, obj):
        """Get the number of clicks."""
        return obj.access_count
    
    def create(self, validated_data):
        """Create a new shortened URL."""
        user = self.context['request'].user
        
        # If user is authenticated, associate URL with user
        if user.is_authenticated:
            validated_data['user'] = user
        
        return super().create(validated_data)


class CreateShortenedURLSerializer(serializers.ModelSerializer):
    """Serializer for creating shortened URLs with less fields."""
    
    custom_code = serializers.CharField(required=False, allow_blank=True)
    expiration_days = serializers.IntegerField(required=False, min_value=1, max_value=365)
    
    class Meta:
        model = ShortenedURL
        fields = ['original_url', 'custom_code', 'title', 'expiration_days']
        
    def create(self, validated_data):
        """Create a new shortened URL with custom options."""
        user = self.context['request'].user if 'request' in self.context else None
        
        # Process custom code if provided
        custom_code = validated_data.pop('custom_code', None)
        if custom_code:
            validated_data['short_code'] = custom_code
            validated_data['is_custom_code'] = True
        
        # Process expiration if provided
        expiration_days = validated_data.pop('expiration_days', None)
        if expiration_days:
            from django.utils import timezone
            validated_data['expires_at'] = timezone.now() + timezone.timedelta(days=expiration_days)
        
        # If user is authenticated, associate URL with user
        if user and user.is_authenticated:
            validated_data['user'] = user
        
        return ShortenedURL.objects.create(**validated_data) 