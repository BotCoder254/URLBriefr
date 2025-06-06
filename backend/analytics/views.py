from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django.db.models import Count, F, Sum, Case, When, IntegerField, Value, DateTimeField, ExpressionWrapper, DurationField, Q
from django.db.models.functions import TruncDate, TruncHour, ExtractHour, Coalesce, Now
from shortener.models import ShortenedURL
from .models import ClickEvent, UserSession
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
        
        # Get retention metrics (new)
        sessions = UserSession.objects.filter(url=url)
        
        # Calculate retention rates for different time periods
        total_sessions = sessions.count()
        
        # 1-day retention
        one_day_ago = timezone.now() - timedelta(days=1)
        one_day_retention = sessions.filter(
            first_visit__lt=one_day_ago,
            last_visit__gte=one_day_ago
        ).count()
        
        # 7-day retention
        seven_days_ago = timezone.now() - timedelta(days=7)
        seven_day_retention = sessions.filter(
            first_visit__lt=seven_days_ago,
            last_visit__gte=seven_days_ago
        ).count()
        
        # 30-day retention
        thirty_days_ago = timezone.now() - timedelta(days=30)
        thirty_day_retention = sessions.filter(
            first_visit__lt=thirty_days_ago,
            last_visit__gte=thirty_days_ago
        ).count()
        
        # Return visit distribution
        return_visit_distribution = sessions.filter(
            visit_count__gt=1
        ).values('visit_count').annotate(
            session_count=Count('id')
        ).order_by('visit_count')[:10]
        
        # Time between visits (for sessions with > 1 visit)
        avg_return_time_hours = 0
        if sessions.filter(visit_count__gt=1).exists():
            # Calculate average time between first and last visit for sessions with multiple visits
            multi_visit_sessions = sessions.filter(visit_count__gt=1)
            total_hours = sum(
                (session.last_visit - session.first_visit).total_seconds() / 3600
                for session in multi_visit_sessions
            )
            avg_return_time_hours = total_hours / multi_visit_sessions.count()
        
        # Get funnel metrics (new)
        funnel_stages = {
            'total_clicks': total_clicks,
            'reached_destination': sessions.filter(reached_destination=True).count(),
            'completed_action': sessions.filter(completed_action=True).count()
        }
        
        # Calculate drop-off rates
        funnel_drop_offs = {
            'click_to_destination': (
                (funnel_stages['total_clicks'] - funnel_stages['reached_destination']) / 
                funnel_stages['total_clicks'] * 100
            ) if funnel_stages['total_clicks'] > 0 else 0,
            'destination_to_action': (
                (funnel_stages['reached_destination'] - funnel_stages['completed_action']) / 
                funnel_stages['reached_destination'] * 100
            ) if funnel_stages['reached_destination'] > 0 else 0,
            'overall_drop_off': (
                (funnel_stages['total_clicks'] - funnel_stages['completed_action']) / 
                funnel_stages['total_clicks'] * 100
            ) if funnel_stages['total_clicks'] > 0 else 0
        }
        
        # Format percentages to have 2 decimal places
        funnel_drop_offs = {k: round(v, 2) for k, v in funnel_drop_offs.items()}
        
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
            'recent_clicks': recent_clicks,
            # Retention metrics (new)
            'retention': {
                'total_sessions': total_sessions,
                'one_day_retention': one_day_retention,
                'one_day_retention_rate': round(one_day_retention / total_sessions * 100, 2) if total_sessions > 0 else 0,
                'seven_day_retention': seven_day_retention,
                'seven_day_retention_rate': round(seven_day_retention / total_sessions * 100, 2) if total_sessions > 0 else 0,
                'thirty_day_retention': thirty_day_retention,
                'thirty_day_retention_rate': round(thirty_day_retention / total_sessions * 100, 2) if total_sessions > 0 else 0,
                'return_visit_distribution': return_visit_distribution,
                'avg_return_time_hours': round(avg_return_time_hours, 2)
            },
            # Funnel metrics (new)
            'funnel': {
                'stages': funnel_stages,
                'drop_offs': funnel_drop_offs
            }
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
        
        # Get retention metrics across all URLs
        sessions = UserSession.objects.filter(url__in=urls)
        
        # Overall retention stats
        total_sessions = sessions.count()
        returning_sessions = sessions.filter(visit_count__gt=1).count()
        returning_rate = round(returning_sessions / total_sessions * 100, 2) if total_sessions > 0 else 0
        
        # Get funnel metrics across all URLs
        total_clicks = ClickEvent.objects.filter(url__in=urls).count()
        reached_destination = sessions.filter(reached_destination=True).count()
        completed_action = sessions.filter(completed_action=True).count()
        
        # Calculate overall conversion rate
        conversion_rate = round(completed_action / total_clicks * 100, 2) if total_clicks > 0 else 0
        
        return Response({
            'total_urls': total_urls,
            'active_urls': active_urls,
            'expired_urls': expired_urls,
            'total_clicks': total_clicks,
            'clicks_last_24h': clicks_last_24h,
            'top_urls': top_urls_data,
            'clicks_by_date': clicks_by_date,
            'clicks_by_hour': clicks_by_hour,
            'clicks_by_device': clicks_by_device,
            'clicks_by_browser': clicks_by_browser,
            'clicks_by_os': clicks_by_os,
            'clicks_by_country': clicks_by_country,
            'clicks_by_city': clicks_by_city,
            # New retention and funnel metrics
            'retention': {
                'total_sessions': total_sessions,
                'returning_sessions': returning_sessions,
                'returning_rate': returning_rate
            },
            'funnel': {
                'total_clicks': total_clicks,
                'reached_destination': reached_destination,
                'completed_action': completed_action,
                'conversion_rate': conversion_rate
            }
        })
        
    @action(detail=True, methods=['get'])
    def retention(self, request, pk=None):
        """Get detailed retention metrics for a specific URL."""
        user = request.user
        url = get_object_or_404(ShortenedURL, pk=pk)
        
        # Ensure user owns the URL or is an admin
        if url.user != user and not (user.is_superuser or (hasattr(user, 'is_admin') and user.is_admin)):
            return Response(status=status.HTTP_403_FORBIDDEN)
        
        sessions = UserSession.objects.filter(url=url)
        total_sessions = sessions.count()
        
        # Return visit counts
        return_visit_counts = {
            '1_visit': sessions.filter(visit_count=1).count(),
            '2_visits': sessions.filter(visit_count=2).count(),
            '3_5_visits': sessions.filter(visit_count__gte=3, visit_count__lte=5).count(),
            '6_10_visits': sessions.filter(visit_count__gte=6, visit_count__lte=10).count(),
            'more_than_10': sessions.filter(visit_count__gt=10).count(),
        }
        
        # Time periods for retention
        periods = [
            {'name': '1_day', 'days': 1},
            {'name': '7_days', 'days': 7},
            {'name': '30_days', 'days': 30},
            {'name': '90_days', 'days': 90}
        ]
        
        retention_by_period = {}
        
        for period in periods:
            cutoff_date = timezone.now() - timedelta(days=period['days'])
            retained_sessions = sessions.filter(
                first_visit__lt=cutoff_date,
                last_visit__gte=cutoff_date
            ).count()
            
            retention_rate = round(retained_sessions / total_sessions * 100, 2) if total_sessions > 0 else 0
            
            retention_by_period[period['name']] = {
                'sessions': retained_sessions,
                'rate': retention_rate
            }
        
        # Time between first and last visit for returning visitors
        returning_sessions = sessions.filter(visit_count__gt=1)
        
        avg_return_time = None
        if returning_sessions.exists():
            # Calculate the average time between first and last visit
            total_seconds = sum(
                (session.last_visit - session.first_visit).total_seconds()
                for session in returning_sessions
            )
            avg_seconds = total_seconds / returning_sessions.count()
            
            # Convert to hours for better readability
            avg_return_time = round(avg_seconds / 3600, 2)
        
        return Response({
            'url': ShortenedURLSerializer(url).data,
            'total_sessions': total_sessions,
            'returning_sessions': sessions.filter(visit_count__gt=1).count(),
            'return_visit_counts': return_visit_counts,
            'retention_by_period': retention_by_period,
            'avg_return_time_hours': avg_return_time
        })
    
    @action(detail=True, methods=['get'])
    def funnel(self, request, pk=None):
        """Get detailed funnel analysis for a specific URL."""
        user = request.user
        url = get_object_or_404(ShortenedURL, pk=pk)
        
        # Ensure user owns the URL or is an admin
        if url.user != user and not (user.is_superuser or (hasattr(user, 'is_admin') and user.is_admin)):
            return Response(status=status.HTTP_403_FORBIDDEN)
        
        # Total clicks
        total_clicks = url.access_count
        
        # Session data for funnel analysis
        sessions = UserSession.objects.filter(url=url)
        
        # Funnel stages
        reached_destination = sessions.filter(reached_destination=True).count()
        completed_action = sessions.filter(completed_action=True).count()
        
        # Calculate conversion rates
        destination_rate = round(reached_destination / total_clicks * 100, 2) if total_clicks > 0 else 0
        action_rate = round(completed_action / reached_destination * 100, 2) if reached_destination > 0 else 0
        overall_rate = round(completed_action / total_clicks * 100, 2) if total_clicks > 0 else 0
        
        # Calculate drop-off rates
        click_to_destination_drop = round(100 - destination_rate, 2)
        destination_to_action_drop = round(100 - action_rate, 2)
        overall_drop = round(100 - overall_rate, 2)
        
        # Daily funnel metrics for the last 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        # Get daily clicks
        daily_clicks = ClickEvent.objects.filter(
            url=url, 
            timestamp__gte=thirty_days_ago
        ).annotate(
            date=TruncDate('timestamp')
        ).values('date').annotate(
            count=Count('id')
        ).order_by('date')
        
        # Format for the response
        daily_funnel = []
        
        for day_data in daily_clicks:
            date = day_data['date']
            
            # Get destination and action counts for this day
            day_destinations = sessions.filter(
                reached_destination=True,
                last_visit__date=date
            ).count()
            
            day_actions = sessions.filter(
                completed_action=True,
                last_visit__date=date
            ).count()
            
            daily_funnel.append({
                'date': date.strftime('%Y-%m-%d'),
                'clicks': day_data['count'],
                'reached_destination': day_destinations,
                'completed_action': day_actions
            })
        
        return Response({
            'url': ShortenedURLSerializer(url).data,
            'total_clicks': total_clicks,
            'funnel_stages': {
                'clicked': total_clicks,
                'reached_destination': reached_destination,
                'completed_action': completed_action
            },
            'conversion_rates': {
                'click_to_destination': destination_rate,
                'destination_to_action': action_rate,
                'overall': overall_rate
            },
            'drop_off_rates': {
                'click_to_destination': click_to_destination_drop,
                'destination_to_action': destination_to_action_drop,
                'overall': overall_drop
            },
            'daily_funnel': daily_funnel
        })

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def track_funnel(self, request):
        """Track funnel steps for analytics."""
        short_code = request.data.get('short_code')
        session_id = request.data.get('session_id')
        step = request.data.get('step')
        
        if not short_code or not session_id or not step:
            return Response(
                {"error": "Missing required parameters: short_code, session_id, or step"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate the step
        if step not in ['reached_destination', 'completed_action']:
            return Response(
                {"error": f"Invalid step: {step}. Must be 'reached_destination' or 'completed_action'."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get the URL
            url = ShortenedURL.objects.get(short_code=short_code)
            
            # Find the session
            session = UserSession.objects.filter(url=url, session_id=session_id).first()
            
            if not session:
                # If session doesn't exist, create a new one
                session = UserSession.objects.create(
                    url=url,
                    session_id=session_id
                )
            
            # Update the appropriate step
            if step == 'reached_destination':
                session.reached_destination = True
                session.save(update_fields=['reached_destination'])
            elif step == 'completed_action':
                session.completed_action = True
                session.save(update_fields=['completed_action'])
            
            return Response({"success": True}, status=status.HTTP_200_OK)
            
        except ShortenedURL.DoesNotExist:
            return Response(
                {"error": f"URL with short code '{short_code}' not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
