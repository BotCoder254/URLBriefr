from rest_framework import serializers
from .models import ShortenedURL
from analytics.models import ClickEvent
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta

class ShortenedURLSerializer(serializers.ModelSerializer):
    """Serializer for shortened URLs."""
    
    full_short_url = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    clicks_count = serializers.SerializerMethodField()
    qr_code_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ShortenedURL
        fields = [
            'id', 'original_url', 'short_code', 'full_short_url',
            'created_at', 'last_accessed', 'expires_at', 'user',
            'access_count', 'title', 'is_custom_code', 'is_active',
            'is_expired', 'clicks_count', 'qr_code_url'
        ]
        read_only_fields = [
            'id', 'created_at', 'last_accessed',
            'access_count', 'full_short_url', 'is_expired',
            'clicks_count', 'qr_code_url'
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
    
    def get_qr_code_url(self, obj):
        """Get the URL for the QR code."""
        return f"{settings.URL_SHORTENER_DOMAIN}/api/qr/{obj.short_code}"
    
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
    expiration_date = serializers.DateTimeField(required=False)
    expiration_type = serializers.ChoiceField(
        choices=['none', 'days', 'date'], 
        default='none',
        required=False
    )
    
    class Meta:
        model = ShortenedURL
        fields = [
            'original_url', 'custom_code', 'title', 
            'expiration_days', 'expiration_date', 'expiration_type',
            'is_active'
        ]
        
    def validate(self, data):
        """Validate expiration settings."""
        expiration_type = data.get('expiration_type', 'none')
        
        if expiration_type == 'days' and 'expiration_days' not in data:
            raise serializers.ValidationError({
                'expiration_days': 'This field is required when expiration_type is "days".'
            })
            
        if expiration_type == 'date' and 'expiration_date' not in data:
            raise serializers.ValidationError({
                'expiration_date': 'This field is required when expiration_type is "date".'
            })
            
        # Validate expiration date is in the future
        if expiration_type == 'date' and 'expiration_date' in data:
            if data['expiration_date'] <= timezone.now():
                raise serializers.ValidationError({
                    'expiration_date': 'Expiration date must be in the future.'
                })
                
        return data
        
    def create(self, validated_data):
        """Create a new shortened URL with custom options."""
        user = self.context['request'].user if 'request' in self.context else None
        
        # Process custom code if provided
        custom_code = validated_data.pop('custom_code', None)
        if custom_code:
            validated_data['short_code'] = custom_code
            validated_data['is_custom_code'] = True
        
        # Process expiration if provided
        expiration_type = validated_data.pop('expiration_type', 'none')
        
        if expiration_type == 'days':
            expiration_days = validated_data.pop('expiration_days', None)
            if expiration_days:
                validated_data['expires_at'] = timezone.now() + timedelta(days=expiration_days)
        elif expiration_type == 'date':
            expiration_date = validated_data.pop('expiration_date', None)
            if expiration_date:
                validated_data['expires_at'] = expiration_date
                
        # Remove extra fields that aren't in the model
        if 'expiration_days' in validated_data:
            validated_data.pop('expiration_days')
        if 'expiration_date' in validated_data:
            validated_data.pop('expiration_date')
        
        # If user is authenticated, associate URL with user
        if user and user.is_authenticated:
            validated_data['user'] = user
        
        return ShortenedURL.objects.create(**validated_data) 