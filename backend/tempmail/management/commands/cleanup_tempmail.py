from django.core.management.base import BaseCommand
from django.utils import timezone
from tempmail.models import TempEmailSession, TempEmailMessage


class Command(BaseCommand):
    help = 'Clean up expired temporary email sessions and messages'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )
    
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No data will be deleted'))
        
        # Count expired items
        expired_sessions = TempEmailSession.objects.filter(expires_at__lt=timezone.now())
        expired_messages = TempEmailMessage.objects.filter(expires_at__lt=timezone.now())
        
        session_count = expired_sessions.count()
        message_count = expired_messages.count()
        
        self.stdout.write(f'Found {session_count} expired sessions')
        self.stdout.write(f'Found {message_count} expired messages')
        
        if not dry_run:
            # Perform cleanup
            deleted_sessions = TempEmailSession.cleanup_expired()
            deleted_messages = TempEmailMessage.cleanup_expired()
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully deleted {deleted_sessions} sessions and {deleted_messages} messages')
            )
        else:
            self.stdout.write(self.style.WARNING('DRY RUN - No data was deleted'))