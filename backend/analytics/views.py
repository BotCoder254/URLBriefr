from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Count, F, Sum, Case, When, IntegerField, Value
from django.db.models.functions import TruncDate, TruncHour, ExtractHour, Coalesce
from shortener.models import ShortenedURL
from .models import ClickEvent
from shortener.serializers import ShortenedURLSerializer
from django.utils import timezone
from datetime import timedelta

class AnalyticsViewSet(viewsets.ViewSet):
    """ViewSet for URL analytics."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def retrieve(self, request, pk=None):
        """Get analytics for a specific URL."""
        user = request.user
        url = get_object_or_404(ShortenedURL, pk=pk)
        
        # Ensure user owns the URL or is an admin
        if url.user != user and not (user.is_superuser or (hasattr(user, 'is_admin') and user.is_admin)):
            return Response(status=status.HTTP_403_FORBIDDEN)
        
        # Basic stats
        total_clicks = url.access_count
        
        # Get all click events
        clicks = ClickEvent.objects.filter(url=url)
        
        # Get clicks by date (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        clicks_by_date = clicks.filter(timestamp__gte=thirty_days_ago) \
                              .annotate(date=TruncDate('timestamp')) \
                              .values('date') \
                              .annotate(count=Count('id')) \
                              .order_by('date')
        
        # Get clicks by hour (for time distribution)
        clicks_by_hour = clicks.annotate(hour=ExtractHour('timestamp')) \
                              .values('hour') \
                              .annotate(count=Count('id')) \
                              .order_by('hour')
        
        # Get clicks by browser
        clicks_by_browser = clicks.values('browser') \
                                 .annotate(count=Count('id')) \
                                 .order_by('-count')
        
        # Get clicks by device
        clicks_by_device = clicks.values('device') \
                                .annotate(count=Count('id')) \
                                .order_by('-count')
        
        # Get clicks by country - handle NULL values with Coalesce
        clicks_by_country = clicks.annotate(
                                country_name=Coalesce('country', Value('Unknown'))
                            ) \
                            .values('country_name') \
                            .annotate(count=Count('id')) \
                            .order_by('-count')
        
        # Format the results to match expected structure
        clicks_by_country = [{'country': item['country_name'], 'count': item['count']} 
                             for item in clicks_by_country]
        
        # Get clicks by city - handle NULL values for both city and country
        clicks_by_city = clicks.annotate(
                              city_name=Coalesce('city', Value('Unknown')),
                              country_name=Coalesce('country', Value('Unknown'))
                          ) \
                          .values('city_name', 'country_name') \
                          .annotate(count=Count('id')) \
                          .order_by('-count')[:15]
        
        # Format the results to match expected structure
        clicks_by_city = [{'city': item['city_name'], 'country': item['country_name'], 'count': item['count']} 
                          for item in clicks_by_city]
        
        # Get clicks by OS
        clicks_by_os = clicks.values('os') \
                            .annotate(count=Count('id')) \
                            .order_by('-count')
        
        # Get referrers
        clicks_by_referrer = clicks.exclude(referrer__isnull=True).exclude(referrer='') \
                                  .values('referrer') \
                                  .annotate(count=Count('id')) \
                                  .order_by('-count')[:10]
        
        # Get recent clicks with more details
        recent_clicks = clicks.order_by('-timestamp')[:20].values(
            'timestamp', 'browser', 'device', 'os', 'country', 'city', 'ip_address', 'referrer'
        )
        
        # Get unique IP addresses
        unique_ips = clicks.values('ip_address').distinct().count()
        
        return Response({
            'url': ShortenedURLSerializer(url).data,
            'total_clicks': total_clicks,
            'unique_visitors': unique_ips,
            'clicks_by_date': clicks_by_date,
            'clicks_by_hour': clicks_by_hour,
            'clicks_by_browser': clicks_by_browser,
            'clicks_by_device': clicks_by_device,
            'clicks_by_country': clicks_by_country,
            'clicks_by_city': clicks_by_city,
            'clicks_by_os': clicks_by_os,
            'clicks_by_referrer': clicks_by_referrer,
            'recent_clicks': recent_clicks
        })
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get dashboard analytics for all user's URLs."""
        user = request.user
        
        # Get user's URLs
        if user.is_superuser or (hasattr(user, 'is_admin') and user.is_admin):
            urls = ShortenedURL.objects.all()
        else:
            urls = ShortenedURL.objects.filter(user=user)
        
        # Get total stats
        total_urls = urls.count()
        active_urls = urls.filter(is_active=True).count()
        expired_urls = urls.filter(is_active=True).filter(expires_at__lt=timezone.now()).count()
        total_clicks = sum(url.access_count for url in urls)
        
        # Get clicks in last 24 hours
        day_ago = timezone.now() - timedelta(days=1)
        clicks_last_24h = ClickEvent.objects.filter(url__in=urls, timestamp__gte=day_ago).count()
        
        # Get top URLs
        top_urls = urls.order_by('-access_count')[:10]
        top_urls_data = ShortenedURLSerializer(top_urls, many=True).data
        
        # Get clicks over time (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        clicks_by_date = ClickEvent.objects.filter(url__in=urls, timestamp__gte=thirty_days_ago) \
                                         .annotate(date=TruncDate('timestamp')) \
                                         .values('date') \
                                         .annotate(count=Count('id')) \
                                         .order_by('date')
        
        # Get clicks by hour (time distribution)
        clicks_by_hour = ClickEvent.objects.filter(url__in=urls) \
                                        .annotate(hour=ExtractHour('timestamp')) \
                                        .values('hour') \
                                        .annotate(count=Count('id')) \
                                        .order_by('hour')
        
        # Get clicks by device
        clicks_by_device = ClickEvent.objects.filter(url__in=urls) \
                                           .values('device') \
                                           .annotate(count=Count('id')) \
                                           .order_by('-count')[:5]
        
        # Get clicks by browser
        clicks_by_browser = ClickEvent.objects.filter(url__in=urls) \
                                            .values('browser') \
                                            .annotate(count=Count('id')) \
                                            .order_by('-count')[:5]
        
        # Get clicks by OS
        clicks_by_os = ClickEvent.objects.filter(url__in=urls) \
                                       .values('os') \
                                       .annotate(count=Count('id')) \
                                       .order_by('-count')[:5]
        
        # Get clicks by country - handle NULL or empty values properly
        clicks_by_country = ClickEvent.objects.filter(url__in=urls) \
                                            .annotate(
                                                country_name=Coalesce('country', Value('Unknown'))
                                            ) \
                                            .values('country_name') \
                                            .annotate(count=Count('id')) \
                                            .order_by('-count')[:10]
        
        # Format the results to match expected structure
        clicks_by_country = [{'country': item['country_name'], 'count': item['count']} 
                            for item in clicks_by_country]
        
        # Get clicks by city - handle NULL or empty values for both city and country
        clicks_by_city = ClickEvent.objects.filter(url__in=urls) \
                                        .annotate(
                                            city_name=Coalesce('city', Value('Unknown')),
                                            country_name=Coalesce('country', Value('Unknown'))
                                        ) \
                                        .values('city_name', 'country_name') \
                                        .annotate(count=Count('id')) \
                                        .order_by('-count')[:15]
        
        # Format the results to match expected structure
        clicks_by_city = [{'city': item['city_name'], 'country': item['country_name'], 'count': item['count']} 
                         for item in clicks_by_city]
        
        # Get unique IP addresses
        unique_ips = ClickEvent.objects.filter(url__in=urls).values('ip_address').distinct().count()
        
        # Get recently created URLs
        recent_urls = urls.order_by('-created_at')[:5]
        recent_urls_data = ShortenedURLSerializer(recent_urls, many=True).data
        
        # Get recently clicked URLs with more details
        recent_clicks = ClickEvent.objects.filter(url__in=urls) \
                                        .order_by('-timestamp')[:15] \
                                        .values('timestamp', 'browser', 'device', 'os', 'country', 'city', 'ip_address', 'url__short_code')
        
        return Response({
            'total_urls': total_urls,
            'active_urls': active_urls,
            'expired_urls': expired_urls,
            'total_clicks': total_clicks,
            'unique_visitors': unique_ips,
            'clicks_last_24h': clicks_last_24h,
            'top_urls': top_urls_data,
            'recent_urls': recent_urls_data,
            'clicks_by_date': clicks_by_date,
            'clicks_by_hour': clicks_by_hour,
            'clicks_by_device': clicks_by_device,
            'clicks_by_browser': clicks_by_browser,
            'clicks_by_os': clicks_by_os,
            'clicks_by_country': clicks_by_country,
            'clicks_by_city': clicks_by_city,
            'recent_clicks': recent_clicks
        })
