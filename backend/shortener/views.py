from django.shortcuts import render, redirect, get_object_or_404
from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django_filters.rest_framework import DjangoFilterBackend
from .models import ShortenedURL, Tag, ABTestVariant, IPRestriction, SpoofingAttempt, MalwareDetectionResult
from .serializers import (
    ShortenedURLSerializer, CreateShortenedURLSerializer, TagSerializer, 
    ABTestVariantSerializer, IPRestrictionSerializer, SpoofingAttemptSerializer,
    CloneURLSerializer, MalwareDetectionResultSerializer
)
from analytics.models import ClickEvent, UserSession
from django.http import HttpResponseRedirect, HttpResponse
from django.utils import timezone
from user_agents import parse
from ipware import get_client_ip
import qrcode
import io
from django.conf import settings
import base64
import requests
import random
import uuid
import hashlib
from django.db.models import Count, Q
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import json

# Constants for user limits
MAX_FOLDERS_PER_USER = 5

def get_location_from_ip(ip_address):
    """Get country and city from IP address using a free geolocation service."""
    if not ip_address or ip_address in ['127.0.0.1', 'localhost', '::1']:
        return {'country': 'Unknown', 'city': 'Unknown'}
    
    try:
        # Using ipapi.co free service (1000 requests per day)
        response = requests.get(f'https://ipapi.co/{ip_address}/json/', timeout=5)
        if response.status_code == 200:
            data = response.json()
            country = data.get('country_name', 'Unknown')
            city = data.get('city', 'Unknown')
            
            # Handle empty or null values
            if not country or country.lower() in ['none', 'null', '']:
                country = 'Unknown'
            if not city or city.lower() in ['none', 'null', '']:
                city = 'Unknown'
                
            return {'country': country, 'city': city}
    except Exception as e:
        print(f"Error getting location for IP {ip_address}: {str(e)}")
    
    # Fallback: try another free service
    try:
        # Using ip-api.com free service (1000 requests per hour)
        response = requests.get(f'http://ip-api.com/json/{ip_address}', timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'success':
                country = data.get('country', 'Unknown')
                city = data.get('city', 'Unknown')
                
                # Handle empty or null values
                if not country or country.lower() in ['none', 'null', '']:
                    country = 'Unknown'
                if not city or city.lower() in ['none', 'null', '']:
                    city = 'Unknown'
                    
                return {'country': country, 'city': city}
    except Exception as e:
        print(f"Error getting location from fallback service for IP {ip_address}: {str(e)}")
    
    # If all services fail, return Unknown
    return {'country': 'Unknown', 'city': 'Unknown'}
MAX_TAGS_PER_USER = 10
MAX_IP_RESTRICTIONS_PER_USER = 20


class TagViewSet(viewsets.ModelViewSet):
    """ViewSet for managing tags."""
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get tags for the current user."""
        return Tag.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['get'])
    def urls(self, request, pk=None):
        """Get all URLs with this tag."""
        tag = self.get_object()
        urls = tag.urls.all()
        serializer = ShortenedURLSerializer(urls, many=True, context={'request': request})
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """Create a new tag with limit check."""
        # Count user's existing tags
        user = request.user
        tag_count = Tag.objects.filter(user=user).count()
        
        # Check if user has reached the tag limit
        if tag_count >= MAX_TAGS_PER_USER:
            return Response(
                {"error": f"You have reached the maximum limit of {MAX_TAGS_PER_USER} tags. Please delete some tags before creating new ones."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        return super().create(request, *args, **kwargs)


class IPRestrictionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing IP restrictions."""
    serializer_class = IPRestrictionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get IP restrictions for the current user."""
        return IPRestriction.objects.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Create a new IP restriction with limit check."""
        # Count user's existing IP restrictions
        user = request.user
        restriction_count = IPRestriction.objects.filter(user=user).count()
        
        # Check if user has reached the IP restriction limit
        if restriction_count >= MAX_IP_RESTRICTIONS_PER_USER:
            return Response(
                {"error": f"You have reached the maximum limit of {MAX_IP_RESTRICTIONS_PER_USER} IP restrictions. Please delete some restrictions before creating new ones."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        return super().create(request, *args, **kwargs)


class SpoofingAttemptViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing spoofing attempts (read-only)."""
    serializer_class = SpoofingAttemptSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = SpoofingAttempt.objects.all().order_by('-attempt_time')


class MalwareDetectionResultViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing malware detection results (read-only)."""
    serializer_class = MalwareDetectionResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']
    
    def get_queryset(self):
        """Get malware detection results for the current user."""
        user = self.request.user
        if user.is_authenticated:
            # Get results for URLs owned by this user
            return MalwareDetectionResult.objects.filter(
                shortened_url__user=user
            ).order_by('-scan_date')
        return MalwareDetectionResult.objects.none()


class ShortenedURLViewSet(viewsets.ModelViewSet):
    """ViewSet for shortened URLs."""
    
    serializer_class = ShortenedURLSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'is_ab_test', 'folder', 'enable_ip_restrictions', 'spoofing_protection']
    search_fields = ['short_code', 'original_url', 'title']
    ordering_fields = ['created_at', 'access_count', 'last_accessed']
    ordering = ['-created_at']
    
    def update(self, request, *args, **kwargs):
        """Custom update method to ensure all fields are returned properly."""
        # Get the instance to be updated
        partial = kwargs.pop('partial', True)  # Always use partial updates to avoid requiring all fields
        instance = self.get_object()
        
        # For PATCH requests with expiration_type, get full URL data first
        if request.method == 'PATCH' and 'expiration_type' in request.data:
            print(f"Handling URL expiration update with expiration_type: {request.data.get('expiration_type')}")
            
            # For expiration updates, get the full URL data first
            # and combine it with the update data to ensure all required fields are present
            current_data = self.get_serializer(instance).data
            
            # Create a new data dictionary with all the current URL data
            full_data = {**current_data}
            
            # Update with the request data (only the expiration fields)
            for key in request.data:
                full_data[key] = request.data[key]
                
            print(f"Using complete data for URL update with current fields + expiration changes")
            
            # Use the serializer with complete data
            serializer = self.get_serializer(instance, data=full_data, partial=partial)
        else:
            # For non-expiration updates, use the request data directly
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Force refresh from database to ensure all fields are up to date
        instance.refresh_from_db()
        
        # Get a fresh instance to be extra sure
        fresh_instance = self.get_object()
        result_serializer = self.get_serializer(fresh_instance)
        return Response(result_serializer.data)
        
    @action(detail=True, methods=['patch'])
    def update_expiration(self, request, pk=None):
        """Special endpoint just for updating URL expiration."""
        instance = self.get_object()
        original_instance_id = instance.id
        print(f"Starting expiration update for URL ID {original_instance_id}")
        
        # Get current data to maintain all fields
        current_data = self.get_serializer(instance).data
        
        # Update only expiration fields
        expiration_type = request.data.get('expiration_type')
        if expiration_type == 'days':
            current_data['expiration_type'] = 'days'
            current_data['expiration_days'] = request.data.get('expiration_days')
            days = request.data.get('expiration_days')
            # Directly calculate expiration date for logging
            if days:
                future_date = timezone.now() + timezone.timedelta(days=int(days))
                print(f"Setting expiration to {days} days from now: {future_date}")
        elif expiration_type == 'date':
            current_data['expiration_type'] = 'date'
            expiration_date = request.data.get('expiration_date')
            current_data['expiration_date'] = expiration_date
            print(f"Setting expiration to date: {expiration_date}")
        else:
            current_data['expiration_type'] = 'none'
            print(f"Removing expiration (setting to none)")
            
        # Save original expiration for comparison
        original_expires_at = instance.expires_at
        
        print(f"Using serializer to update URL...")
        serializer = self.get_serializer(instance, data=current_data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        # Before saving, if it's a date-based expiration, directly set the expires_at field
        if expiration_type == 'date':
            try:
                date_value = request.data.get('expiration_date')
                # Make sure we have a datetime object
                from datetime import datetime
                if isinstance(date_value, str):
                    date_value = datetime.fromisoformat(date_value.replace('Z', '+00:00'))
                instance.expires_at = date_value
                print(f"Directly set expires_at to {instance.expires_at}")
            except Exception as e:
                print(f"Error directly setting date: {e}")
            
        # Perform the update
        self.perform_update(serializer)
        
        # Force refresh from database to ensure all fields are updated
        instance.refresh_from_db()
        print(f"After refresh_from_db, expires_at is: {instance.expires_at}")
        
        # Get a completely fresh instance from a new database query
        fresh_instance = ShortenedURL.objects.get(pk=instance.pk)
        print(f"Fresh instance from database has expires_at: {fresh_instance.expires_at}")
        
        # If expires_at is still None but shouldn't be, try a direct database update
        if expiration_type != 'none' and fresh_instance.expires_at is None:
            print(f"WARNING: expires_at is still None after update. Trying direct database update.")
            if expiration_type == 'days':
                days = int(request.data.get('expiration_days', 0))
                if days > 0:
                    # Direct database update
                    from django.utils import timezone
                    future_date = timezone.now() + timezone.timedelta(days=days)
                    ShortenedURL.objects.filter(pk=instance.pk).update(expires_at=future_date)
                    print(f"Directly updated database with expires_at={future_date}")
                    # Get fresh instance again
                    fresh_instance = ShortenedURL.objects.get(pk=instance.pk)
            elif expiration_type == 'date':
                date_value = request.data.get('expiration_date')
                if date_value:
                    # Direct database update
                    ShortenedURL.objects.filter(pk=instance.pk).update(expires_at=date_value)
                    print(f"Directly updated database with expires_at={date_value}")
                    # Get fresh instance again
                    fresh_instance = ShortenedURL.objects.get(pk=instance.pk)
        
        # Return data from the completely fresh instance
        result_serializer = self.get_serializer(fresh_instance)
        
        # Log the before and after state for debugging
        print(f"URL ID {original_instance_id} expiration update complete:")
        print(f"  - Original expires_at: {original_expires_at}")
        print(f"  - New expires_at: {fresh_instance.expires_at}")
        print(f"  - Has 'expires_at' in response: {'expires_at' in result_serializer.data}")
        if 'expires_at' in result_serializer.data:
            print(f"  - expires_at value in response: {result_serializer.data['expires_at']}")
            
        return Response(result_serializer.data)
    
    @action(detail=True, methods=['post'])
    def clone(self, request, pk=None):
        """Clone a URL with optional modifications."""
        instance = self.get_object()
        
        # Deserialize and validate the request data
        serializer = CloneURLSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        # Prepare modifications based on validated data
        modifications = serializer.validated_data
        
        # Handle expiration settings
        if 'expiration_type' in modifications:
            expiration_type = modifications.pop('expiration_type')
            
            if expiration_type == 'days' and 'expiration_days' in modifications:
                days = modifications.pop('expiration_days')
                expiration_date = timezone.now() + timezone.timedelta(days=days)
                modifications['expires_at'] = expiration_date
            elif expiration_type == 'date' and 'expiration_date' in modifications:
                modifications['expires_at'] = modifications.pop('expiration_date')
            elif expiration_type == 'none':
                modifications['expires_at'] = None
                
            # Remove any remaining expiration fields
            modifications.pop('expiration_days', None)
            modifications.pop('expiration_date', None)
        
        # Clone the URL
        cloned_url = instance.clone(user=request.user, modifications=modifications)
        
        # Set tags if provided
        if 'tag_ids' in serializer.validated_data:
            cloned_url.tags.set(serializer.validated_data['tag_ids'])
        
        # Return the serialized cloned URL
        response_serializer = ShortenedURLSerializer(cloned_url, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def regenerate_integrity_hash(self, request, pk=None):
        """Regenerate the integrity hash for a URL."""
        url = self.get_object()
        url.generate_integrity_hash()
        url.save(update_fields=['integrity_hash'])
        return Response({'integrity_hash': url.integrity_hash})
    
    @action(detail=True, methods=['post'])
    def update_preview(self, request, pk=None):
        """Fetch and update preview content for a destination URL."""
        url = self.get_object()
        
        try:
            # Use requests to fetch the destination page
            response = requests.get(url.original_url, timeout=10)
            response.raise_for_status()
            
            # Use BeautifulSoup to parse the HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract preview information
            title = soup.title.string if soup.title else None
            
            # Try to get a meta description
            description = None
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            if meta_desc:
                description = meta_desc.get('content', None)
            
            # Try to get an Open Graph image
            preview_image = None
            og_image = soup.find('meta', property='og:image')
            if og_image:
                preview_image = og_image.get('content', None)
            
            # If no OG image, try to find the first significant image
            if not preview_image:
                images = soup.find_all('img')
                for img in images:
                    # Skip tiny images, icons, etc.
                    if img.get('width') and int(img.get('width')) > 200:
                        src = img.get('src')
                        if src:
                            # Handle relative URLs
                            if not src.startswith('http'):
                                src = urljoin(url.original_url, src)
                            preview_image = src
                            break
            
            # Update the URL object with preview data
            url.enable_preview = True
            url.preview_title = title
            url.preview_description = description
            url.preview_image = preview_image
            url.preview_updated_at = timezone.now()
            url.save()
            
            return Response({
                'success': True,
                'preview': {
                    'title': title,
                    'description': description,
                    'image': preview_image,
                    'updated_at': url.preview_updated_at
                }
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def verify_integrity(self, request, pk=None):
        """Verify the integrity of a URL."""
        url = self.get_object()
        
        if not url.integrity_hash:
            return Response({
                'valid': False,
                'error': 'Integrity verification not enabled for this URL'
            })
            
        is_valid = url.verify_integrity()
        
        return Response({
            'valid': is_valid,
            'hash': url.integrity_hash
        })
    
    @action(detail=True, methods=['post'])
    def scan_for_malware(self, request, pk=None):
        """Scan a URL for malware."""
        url = self.get_object()
        
        try:
            # Initiate the scan
            scan_result = url.scan_for_malware()
            
            # Return the scan result
            return Response({
                'success': scan_result['success'],
                'message': scan_result['message'],
                'status': scan_result['status'],
                'details': scan_result['details'],
                'fallback_used': scan_result.get('fallback_used', False)
            })
        except Exception as e:
            # Log the error and return a friendly response
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error scanning URL {url.id} for malware: {str(e)}")
            
            return Response({
                'success': False,
                'message': 'Failed to initiate malware scan',
                'error': str(e),
                'fallback_used': True
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def toggle_favorite(self, request, pk=None):
        """Toggle the favorite status of a URL."""
        url = self.get_object()
        
        try:
            # Toggle the favorite status
            new_status = url.toggle_favorite()
            
            return Response({
                'success': True,
                'message': f'URL {"added to" if new_status else "removed from"} favorites',
                'is_favorite': new_status
            })
        except Exception as e:
            # Log the error and return a friendly response
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error toggling favorite status for URL {url.id}: {str(e)}")
            
            return Response({
                'success': False,
                'message': 'Failed to toggle favorite status',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_queryset(self):
        """Get the queryset based on user role."""
        user = self.request.user
        
        # Admin users can see all URLs
        if user.is_superuser or (hasattr(user, 'is_admin') and user.is_admin):
            queryset = ShortenedURL.objects.all()
        
        # Authenticated users can see their own URLs
        elif user.is_authenticated:
            queryset = ShortenedURL.objects.filter(user=user)
            
            # Apply filters from query parameters
            folder = self.request.query_params.get('folder', None)
            if folder is not None:
                queryset = queryset.filter(folder=folder)
            
            tag_ids = self.request.query_params.getlist('tag_id', None)
            if tag_ids:
                queryset = queryset.filter(tags__id__in=tag_ids).distinct()
                
            # Filter by clone status
            cloned = self.request.query_params.get('cloned', None)
            if cloned == 'true':
                queryset = queryset.filter(cloned_from__isnull=False)
            elif cloned == 'false':
                queryset = queryset.filter(cloned_from__isnull=True)
                
            # Filter by security features
            has_security = self.request.query_params.get('has_security', None)
            if has_security == 'true':
                queryset = queryset.filter(
                    Q(enable_ip_restrictions=True) | Q(spoofing_protection=True)
                )
            
            search = self.request.query_params.get('search', None)
            if search:
                queryset = queryset.filter(
                    Q(original_url__icontains=search) | 
                    Q(short_code__icontains=search) |
                    Q(title__icontains=search)
                )
            
            return queryset.order_by('-created_at')
        
        # Guest users can't see any URLs through API
        else:
            return ShortenedURL.objects.none()
    
    def get_permissions(self):
        """Get permissions based on action."""
        if self.action == 'create':
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        """Use different serializers based on action."""
        if self.action == 'create':
            return CreateShortenedURLSerializer
        if self.action == 'clone':
            return CloneURLSerializer
        return ShortenedURLSerializer
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get statistics for all user's URLs."""
        user = request.user
        if not user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        
        urls = ShortenedURL.objects.filter(user=user)
        total_clicks = sum(url.access_count for url in urls)
        
        # Add security stats
        security_enabled_count = urls.filter(
            Q(enable_ip_restrictions=True) | Q(spoofing_protection=True)
        ).count()
        
        # Add clone stats
        cloned_count = urls.filter(cloned_from__isnull=False).count()
        
        return Response({
            'total_urls': urls.count(),
            'total_clicks': total_clicks,
            'active_urls': urls.filter(is_active=True).count(),
            'security_enabled': security_enabled_count,
            'cloned_urls': cloned_count
        })
    
    @action(detail=False, methods=['get'])
    def folders(self, request):
        """Get all folders used by the user."""
        user = request.user
        if not user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        
        # Get all folders for this user - include folders from temporary URLs
        folders_query = ShortenedURL.objects.filter(
            user=user
        ).exclude(
            folder__isnull=True
        ).exclude(
            folder=''
        ).values_list('folder', flat=True).distinct()
        
        # Convert to list and ensure it's not empty
        folder_list = list(folders_query)
        print(f"Found {len(folder_list)} folders for user {user.email}: {folder_list}")
        
        # Ensure we never return None
        if folder_list is None:
            folder_list = []
        
        # Debug information
        all_urls = ShortenedURL.objects.filter(user=user)
        print(f"Total URLs for user: {all_urls.count()}")
        
        temp_urls = ShortenedURL.objects.filter(user=user, title='Temporary URL for folder creation')
        print(f"Temporary folder URLs: {temp_urls.count()}")
        
        urls_with_folders = ShortenedURL.objects.filter(user=user).exclude(folder='').exclude(folder__isnull=True)
        print(f"URLs with folders: {urls_with_folders.count()}")
        if urls_with_folders.count() > 0:
            print(f"Sample folders: {list(urls_with_folders.values_list('folder', flat=True)[:5])}")
            
        return Response(folder_list)
    
    def create(self, request, *args, **kwargs):
        """Create a new shortened URL."""
        # Check folder limit if user is authenticated and folder is provided
        user = request.user
        if user.is_authenticated and 'folder' in request.data and request.data['folder']:
            # Skip validation for temporary URL for folder creation
            if request.data.get('title') != 'Temporary URL for folder creation':
                # Count unique folders for this user
                folder_count = ShortenedURL.objects.filter(
                    user=user
                ).exclude(folder__isnull=True).exclude(folder='').values('folder').distinct().count()
                
                # Check if the folder already exists for this user
                folder_exists = ShortenedURL.objects.filter(
                    user=user, 
                    folder=request.data['folder']
                ).exists()
                
                # If it's a new folder and the user has reached the limit
                if not folder_exists and folder_count >= MAX_FOLDERS_PER_USER:
                    return Response(
                        {"error": f"You have reached the maximum limit of {MAX_FOLDERS_PER_USER} folders. Please delete some folders before creating new ones."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
        
        return super().create(request, *args, **kwargs)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def redirect_to_original(request, short_code):
    """Redirect to the original URL associated with the short code."""
    try:
        # Find the URL object
        url = get_object_or_404(ShortenedURL, short_code=short_code)
        
        # Get client IP address for analytics and security checks
        client_ip, is_routable = get_client_ip(request)
        user_agent_string = request.META.get('HTTP_USER_AGENT', '')
        user_agent = parse(user_agent_string)
        
        # Generate a session ID for tracking
        session_id = str(uuid.uuid4())
        
        # Check if URL is active
        if not url.is_active:
            # Return JSON response for inactive URLs
            return Response({
                'status': 'error',
                'reason': 'inactive',
                'message': 'This URL has been deactivated by its creator.'
            }, status=status.HTTP_404_NOT_FOUND)
            
        # Check if URL is expired
        if url.is_expired():
            # Return JSON response for expired URLs
            return Response({
                'status': 'error',
                'reason': 'expired',
                'message': 'This URL has expired and is no longer available.'
            }, status=status.HTTP_404_NOT_FOUND)
            
        # Check IP restrictions if enabled
        if url.enable_ip_restrictions and not url.is_ip_allowed(client_ip):
            # Log the blocked attempt
            print(f"IP blocked: {client_ip} attempted to access {short_code}")
            # Return forbidden response
            return Response({
                'status': 'error',
                'reason': 'ip_restricted',
                'message': 'Access to this URL is restricted from your IP address.'
            }, status=status.HTTP_403_FORBIDDEN)
            
        # Check for link spoofing if protection is enabled
        if url.spoofing_protection:
            if not url.verify_integrity():
                # Log spoofing attempt
                SpoofingAttempt.objects.create(
                    ip_address=client_ip,
                    user_agent=user_agent_string,
                    short_code=short_code,
                    reason="Integrity check failed"
                )
                return Response({
                    'status': 'error',
                    'reason': 'tampered',
                    'message': 'This URL appears to have been tampered with and cannot be validated.'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        # A/B testing logic
        destination_url = url.original_url  # Default URL
        is_ab_variant = False
        variant_id = None
        
        if url.is_ab_test:
            variants = url.variants.all()
            if variants.exists():
                # Get total weight
                total_weight = sum([v.weight for v in variants])
                
                # Pick a random variant based on weights
                if total_weight > 0:
                    random_num = random.randint(1, total_weight)
                    current_weight = 0
                    
                    for variant in variants:
                        current_weight += variant.weight
                        if random_num <= current_weight:
                            destination_url = variant.destination_url
                            variant.increment_counter()
                            is_ab_variant = True
                            variant_id = variant.id
                            break
        
        # Get location data from IP address
        location_data = get_location_from_ip(client_ip)
        
        # Create click event for analytics
        event = ClickEvent.objects.create(
            url=url,
            ip_address=client_ip,
            user_agent=user_agent_string,
            browser=user_agent.browser.family,
            os=user_agent.os.family,
            device=user_agent.device.family,
            country=location_data['country'],
            city=location_data['city'],
            session_id=session_id
        )
        
        # Create user session record
        UserSession.objects.create(
            session_id=session_id,
            url=url,
            ip_address=client_ip,
            user_agent=user_agent_string
        )
        
        # Increment URL access counter
        url.increment_counter()
        
        # Handle one-time use links - make the link inactive after this use
        if url.one_time_use:
            url.is_active = False
            url.save(update_fields=['is_active'])
        
        # Check if custom redirect page is enabled
        if url.use_redirect_page:
            # Prepare preview data if enabled
            preview_data = None
            if url.enable_preview and (url.preview_image or url.preview_title or url.preview_description):
                preview_data = {
                    'title': url.preview_title,
                    'description': url.preview_description,
                    'image': url.preview_image,
                    'updated_at': url.preview_updated_at
                }
            
            # Return JSON with redirect info for custom page handling in frontend
            return Response({
                'status': 'success',
                'redirect_type': 'custom',
                'destination_url': destination_url,
                'redirect_settings': {
                    'page_type': url.redirect_page_type,
                    'delay': url.redirect_delay,
                    'message': url.custom_redirect_message,
                    'title': url.title,
                    'brand_name': url.brand_name,
                    'brand_logo_url': url.brand_logo_url,
                    'session_id': session_id,
                    'short_code': short_code,
                    'full_short_url': request.build_absolute_uri(),
                    'enable_preview': url.enable_preview,
                    'preview_data': preview_data,
                    'one_time_use': url.one_time_use
                }
            })
            
        # For direct redirects, just redirect to the destination URL
        return HttpResponseRedirect(destination_url)
        
    except Exception as e:
        print(f"Error in redirect: {str(e)}")
        return Response({
            'status': 'error',
            'reason': 'general_error',
            'message': 'An error occurred while processing your request.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def generate_qr_code(request, short_code):
    """Generate a QR code for a shortened URL."""
    url = get_object_or_404(ShortenedURL, short_code=short_code)
    
    # Check if URL is active and not expired
    if not url.is_active or url.is_expired():
        from django.http import JsonResponse
        return JsonResponse({
            'error': 'Cannot generate QR code for inactive or expired URL.',
            'status': 'error'
        }, status=400)
    
    # Generate the full URL for QR code
    full_url = f"{settings.URL_SHORTENER_DOMAIN}/s/{short_code}"
    
    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(full_url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Format requested by the client
    format_param = request.GET.get('format', 'png')
    
    if format_param == 'base64':
        # Return base64 encoded image for embedding in HTML
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        encoded_img = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        from django.http import JsonResponse
        return JsonResponse({
            'qr_code': f"data:image/png;base64,{encoded_img}",
            'url': full_url
        })
    else:
        # Return the image file
        response = HttpResponse(content_type="image/png")
        img.save(response, "PNG")
        response['Content-Disposition'] = f'inline; filename="qr-{short_code}.png"'
        return response
