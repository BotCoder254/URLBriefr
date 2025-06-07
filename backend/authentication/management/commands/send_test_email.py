from django.core.management.base import BaseCommand
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.conf import settings
from authentication.utils import use_gmail_backend, use_console_backend
import traceback

class Command(BaseCommand):
    help = "Send a test email to verify email configuration"

    def add_arguments(self, parser):
        parser.add_argument(
            "--email",
            type=str,
            help="Recipient email address",
        )
        parser.add_argument(
            "--backend",
            type=str,
            choices=['gmail', 'console'],
            default='console',
            help='Email backend to use (gmail or console)',
        )

    def handle(self, *args, **options):
        recipient_email = options.get("email") or "telvivaztelvin@gmail.com"
        backend = options.get("backend", "console")
        
        # Switch to the selected backend
        if backend == "gmail":
            use_gmail_backend()
            self.stdout.write(self.style.SUCCESS("Using Gmail SMTP backend"))
        else:
            use_console_backend()
            self.stdout.write(self.style.SUCCESS("Using console backend"))

        self.stdout.write(self.style.SUCCESS(f"Sending test email to {recipient_email}"))

        try:
            # Prepare email context
            context = {
                "first_name": "Test User",
                "verification_url": f"{settings.FRONTEND_URL}/verify-email/test-token/test-email/",
                "expiration_days": settings.EMAIL_VERIFICATION_TIMEOUT_DAYS,
                "user": {"first_name": "Test User"},
            }
            
            # Render email template
            email_html = render_to_string("authentication/email_verification.html", context)
            
            # Create email message
            email = EmailMessage(
                subject="URLBriefr - Test Email",
                body=email_html,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[recipient_email],
            )
            email.content_subtype = "html"
            
            # Send email
            email.send(fail_silently=False)
            
            self.stdout.write(self.style.SUCCESS(f"Test email sent successfully to {recipient_email}"))
            
            # Print email settings for debugging
            self.stdout.write("\nEmail configuration:")
            self.stdout.write(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
            self.stdout.write(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
            if hasattr(settings, "ANYMAIL"):
                self.stdout.write(f"MAILGUN_SENDER_DOMAIN: {settings.ANYMAIL.get('MAILGUN_SENDER_DOMAIN')}")
                
                # Do not print the actual API key for security, just whether it is set
                api_key = settings.ANYMAIL.get("MAILGUN_API_KEY")
                self.stdout.write(f"MAILGUN_API_KEY: {'Set' if api_key else 'Not set'}")
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to send email: {str(e)}"))
            # Print more detailed error for debugging
            self.stdout.write(self.style.ERROR(traceback.format_exc())) 