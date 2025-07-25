from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TempEmailViewSet, TempEmailMessageViewSet,
    download_attachment, receive_email, cleanup_expired, create_tempmail_for_registration, test_webhook
)

router = DefaultRouter()
router.register(r'sessions', TempEmailViewSet, basename='tempmail-session')
router.register(r'messages', TempEmailMessageViewSet, basename='tempmail-message')

urlpatterns = [
    path('', include(router.urls)),
    path('attachments/<int:attachment_id>/download/', download_attachment, name='download-attachment'),
    path('receive/', receive_email, name='receive-email'),
    path('cleanup/', cleanup_expired, name='cleanup-expired'),
    path('create-for-registration/', create_tempmail_for_registration, name='create-for-registration'),
    path('test-webhook/', test_webhook, name='test-webhook'),
]