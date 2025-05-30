from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ShortenedURLViewSet, redirect_to_original, generate_qr_code

router = DefaultRouter()
router.register(r'urls', ShortenedURLViewSet, basename='url')

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