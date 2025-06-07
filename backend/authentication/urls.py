from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    UserDetailView,
    CustomTokenObtainPairView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    AccountDeleteView,
    PasswordChangeView,
    EmailVerificationView,
    ResendVerificationEmailView
)

urlpatterns = [
    # Authentication endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserDetailView.as_view(), name='user-detail'),
    
    # Password and account management
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset/<str:uidb64>/<str:token>/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('password-change/', PasswordChangeView.as_view(), name='password-change'),
    path('account/delete/', AccountDeleteView.as_view(), name='account-delete'),
    
    # Email verification
    path('verify-email/<str:token>/<str:email>/', EmailVerificationView.as_view(), name='email-verification'),
    path('resend-verification-email/', ResendVerificationEmailView.as_view(), name='resend-verification-email'),
] 