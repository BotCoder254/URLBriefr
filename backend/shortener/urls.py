from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ShortenedURLViewSet, redirect_to_original

router = DefaultRouter()
router.register(r'urls', ShortenedURLViewSet, basename='url')

urlpatterns = [
    # API endpoints
    path('', include(router.urls)),
    
    # Redirect endpoint
    path('s/<str:short_code>/', redirect_to_original, name='redirect'),
] 