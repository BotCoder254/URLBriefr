from rest_framework import serializers
from .models import ShortenedURL, ABTestVariant, Tag, IPRestriction, SpoofingAttempt
from analytics.models import ClickEvent
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta
import logging

# Set up logger for this module
logger = logging.getLogger(__name__)

class TagSerializer(serializers.ModelSerializer):
    """Serializer for tags."""
    url_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Tag
        fields = ['id', 'name', 'color', 'created_at', 'url_count']
        read_only_fields = ['created_at', 'url_count']
    
    def get_url_count(self, obj):
        """Get the number of URLs using this tag."""
        return obj.urls.count()
    
    def create(self, validated_data):
        """Create a new tag."""
        user = self.context['request'].user
        
        # If user is not included in data, use the requesting user
        if user.is_authenticated and 'user' not in validated_data:
            validated_data['user'] = user
            
        return super().create(validated_data)

class IPRestrictionSerializer(serializers.ModelSerializer):
    """Serializer for IP restrictions."""
    
    class Meta:
        model = IPRestriction
        fields = ['id', 'restriction_type', 'ip_address', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']
        
    def create(self, validated_data):
        """Create a new IP restriction."""
        user = self.context['request'].user
        
        # If user is not included in data, use the requesting user
        if user.is_authenticated and 'user' not in validated_data:
            validated_data['user'] = user
            
        return super().create(validated_data)

class SpoofingAttemptSerializer(serializers.ModelSerializer):
    """Serializer for spoofing attempts."""
    
    class Meta:
        model = SpoofingAttempt
        fields = ['id', 'ip_address', 'user_agent', 'attempt_time', 'short_code', 'reason']
        read_only_fields = ['id', 'attempt_time']

class ABTestVariantSerializer(serializers.ModelSerializer):
    """Serializer for A/B test variants."""
    
    conversion_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = ABTestVariant
        fields = [
            'id', 'shortened_url', 'destination_url', 'weight', 'name',
            'access_count', 'conversion_count', 'conversion_rate'
        ]
        read_only_fields = ['id', 'access_count', 'conversion_count', 'conversion_rate']
    
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
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        many=True,
        write_only=True,
        required=False
    )
    
    # Add fields for expiration handling to make them not required in updates
    expiration_type = serializers.ChoiceField(
        choices=['none', 'days', 'date'],
        required=False
    )
    expiration_days = serializers.IntegerField(required=False)
    expiration_date = serializers.DateTimeField(required=False)
    
    # New security feature fields
    ip_restrictions = IPRestrictionSerializer(many=True, read_only=True)
    ip_restriction_ids = serializers.PrimaryKeyRelatedField(
        queryset=IPRestriction.objects.all(),
        many=True,
        write_only=True,
        required=False
    )
    cloned_from_info = serializers.SerializerMethodField()
    is_tampered = serializers.SerializerMethodField()
    
    # New one-time use field
    one_time_use = serializers.BooleanField(required=False)
    
    # New preview fields
    enable_preview = serializers.BooleanField(required=False)
    preview_image = serializers.URLField(required=False, allow_blank=True, max_length=2000)
    preview_description = serializers.CharField(required=False, allow_blank=True, max_length=255)
    preview_title = serializers.CharField(required=False, allow_blank=True, max_length=100)
    preview_updated_at = serializers.DateTimeField(required=False)
    
    class Meta:
        model = ShortenedURL
        fields = [
            'id', 'original_url', 'short_code', 'full_short_url',
            'created_at', 'last_accessed', 'expires_at', 'user',
            'access_count', 'title', 'is_custom_code', 'is_active',
            'is_expired', 'clicks_count', 'qr_code_url', 'is_ab_test',
            'variants', 'tags', 'tag_ids', 'folder',
            'use_redirect_page', 'redirect_page_type', 'redirect_delay',
            'custom_redirect_message', 'brand_name', 'brand_logo_url',
            'expiration_type', 'expiration_days', 'expiration_date',
            # New security fields
            'enable_ip_restrictions', 'ip_restrictions', 'ip_restriction_ids',
            'spoofing_protection', 'integrity_hash', 'is_tampered',
            'cloned_from', 'cloned_from_info',
            # New one-time use field
            'one_time_use',
            # New preview fields
            'enable_preview', 'preview_image', 'preview_description', 'preview_title', 'preview_updated_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'last_accessed',
            'access_count', 'full_short_url', 'is_expired',
            'clicks_count', 'qr_code_url', 'integrity_hash',
            'is_tampered', 'cloned_from_info', 'preview_updated_at'
        ]
        extra_kwargs = {
            'user': {'required': False},
            'folder': {'required': False},
            'use_redirect_page': {'required': False},
            'redirect_page_type': {'required': False},
            'redirect_delay': {'required': False},
            'custom_redirect_message': {'required': False},
            'brand_name': {'required': False},
            'brand_logo_url': {'required': False},
            'original_url': {'required': False},
            'short_code': {'required': False},
            'title': {'required': False},
            'is_active': {'required': False},
            'is_ab_test': {'required': False},
            'cloned_from': {'required': False},
            'enable_ip_restrictions': {'required': False},
            'spoofing_protection': {'required': False}
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
        
    def get_is_tampered(self, obj):
        """Check if URL integrity has been compromised."""
        if not obj.spoofing_protection or not obj.integrity_hash:
            return False
        return not obj.verify_integrity()
        
    def get_cloned_from_info(self, obj):
        """Get information about the original URL if this is a clone."""
        if not obj.cloned_from:
            return None
            
        return {
            'id': obj.cloned_from.id,
            'short_code': obj.cloned_from.short_code,
            'title': obj.cloned_from.title,
            'original_url': obj.cloned_from.original_url
        }
    
    def to_representation(self, instance):
        """Custom representation to handle RelatedManager objects."""
        representation = super().to_representation(instance)
        
        # Ensure tags are properly serialized
        if 'tags' in representation and representation['tags'] is None:
            representation['tags'] = []
            
        # Ensure expires_at is included and properly formatted
        if hasattr(instance, 'expires_at'):
            if instance.expires_at is not None:
                # Format the date explicitly to ensure it's included
                representation['expires_at'] = instance.expires_at.isoformat()
            else:
                # If it's None, make sure it's explicitly null in the response
                representation['expires_at'] = None
                
        # Debug log
        print(f"to_representation for URL ID {getattr(instance, 'id', 'unknown')}: expires_at in response: {'expires_at' in representation}")
            
        return representation
    
    def create(self, validated_data):
        """Create a new shortened URL."""
        user = self.context['request'].user
        
        # If user is authenticated, associate URL with user
        if user.is_authenticated:
            validated_data['user'] = user
        
        # Handle tag_ids and ip_restriction_ids separately
        tag_ids = validated_data.pop('tag_ids', None)
        ip_restriction_ids = validated_data.pop('ip_restriction_ids', None)
        
        # Create the URL
        shortened_url = super().create(validated_data)
        
        # Set tags if provided
        if tag_ids is not None:
            # Handle empty list case explicitly
            if len(tag_ids) > 0:
                shortened_url.tags.set(tag_ids)
            else:
                # Clear any existing tags
                shortened_url.tags.clear()
                
        # Set IP restrictions if provided
        if ip_restriction_ids is not None:
            if len(ip_restriction_ids) > 0:
                shortened_url.ip_restrictions.set(ip_restriction_ids)
            else:
                shortened_url.ip_restrictions.clear()
            
        return shortened_url

    def validate_tag_ids(self, value):
        """Validate that the user can only use their own tags."""
        user = self.context['request'].user
        
        if not user.is_authenticated:
            raise serializers.ValidationError("You must be logged in to use tags.")
        
        for tag in value:
            if tag.user != user:
                raise serializers.ValidationError(f"Tag '{tag.name}' does not belong to you.")
            
        return value
        
    def validate_ip_restriction_ids(self, value):
        """Validate that the user can only use their own IP restrictions."""
        user = self.context['request'].user
        
        if not user.is_authenticated:
            raise serializers.ValidationError("You must be logged in to use IP restrictions.")
        
        for restriction in value:
            if restriction.user and restriction.user != user:
                raise serializers.ValidationError(
                    f"IP restriction '{restriction}' does not belong to you."
                )
            
        return value
        
    def update(self, instance, validated_data):
        """Update a shortened URL."""
        # Handle expiration fields explicitly
        expiration_type = validated_data.pop('expiration_type', None)
        
        if expiration_type:
            print(f"Updating URL expiration - Type: {expiration_type}")
            
            if expiration_type == 'days':
                expiration_days = validated_data.pop('expiration_days', None)
                if expiration_days:
                    # Calculate expiration date
                    try:
                        expiration_days = int(expiration_days)
                        instance.expires_at = timezone.now() + timedelta(days=expiration_days)
                        print(f"Setting expiration date {expiration_days} days from now: {instance.expires_at}")
                    except (ValueError, TypeError) as e:
                        print(f"Error setting expiration days: {e}")
            elif expiration_type == 'date':
                expiration_date = validated_data.pop('expiration_date', None)
                if expiration_date:
                    try:
                        # Ensure we have a valid date object
                        if isinstance(expiration_date, str):
                            expiration_date = datetime.fromisoformat(expiration_date.replace('Z', '+00:00'))
                        instance.expires_at = expiration_date
                        print(f"Setting expiration date to: {instance.expires_at}")
                    except (ValueError, TypeError) as e:
                        print(f"Error setting expiration date: {e} - Value was: {expiration_date}")
            elif expiration_type == 'none':
                # Explicitly set expires_at to None for 'never' expiration
                instance.expires_at = None
                print("Setting expiration date to None (never expires)")
        
        # Handle tag_ids and ip_restriction_ids
        tag_ids = validated_data.pop('tag_ids', None)
        ip_restriction_ids = validated_data.pop('ip_restriction_ids', None)
        
        # Remove extra fields that aren't in the model
        if 'expiration_days' in validated_data:
            validated_data.pop('expiration_days')
        if 'expiration_date' in validated_data:
            validated_data.pop('expiration_date')
            
        # If spoofing protection is enabled, generate integrity hash
        if 'spoofing_protection' in validated_data and validated_data['spoofing_protection'] and not instance.integrity_hash:
            instance.generate_integrity_hash()
            
        # Update the remaining fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Set tags if provided
        if tag_ids is not None:
            instance.tags.set(tag_ids)
            
        # Set IP restrictions if provided
        if ip_restriction_ids is not None:
            instance.ip_restrictions.set(ip_restriction_ids)
            
        # Save the instance
        instance.save()
        
        # Explicitly refresh the instance from the database
        instance.refresh_from_db()
        
        # Get a fresh copy to ensure all fields are loaded properly
        refreshed_instance = ShortenedURL.objects.get(pk=instance.pk)
        
        # Log the final instance data for debugging
        logger.info(f"Updated URL (ID: {refreshed_instance.id}) - expires_at: {refreshed_instance.expires_at}")
        print(f"Final expires_at value after update: {refreshed_instance.expires_at}")
            
        # Use the refreshed instance instead of the original
        return refreshed_instance

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
    
    # Tag fields
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        many=True,
        required=False,
        write_only=True
    )
    
    # New tags to create
    new_tags = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        write_only=True
    )
    
    # Custom redirect page fields
    use_redirect_page = serializers.BooleanField(required=False, default=False)
    redirect_page_type = serializers.ChoiceField(
        choices=['default', 'rocket', 'working', 'digging'],
        default='default',
        required=False
    )
    redirect_delay = serializers.IntegerField(required=False, min_value=1, max_value=10, default=3)
    custom_redirect_message = serializers.CharField(required=False, allow_blank=True, max_length=255)
    brand_name = serializers.CharField(required=False, allow_blank=True, max_length=100)
    brand_logo_url = serializers.URLField(required=False, allow_blank=True, max_length=2000)
    
    # One-time use link
    one_time_use = serializers.BooleanField(required=False, default=False)
    
    # Preview settings
    enable_preview = serializers.BooleanField(required=False, default=False)
    
    class Meta:
        model = ShortenedURL
        fields = [
            'original_url', 'custom_code', 'title', 
            'expiration_days', 'expiration_date', 'expiration_type',
            'is_active', 'is_ab_test', 'variants', 'tag_ids',
            'new_tags', 'folder',
            'use_redirect_page', 'redirect_page_type', 'redirect_delay',
            'custom_redirect_message', 'brand_name', 'brand_logo_url',
            'one_time_use', 'enable_preview'
        ]
    
    def to_representation(self, instance):
        """Custom representation to handle RelatedManager objects."""
        # Use the ShortenedURLSerializer for the output representation
        serializer = ShortenedURLSerializer(instance, context=self.context)
        return serializer.data

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
        
        # If this is a folder creation (temporary URL), skip the duplicate check
        if data.get('title') == 'Temporary URL for folder creation':
            return data
            
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
        
        # Validate tags - skip validation for folder creation URLs
        if 'tag_ids' in data and data.get('title') != 'Temporary URL for folder creation':
            user = request.user if request else None
            if not user or not user.is_authenticated:
                raise serializers.ValidationError({
                    'tag_ids': 'You must be logged in to use tags.'
                })
            
            for tag in data['tag_ids']:
                if tag.user != user:
                    raise serializers.ValidationError({
                        'tag_ids': f"Tag '{tag.name}' does not belong to you."
                    })
        
        # Validate new tags - skip validation for folder creation URLs
        if 'new_tags' in data and data.get('title') != 'Temporary URL for folder creation':
            user = request.user if request else None
            if not user or not user.is_authenticated:
                raise serializers.ValidationError({
                    'new_tags': 'You must be logged in to create tags.'
                })
            
            for tag_data in data.get('new_tags', []):
                if not tag_data.get('name'):
                    raise serializers.ValidationError({
                        'new_tags': 'Tag name is required.'
                    })
                
                if Tag.objects.filter(user=user, name=tag_data['name']).exists():
                    raise serializers.ValidationError({
                        'new_tags': f"You already have a tag named '{tag_data['name']}'."
                    })
                
        return data
        
    def create(self, validated_data):
        """Create a new shortened URL with custom options."""
        user = self.context['request'].user if 'request' in self.context else None
        
        # Extract A/B testing variants
        is_ab_test = validated_data.pop('is_ab_test', False)
        variants_data = validated_data.pop('variants', [])
        
        # Extract tag data - handle empty list case explicitly
        tag_ids = []
        if 'tag_ids' in validated_data:
            tag_ids = validated_data.pop('tag_ids')
        new_tags_data = validated_data.pop('new_tags', [])
        
        # Process custom code if provided
        custom_code = validated_data.pop('custom_code', None)
        if custom_code:
            validated_data['short_code'] = custom_code
            validated_data['is_custom_code'] = True
        
        # Process expiration if provided
        expiration_type = validated_data.pop('expiration_type', 'none')
        
        print(f"Processing URL expiration - Type: {expiration_type}")
        
        if expiration_type == 'days':
            expiration_days = validated_data.pop('expiration_days', None)
            if expiration_days:
                validated_data['expires_at'] = timezone.now() + timedelta(days=expiration_days)
                print(f"Setting expiration date {expiration_days} days from now: {validated_data['expires_at']}")
        elif expiration_type == 'date':
            expiration_date = validated_data.pop('expiration_date', None)
            if expiration_date:
                validated_data['expires_at'] = expiration_date
                print(f"Setting expiration date to: {validated_data['expires_at']}")
        elif expiration_type == 'none':
            # Explicitly set expires_at to None for 'never' expiration
            validated_data['expires_at'] = None
            print("Setting expiration date to None (never expires)")
                
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
        
        # Add existing tags
        if tag_ids and user and user.is_authenticated:
            # Handle empty list case explicitly
            if len(tag_ids) > 0:
                shortened_url.tags.set(tag_ids)
        
        # Create and add new tags
        if new_tags_data and user and user.is_authenticated:
            for tag_data in new_tags_data:
                tag, created = Tag.objects.get_or_create(
                    user=user,
                    name=tag_data['name'],
                    defaults={'color': tag_data.get('color', '#3B82F6')}
                )
                shortened_url.tags.add(tag)
        
        return shortened_url 

