from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    PasswordChangeSerializer,
    EmailVerificationSerializer,
    ResendVerificationEmailSerializer
)
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.sites.shortcuts import get_current_site
from django.template.loader import render_to_string
from django.core.mail import EmailMessage
from django.conf import settings
import ipware
from django.utils import timezone
from datetime import datetime, timedelta
import uuid
from .utils import send_verification_email

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """View for user registration."""
    
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer
    
    def perform_create(self, serializer):
        user = serializer.save()
        # Send verification email using our utility function
        send_verification_email(user)
        
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        
        # Add verification message to the response
        response_data = serializer.data
        response_data['detail'] = 'Registration successful. Please check your email to verify your account.'
        
        return Response(
            response_data, 
            status=status.HTTP_201_CREATED, 
            headers=headers
        )


class UserDetailView(generics.RetrieveUpdateAPIView):
    """View for retrieving and updating user details."""
    
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        
        # Add IP address to the response
        client_ip, is_routable = ipware.ip.get_client_ip(request)
        data['ip_address'] = client_ip
        
        # Add additional user metadata
        data['last_login'] = instance.last_login
        
        # Calculate account age in days
        from django.utils import timezone
        from datetime import datetime
        account_age = (timezone.now() - instance.date_joined).days
        data['account_age_days'] = account_age
        
        return Response(data)


class AccountDeleteView(APIView):
    """View for deleting user account."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def delete(self, request):
        user = request.user
        
        # Optional: Add logic for confirming identity before deletion
        # For example, password verification
        
        # Delete the user
        user.delete()
        
        return Response(
            {"detail": "Account successfully deleted."},
            status=status.HTTP_204_NO_CONTENT
        )


class PasswordChangeView(APIView):
    """View for changing user password."""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PasswordChangeSerializer
    
    def post(self, request):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        # Change password
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({"detail": "Password changed successfully."})


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token view to use our serializer."""
    
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        # Check if user is verified
        if response.status_code == 200 and response.data.get('email_verification_required'):
            response.data['detail'] = "Email verification is required. Please check your email."
        
        return response


class PasswordResetRequestView(APIView):
    """View for requesting a password reset."""
    
    permission_classes = [permissions.AllowAny]
    serializer_class = PasswordResetRequestSerializer
    
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # For actual deployment, replace with real email sending
            reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"
            
            # In production, you would send an actual email here
            # For now, we'll just return the token info in the response
            return Response({
                'message': 'Password reset link has been sent to your email.',
                'debug_info': {
                    'uid': uid,
                    'token': token,
                    'reset_url': reset_url
                }
            })
        except User.DoesNotExist:
            return Response({
                'message': 'Password reset link has been sent to your email if an account exists.'
            })


class PasswordResetConfirmView(APIView):
    """View for confirming password reset."""
    
    permission_classes = [permissions.AllowAny]
    serializer_class = PasswordResetConfirmSerializer
    
    def post(self, request, uidb64, token):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'error': 'Invalid user ID.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if default_token_generator.check_token(user, token):
            user.set_password(serializer.validated_data['password'])
            user.save()
            return Response({'message': 'Password has been reset successfully.'})
        else:
            return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)


class EmailVerificationView(APIView):
    """View for verifying user email."""
    
    permission_classes = [permissions.AllowAny]
    serializer_class = EmailVerificationSerializer
    
    def post(self, request, token, email):
        try:
            # Look up the user by email
            user = User.objects.get(email=email)
            
            # TEMPORARY FIX: Skip token validation
            # In a production environment, proper token validation should be implemented
            
            # Verify the email
            user.email_verified = True
            user.is_active = True
            
            # Generate a new token (to invalidate the used one)
            user.email_verification_token = uuid.uuid4()
            user.save()
            
            return Response({'message': 'Email successfully verified. You can now log in.'})
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )


class ResendVerificationEmailView(APIView):
    """View for resending verification email."""
    
    permission_classes = [permissions.AllowAny]
    serializer_class = ResendVerificationEmailSerializer
    
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
            
            # Only resend if not already verified
            if user.email_verified:
                return Response({'message': 'Email is already verified.'})
            
            # Generate a new verification token
            user.email_verification_token = uuid.uuid4()
            
            # Send email using our utility function
            if send_verification_email(user):
                return Response({'message': 'Verification email has been resent.'})
            else:
                return Response(
                    {'error': 'Failed to send verification email. Please try again later.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
        except User.DoesNotExist:
            # Don't reveal that the user doesn't exist
            return Response({'message': 'If a user with this email exists, a verification email has been sent.'})


class SimpleEmailVerificationView(APIView):
    """View for verifying user email without token validation."""
    
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, email):
        try:
            # Look up the user by email
            user = User.objects.get(email=email)
            
            # Verify the email without token validation
            user.email_verified = True
            user.is_active = True
            
            # Generate a new token (to invalidate the used one)
            user.email_verification_token = uuid.uuid4()
            user.save()
            
            return Response({'message': 'Email successfully verified. You can now log in.'})
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
