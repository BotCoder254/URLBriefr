from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ShortenedURLViewSet, TagViewSet, redirect_to_original, 
    generate_qr_code, IPRestrictionViewSet, SpoofingAttemptViewSet,
    MalwareDetectionResultViewSet
)

router = DefaultRouter()
router.register(r'urls', ShortenedURLViewSet, basename='url')
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'ip-restrictions', IPRestrictionViewSet, basename='ip-restriction')
router.register(r'spoofing-attempts', SpoofingAttemptViewSet, basename='spoofing-attempt')
router.register(r'malware-detection', MalwareDetectionResultViewSet, basename='malware-detection')

# API endpoints
api_urlpatterns = [
    path('', include(router.urls)),
    path('qr/<str:short_code>/', generate_qr_code, name='qr_code_api'),
]

# Non-API endpoints
urlpatterns = [
    # Redirect endpoint
    path('s/<str:short_code>/', redirect_to_original, name='redirect'),
] 