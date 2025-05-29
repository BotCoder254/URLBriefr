from django.shortcuts import render, redirect, get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from .models import ShortenedURL
from .serializers import ShortenedURLSerializer, CreateShortenedURLSerializer
from analytics.models import ClickEvent
from django.http import HttpResponseRedirect
from django.utils import timezone
from user_agents import parse
import ipware.ip

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
        return Response({'error': 'This URL has expired or is not active.'}, status=status.HTTP_404_NOT_FOUND)
    
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
