from django.shortcuts import render, redirect, get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from .models import ShortenedURL
from .serializers import ShortenedURLSerializer, CreateShortenedURLSerializer
from analytics.models import ClickEvent
from django.http import HttpResponseRedirect, HttpResponse
from django.utils import timezone
from user_agents import parse
import ipware.ip
import qrcode
import io
from django.conf import settings
import base64

class ShortenedURLViewSet(viewsets.ModelViewSet):
    """ViewSet for shortened URLs."""
    
    serializer_class = ShortenedURLSerializer
    
    def get_queryset(self):
        """Get the queryset based on user role."""
        user = self.request.user
        
        # Admin users can see all URLs
        if user.is_superuser or (hasattr(user, 'is_admin') and user.is_admin):
            return ShortenedURL.objects.all()
        
        # Authenticated users can see their own URLs
        if user.is_authenticated:
            return ShortenedURL.objects.filter(user=user)
        
        # Guest users can't see any URLs through API
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
    
    # Create click event
    ClickEvent.objects.create(
        url=url,
        ip_address=client_ip,
        user_agent=user_agent_string,
        browser=f"{user_agent.browser.family} {user_agent.browser.version_string}",
        device=user_agent.device.family,
        os=f"{user_agent.os.family} {user_agent.os.version_string}",
        referrer=request.META.get('HTTP_REFERER', '')
    )
    
    # Increment counter
    url.increment_counter()
    
    # Redirect to original URL
    return HttpResponseRedirect(url.original_url)

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
