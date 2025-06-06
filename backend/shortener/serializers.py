from rest_framework import serializers
from .models import ShortenedURL, ABTestVariant
from analytics.models import ClickEvent
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta

class ABTestVariantSerializer(serializers.ModelSerializer):
    """Serializer for A/B test variants."""
    
    conversion_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = ABTestVariant
        fields = [
            'id', 'name', 'destination_url', 'weight', 
            'access_count', 'conversion_count', 'conversion_rate'
        ]
    
    def get_conversion_rate(self, obj):
        """Calculate conversion rate."""
        if obj.access_count == 0:
            return 0
        return round((obj.conversion_count / obj.access_count) * 100, 2)

class ShortenedURLSerializer(serializers.ModelSerializer):
    """Serializer for shortened URLs."""
    
    full_short_url = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    clicks_count = serializers.SerializerMethodField()
    qr_code_url = serializers.SerializerMethodField()
    variants = ABTestVariantSerializer(many=True, read_only=True)
    
    class Meta:
        model = ShortenedURL
        fields = [
            'id', 'original_url', 'short_code', 'full_short_url',
            'created_at', 'last_accessed', 'expires_at', 'user',
            'access_count', 'title', 'is_custom_code', 'is_active',
            'is_expired', 'clicks_count', 'qr_code_url', 'is_ab_test',
            'variants'
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
    
    # A/B testing fields
    is_ab_test = serializers.BooleanField(required=False, default=False)
    variants = serializers.ListField(
        child=serializers.DictField(),
        required=False
    )
    
    class Meta:
        model = ShortenedURL
        fields = [
            'original_url', 'custom_code', 'title', 
            'expiration_days', 'expiration_date', 'expiration_type',
            'is_active', 'is_ab_test', 'variants'
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
        
        # Check if the URL already exists for the current user
        original_url = data.get('original_url')
        request = self.context.get('request')
        
        if request and request.user.is_authenticated and original_url:
            # Don't check for duplicates if this is an A/B test
            if not data.get('is_ab_test', False):
                existing_url = ShortenedURL.objects.filter(
                    user=request.user,
                    original_url=original_url
                ).first()
                
                if existing_url:
                    raise serializers.ValidationError({
                        'original_url': f'You already have a shortened URL for this link. Please check your dashboard for the short code: {existing_url.short_code}'
                    })
        
        # For anonymous users, we can't check duplicates effectively since they don't have accounts
        # We could optionally check by IP, but that's not a reliable way to track user identity
        # So we'll allow anonymous users to create duplicate URLs
        
        # Validate A/B testing variants
        if data.get('is_ab_test', False):
            variants = data.get('variants', [])
            
            if not variants:
                raise serializers.ValidationError({
                    'variants': 'At least one variant is required for A/B testing.'
                })
            
            if len(variants) < 2:
                raise serializers.ValidationError({
                    'variants': 'At least two variants are required for A/B testing.'
                })
            
            # Check that all variants have the required fields
            for i, variant in enumerate(variants):
                if not variant.get('destination_url'):
                    raise serializers.ValidationError({
                        f'variants[{i}].destination_url': 'Destination URL is required for each variant.'
                    })
                
                # Ensure weight is between 1 and 100
                weight = variant.get('weight', 50)
                if weight < 1 or weight > 100:
                    raise serializers.ValidationError({
                        f'variants[{i}].weight': 'Weight must be between 1 and 100.'
                    })
            
            # Check that weights sum to 100
            total_weight = sum(variant.get('weight', 50) for variant in variants)
            if total_weight != 100:
                raise serializers.ValidationError({
                    'variants': f'The sum of all variant weights must be 100. Current sum: {total_weight}'
                })
                
        return data
        
    def create(self, validated_data):
        """Create a new shortened URL with custom options."""
        user = self.context['request'].user if 'request' in self.context else None
        
        # Extract A/B testing variants
        is_ab_test = validated_data.pop('is_ab_test', False)
        variants_data = validated_data.pop('variants', [])
        
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
        
        # Set A/B testing flag
        validated_data['is_ab_test'] = is_ab_test
        
        # Create the shortened URL
        shortened_url = ShortenedURL.objects.create(**validated_data)
        
        # Create A/B testing variants if applicable
        if is_ab_test and variants_data:
            for variant_data in variants_data:
                ABTestVariant.objects.create(
                    shortened_url=shortened_url,
                    destination_url=variant_data.get('destination_url'),
                    weight=variant_data.get('weight', 50),
                    name=variant_data.get('name', 'Variant')
                )
        
        return shortened_url 