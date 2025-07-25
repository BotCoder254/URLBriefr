from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.utils import timezone
from tempmail.models import TempEmailSession
import uuid


class Command(BaseCommand):
    help = 'Test email delivery to temporary email addresses'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Temporary email address to test (if not provided, creates a new one)',
        )
    
    def handle(self, *args, **options):
        email_address = options.get('email')
        
        # Create a test session if no email provided
        if not email_address:
            session = TempEmailSession.generate_email(
                ip_address='127.0.0.1',
                duration_minutes=30
            )
            email_address = session.email_address
            self.stdout.write(f'Created test session: {email_address}')
        else:
            # Check if session exists
            session = TempEmailSession.objects.filter(
                email_address=email_address,
                is_active=True,
                expires_at__gt=timezone.now()
            ).first()
            
            if not session:
                self.stdout.write(
                    self.style.ERROR(f'No active session found for {email_address}')
                )
                return
        
        # Send test email
        subject = 'Test Email from Django'
        message = f'''
        This is a test email sent to your temporary email address.
        
        Session Details:
        - Email: {session.email_address}
        - Created: {session.created_at}
        - Expires: {session.expires_at}
        - Token: {session.session_token}
        
        If you can see this message in your tempmail inbox, the email delivery is working correctly!
        '''
        
        html_message = f'''
        <html>
        <body>
            <h2>Test Email from Django</h2>
            <p>This is a test email sent to your temporary email address.</p>
            
            <h3>Session Details:</h3>
            <ul>
                <li><strong>Email:</strong> {session.email_address}</li>
                <li><strong>Created:</strong> {session.created_at}</li>
                <li><strong>Expires:</strong> {session.expires_at}</li>
                <li><strong>Token:</strong> {session.session_token}</li>
            </ul>
            
            <p>If you can see this message in your tempmail inbox, the email delivery is working correctly!</p>
        </body>
        </html>
        '''
        
        try:
            # Test both internal and external email simulation
            send_mail(
                subject=subject,
                message=message,
                from_email='test@urlbriefr.com',
                recipient_list=[email_address],
                html_message=html_message,
                fail_silently=False
            )
            
            # Also test external email simulation via webhook
            import requests
            webhook_data = {
                'to': email_address,
                'from': 'external@gmail.com',
                'subject': 'External Test Email',
                'text': 'This is a test email from an external service.',
                'html': '<p>This is a <strong>test email</strong> from an external service.</p>',
                'message_id': f'external_test_{session.session_token}',
                'headers': {'Content-Type': 'text/html'}
            }
            
            try:
                response = requests.post(
                    'http://localhost:8000/api/tempmail/receive/',
                    json=webhook_data,
                    timeout=5
                )
                if response.status_code == 200:
                    self.stdout.write('✅ External email simulation successful')
                else:
                    self.stdout.write(f'⚠️  External email simulation failed: {response.status_code}')
            except requests.exceptions.RequestException:
                self.stdout.write('⚠️  Could not test external email (Django server not running?)')
            
            self.stdout.write(
                self.style.SUCCESS(f'✅ Test email sent successfully to {email_address}')
            )
            self.stdout.write(f'Session token: {session.session_token}')
            self.stdout.write(f'Check the tempmail inbox at: http://localhost:3000/tempmail')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Failed to send test email: {str(e)}')
            )