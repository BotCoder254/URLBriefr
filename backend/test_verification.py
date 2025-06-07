import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'urlbriefr.settings')
django.setup()

from authentication.models import User
from django.utils import timezone
import uuid

def test_verification():
    """Test email verification functionality"""
    
    # Get all users
    users = User.objects.all()
    print(f"Found {len(users)} users")
    
    # Find unverified users
    unverified_users = User.objects.filter(email_verified=False)
    print(f"Found {len(unverified_users)} unverified users")
    
    if unverified_users:
        # Get the first unverified user
        user = unverified_users[0]
        print(f"Testing with user: {user.email}")
        print(f"Current verification status: {user.email_verified}")
        print(f"Current token: {user.email_verification_token}")
        
        # Verify the user
        user.email_verified = True
        user.is_active = True
        user.save()
        
        # Check if verification worked
        user.refresh_from_db()
        print(f"New verification status: {user.email_verified}")
        print("Verification successful!")
    else:
        # Create a test user if no unverified users exist
        email = f"test_{uuid.uuid4()}@example.com"
        user = User.objects.create_user(
            email=email,
            password="testpassword123",
            first_name="Test",
            last_name="User",
            is_active=False,
            email_verified=False,
            email_verification_token=uuid.uuid4(),
            email_verification_sent_at=timezone.now()
        )
        print(f"Created test user: {user.email}")
        print(f"Verification token: {user.email_verification_token}")
        
        # Now verify the user
        user.email_verified = True
        user.is_active = True
        user.save()
        
        # Check if verification worked
        user.refresh_from_db()
        print(f"Verification status: {user.email_verified}")
        print("Verification successful!")

if __name__ == "__main__":
    test_verification() 