class CloneURLSerializer(serializers.Serializer):
    """Serializer for cloning a URL."""
    
    # Fields that can be modified in the clone
    original_url = serializers.URLField(required=False)
    title = serializers.CharField(max_length=255, required=False)
    is_active = serializers.BooleanField(required=False)
    folder = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    
    # Expiration settings
    expiration_type = serializers.ChoiceField(
        choices=['none', 'days', 'date'],
        required=False
    )
    expiration_days = serializers.IntegerField(required=False)
    expiration_date = serializers.DateTimeField(required=False)
    
    # Security settings
    enable_ip_restrictions = serializers.BooleanField(required=False)
    spoofing_protection = serializers.BooleanField(required=False)
    
    # Custom redirect settings
    use_redirect_page = serializers.BooleanField(required=False)
    redirect_page_type = serializers.ChoiceField(
        choices=['default', 'rocket', 'working', 'digging'],
        required=False
    )
    redirect_delay = serializers.IntegerField(required=False)
    custom_redirect_message = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    brand_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    brand_logo_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    
    # One-time use link
    one_time_use = serializers.BooleanField(required=False)
    
    # Preview settings
    enable_preview = serializers.BooleanField(required=False)
    
    # Tags
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        many=True,
        required=False
    )
    
    def validate_tag_ids(self, value):
        """Validate that the user can only use their own tags."""
        user = self.context['request'].user
        
        if not user.is_authenticated:
            raise serializers.ValidationError("You must be logged in to use tags.")
        
        for tag in value:
            if tag.user != user:
                raise serializers.ValidationError(f"Tag '{tag.name}' does not belong to you.")
            
        return value
    
    def validate(self, data):
        """Validate that the expiration settings are correct."""
        expiration_type = data.get('expiration_type')
        
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