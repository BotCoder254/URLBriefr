from django.core.management.base import BaseCommand
from shortener.models import ShortenedURL
from django.utils import timezone

class Command(BaseCommand):
    help = 'Deactivate all expired URLs'

    def handle(self, *args, **options):
        count = ShortenedURL.deactivate_expired_urls()
        
        if count > 0:
            self.stdout.write(
                self.style.SUCCESS(f'Successfully deactivated {count} expired URLs')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('No expired URLs found')
            ) 