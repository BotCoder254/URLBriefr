from django.shortcuts import render, redirect, get_object_or_404
from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django_filters.rest_framework import DjangoFilterBackend
from .models import ShortenedURL, Tag, ABTestVariant
from .serializers import ShortenedURLSerializer, CreateShortenedURLSerializer, TagSerializer, ABTestVariantSerializer
from analytics.models import ClickEvent
from django.http import HttpResponseRedirect, HttpResponse
from django.utils import timezone
from user_agents import parse
import ipware.ip
import qrcode
import io
from django.conf import settings
import base64
import requests
import random
from django.db.models import Count, Q

# Constants for user limits
MAX_FOLDERS_PER_USER = 5
MAX_TAGS_PER_USER = 10


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


class ShortenedURLViewSet(viewsets.ModelViewSet):
    """ViewSet for shortened URLs."""
    
    serializer_class = ShortenedURLSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'is_ab_test', 'folder']
    search_fields = ['short_code', 'original_url', 'title']
    ordering_fields = ['created_at', 'access_count', 'last_accessed']
    ordering = ['-created_at']
    
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
        return ShortenedURLSerializer
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get statistics for all user's URLs."""
        user = request.user
        if not user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        
        urls = ShortenedURL.objects.filter(user=user)
        total_clicks = sum(url.access_count for url in urls)
        
        return Response({
            'total_urls': urls.count(),
            'total_clicks': total_clicks,
            'active_urls': urls.filter(is_active=True).count(),
        })
    
    @action(detail=False, methods=['get'])
    def folders(self, request):
        """Get all folders used by the user."""
        user = request.user
        if not user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        
        # Get all folders for this user - ensure we get non-empty folders
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
    """Redirect to the original URL from a shortened URL."""
    url = get_object_or_404(ShortenedURL, short_code=short_code)
    
    # Check if URL is active and not expired
    if not url.is_active or url.is_expired():
        error_reason = 'expired' if url.is_expired() else 'inactive'
        expiry_date = url.expires_at.isoformat() if url.expires_at else None
        
        # Get the owner's email if available
        owner_email = url.user.email if url.user else None
        
        return Response({
            'error': 'This URL has expired or is not active.',
            'status': 'error',
            'reason': error_reason,
            'url_info': {
                'short_code': url.short_code,
                'title': url.title,
                'created_at': url.created_at.isoformat(),
                'expires_at': expiry_date,
                'is_active': url.is_active,
                'is_expired': url.is_expired(),
                'owner': owner_email
            }
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Record analytics
    client_ip, is_routable = ipware.ip.get_client_ip(request)
    
    # Parse user agent
    user_agent_string = request.META.get('HTTP_USER_AGENT', '')
    user_agent = parse(user_agent_string)
    
    # Get geolocation data from IP
    country = None
    city = None
    
    try:
        # Use a free IP geolocation API
        geo_response = requests.get(f'https://ipapi.co/{client_ip}/json/')
        if geo_response.status_code == 200:
            geo_data = geo_response.json()
            country = geo_data.get('country_name')
            city = geo_data.get('city')
    except Exception as e:
        # If geolocation fails, just continue without location data
        print(f"Geolocation error: {e}")
    
    # Create click event
    click_event = ClickEvent.objects.create(
        url=url,
        ip_address=client_ip,
        user_agent=user_agent_string,
        browser=f"{user_agent.browser.family} {user_agent.browser.version_string}",
        device=user_agent.device.family,
        os=f"{user_agent.os.family} {user_agent.os.version_string}",
        referrer=request.META.get('HTTP_REFERER', ''),
        country=country,
        city=city
    )
    
    # Increment counter for the main URL
    url.increment_counter()
    
    # Handle A/B testing if enabled
    destination_url = url.original_url
    if url.is_ab_test:
        # Get all variants
        variants = url.variants.all()
        
        if variants:
            # Select a variant based on weight
            weights = [variant.weight for variant in variants]
            
            # Select a variant based on weights
            selected_variant = random.choices(variants, weights=weights, k=1)[0]
            
            # Update the destination URL
            destination_url = selected_variant.destination_url
            
            # Increment counter for the selected variant
            selected_variant.increment_counter()
    
    # Redirect to the destination URL
    return HttpResponseRedirect(destination_url)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def generate_qr_code(request, short_code):
    """Generate a QR code for a shortened URL."""
    url = get_object_or_404(ShortenedURL, short_code=short_code)
    
    # Check if URL is active and not expired
    if not url.is_active or url.is_expired():
        return Response({
            'error': 'Cannot generate QR code for inactive or expired URL.',
            'status': 'error'
        }, status=status.HTTP_400_BAD_REQUEST)
    
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
    format_param = request.query_params.get('format', 'png')
    
    if format_param == 'base64':
        # Return base64 encoded image for embedding in HTML
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        encoded_img = base64.b64encode(buffer.getvalue()).decode('utf-8')
        return Response({
            'qr_code': f"data:image/png;base64,{encoded_img}",
            'url': full_url
        })
    else:
        # Return the image file
        response = HttpResponse(content_type="image/png")
        img.save(response, "PNG")
        response['Content-Disposition'] = f'inline; filename="qr-{short_code}.png"'
        return response
