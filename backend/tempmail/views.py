from django.shortcuts import get_object_or_404
from django.http import HttpResponse, Http404
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django.utils import timezone
from ipware import get_client_ip
from .models import TempEmailSession, TempEmailMessage, TempEmailAttachment, EmailBlacklist
from .serializers import (
    TempEmailSessionSerializer, TempEmailMessageSerializer,
    TempEmailAttachmentSerializer, CreateTempEmailSessionSerializer
)
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)


class TempEmailViewSet(viewsets.ViewSet):
    """ViewSet for temporary email functionality."""
    
    permission_classes = [permissions.AllowAny]
    
    def create(self, request):
        """Create a new temporary email session."""
        # Rate limiting by IP
        client_ip, _ = get_client_ip(request)
        cache_key = f"tempmail_create_{client_ip}"
        
        if cache.get(cache_key):
            return Response({
                'error': 'Rate limit exceeded. Please wait before creating another email.'
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        # Set rate limit (1 email per minute per IP)
        cache.set(cache_key, True, 60)
        
        serializer = CreateTempEmailSessionSerializer(
            data=request.data,
            context={'ip_address': client_ip}
        )
        
        if serializer.is_valid():
            session = serializer.save()
            response_serializer = TempEmailSessionSerializer(session)
            
            logger.info(f"Created temp email session: {session.email_address} from IP {client_ip}")
            
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def retrieve(self, request, pk=None):
        """Get a temporary email session by token."""
        try:
            session = get_object_or_404(TempEmailSession, session_token=pk, is_active=True)
            
            # Check if session is expired
            if session.is_expired():
                session.is_active = False
                session.save()
                return Response({
                    'error': 'Session has expired'
                }, status=status.HTTP_410_GONE)
            
            # Update last accessed
            session.last_accessed = timezone.now()
            session.save(update_fields=['last_accessed'])
            
            serializer = TempEmailSessionSerializer(session)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error retrieving temp email session {pk}: {str(e)}")
            return Response({
                'error': 'Session not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def extend(self, request, pk=None):
        """Extend a temporary email session."""
        session = get_object_or_404(TempEmailSession, session_token=pk, is_active=True)
        
        if session.is_expired():
            return Response({
                'error': 'Cannot extend expired session'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Extend by 10 minutes
        session.extend_session(10)
        
        serializer = TempEmailSessionSerializer(session)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get messages for a temporary email session."""
        session = get_object_or_404(TempEmailSession, session_token=pk, is_active=True)
        
        if session.is_expired():
            return Response({
                'error': 'Session has expired'
            }, status=status.HTTP_410_GONE)
        
        # Get messages, excluding expired ones
        messages = session.messages.filter(expires_at__gt=timezone.now()).order_by('-received_at')
        
        # Pagination
        page_size = int(request.query_params.get('page_size', 20))
        page = int(request.query_params.get('page', 1))
        start = (page - 1) * page_size
        end = start + page_size
        
        paginated_messages = messages[start:end]
        serializer = TempEmailMessageSerializer(paginated_messages, many=True)
        
        return Response({
            'messages': serializer.data,
            'total_count': messages.count(),
            'page': page,
            'page_size': page_size,
            'has_next': end < messages.count()
        })
    
    @action(detail=True, methods=['delete'])
    def delete_session(self, request, pk=None):
        """Delete a temporary email session and all its messages."""
        session = get_object_or_404(TempEmailSession, session_token=pk)
        
        # Delete all messages first
        session.messages.all().delete()
        
        # Delete session
        session.delete()
        
        return Response({'message': 'Session deleted successfully'})


class TempEmailMessageViewSet(viewsets.ViewSet):
    """ViewSet for temporary email messages."""
    
    permission_classes = [permissions.AllowAny]
    
    def retrieve(self, request, pk=None):
        """Get a specific message."""
        message = get_object_or_404(TempEmailMessage, id=pk)
        
        # Check if session is still active
        if message.session.is_expired() or not message.session.is_active:
            return Response({
                'error': 'Session has expired'
            }, status=status.HTTP_410_GONE)
        
        # Mark as read
        message.mark_as_read()
        
        serializer = TempEmailMessageSerializer(message)
        return Response(serializer.data)
    
    @action(detail=True, methods=['delete'])
    def delete_message(self, request, pk=None):
        """Delete a specific message."""
        message = get_object_or_404(TempEmailMessage, id=pk)
        
        # Check if session is still active
        if message.session.is_expired() or not message.session.is_active:
            return Response({
                'error': 'Session has expired'
            }, status=status.HTTP_410_GONE)
        
        message.delete()
        
        # Update session message count
        message.session.message_count = message.session.messages.count()
        message.session.save(update_fields=['message_count'])
        
        return Response({'message': 'Message deleted successfully'})


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def download_attachment(request, attachment_id):
    """Download an email attachment."""
    attachment = get_object_or_404(TempEmailAttachment, id=attachment_id)
    
    # Check if session is still active
    if attachment.message.session.is_expired() or not attachment.message.session.is_active:
        raise Http404("Session has expired")
    
    response = HttpResponse(
        attachment.file_data,
        content_type=attachment.content_type
    )
    response['Content-Disposition'] = f'attachment; filename="{attachment.filename}"'
    response['Content-Length'] = attachment.size_bytes
    
    return response


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def receive_email(request):
    """
    Webhook endpoint to receive emails from external mail services.
    Supports multiple formats: Mailgun, SendGrid, Postmark, and generic.
    """
    try:
        # Determine the email service format
        email_data = None
        content_type = request.content_type or ''
        
        if 'mailgun' in request.META.get('HTTP_USER_AGENT', '').lower():
            email_data = parse_mailgun_webhook(request)
        elif 'sendgrid' in request.META.get('HTTP_USER_AGENT', '').lower():
            email_data = parse_sendgrid_webhook(request)
        elif 'postmark' in request.META.get('HTTP_USER_AGENT', '').lower():
            email_data = parse_postmark_webhook(request)
        else:
            # Generic format or direct API call
            email_data = parse_generic_email(request.data)
        
        if not email_data:
            return Response({'error': 'Invalid email format'}, status=status.HTTP_400_BAD_REQUEST)
        
        to_email = email_data.get('to')
        from_email = email_data.get('from')
        subject = email_data.get('subject', '')
        body_text = email_data.get('text', '')
        body_html = email_data.get('html', '')
        message_id = email_data.get('message_id')
        
        # Extract recipient if it's in format "Name <email@domain.com>"
        if '<' in to_email and '>' in to_email:
            to_email = to_email.split('<')[1].split('>')[0].strip()
        
        # Extract sender email if it's in format "Name <email@domain.com>"
        sender_name = ''
        if '<' in from_email and '>' in from_email:
            sender_name = from_email.split('<')[0].strip().strip('"')
            from_email = from_email.split('<')[1].split('>')[0].strip()
        
        # Check if recipient email exists and is active
        try:
            session = TempEmailSession.objects.get(
                email_address=to_email,
                is_active=True,
                expires_at__gt=timezone.now()
            )
        except TempEmailSession.DoesNotExist:
            logger.warning(f"Received email for non-existent session: {to_email}")
            return Response({'error': 'Recipient not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if sender is blacklisted
        if EmailBlacklist.is_blacklisted(from_email):
            logger.warning(f"Blocked email from blacklisted sender: {from_email}")
            return Response({'error': 'Sender blocked'}, status=status.HTTP_403_FORBIDDEN)
        
        # Create message
        message = TempEmailMessage.objects.create(
            session=session,
            message_id=message_id or f"external_{timezone.now().timestamp()}",
            sender_email=from_email,
            sender_name=sender_name or email_data.get('from_name', ''),
            subject=subject,
            body_text=body_text,
            body_html=body_html,
            headers=email_data.get('headers', {}),
            expires_at=session.expires_at
        )
        
        # Handle attachments if present
        attachments = email_data.get('attachments', [])
        for attachment_data in attachments:
            if isinstance(attachment_data, dict) and 'filename' in attachment_data:
                TempEmailAttachment.objects.create(
                    message=message,
                    filename=attachment_data['filename'],
                    content_type=attachment_data.get('content_type', 'application/octet-stream'),
                    size_bytes=len(attachment_data.get('data', b'')),
                    file_data=attachment_data.get('data', b'')
                )
        
        logger.info(f"Received external email for {to_email}: {subject} from {from_email}")
        
        return Response({'message': 'Email received successfully'})
        
    except Exception as e:
        logger.error(f"Error receiving email: {str(e)}")
        return Response({'error': 'Failed to process email'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def parse_mailgun_webhook(request):
    """Parse Mailgun webhook format."""
    try:
        data = request.data
        return {
            'to': data.get('recipient'),
            'from': data.get('sender'),
            'subject': data.get('subject', ''),
            'text': data.get('body-plain', ''),
            'html': data.get('body-html', ''),
            'message_id': data.get('Message-Id'),
            'headers': {
                'Date': data.get('Date'),
                'From': data.get('sender'),
                'To': data.get('recipient'),
                'Subject': data.get('subject'),
            },
            'attachments': []  # TODO: Handle Mailgun attachments
        }
    except Exception as e:
        logger.error(f"Error parsing Mailgun webhook: {str(e)}")
        return None


def parse_sendgrid_webhook(request):
    """Parse SendGrid webhook format."""
    try:
        data = request.data
        # SendGrid sends an array of events
        if isinstance(data, list) and len(data) > 0:
            email_data = data[0]
        else:
            email_data = data
            
        return {
            'to': email_data.get('to'),
            'from': email_data.get('from'),
            'subject': email_data.get('subject', ''),
            'text': email_data.get('text', ''),
            'html': email_data.get('html', ''),
            'message_id': email_data.get('message_id'),
            'headers': email_data.get('headers', {}),
            'attachments': email_data.get('attachments', [])
        }
    except Exception as e:
        logger.error(f"Error parsing SendGrid webhook: {str(e)}")
        return None


def parse_postmark_webhook(request):
    """Parse Postmark webhook format."""
    try:
        data = request.data
        return {
            'to': data.get('To'),
            'from': data.get('From'),
            'subject': data.get('Subject', ''),
            'text': data.get('TextBody', ''),
            'html': data.get('HtmlBody', ''),
            'message_id': data.get('MessageID'),
            'headers': data.get('Headers', []),
            'attachments': data.get('Attachments', [])
        }
    except Exception as e:
        logger.error(f"Error parsing Postmark webhook: {str(e)}")
        return None


def parse_generic_email(data):
    """Parse generic email format."""
    try:
        return {
            'to': data.get('to') or data.get('recipient'),
            'from': data.get('from') or data.get('sender'),
            'subject': data.get('subject', ''),
            'text': data.get('text') or data.get('body_text') or data.get('body-plain', ''),
            'html': data.get('html') or data.get('body_html') or data.get('body-html', ''),
            'message_id': data.get('message_id') or data.get('Message-Id'),
            'headers': data.get('headers', {}),
            'attachments': data.get('attachments', [])
        }
    except Exception as e:
        logger.error(f"Error parsing generic email: {str(e)}")
        return None


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def cleanup_expired(request):
    """Manual cleanup endpoint for expired sessions and messages."""
    try:
        # Cleanup expired sessions
        session_count = TempEmailSession.cleanup_expired()
        
        # Cleanup expired messages
        message_count = TempEmailMessage.cleanup_expired()
        
        return Response({
            'message': 'Cleanup completed',
            'expired_sessions': session_count,
            'expired_messages': message_count
        })
        
    except Exception as e:
        logger.error(f"Error during cleanup: {str(e)}")
        return Response({'error': 'Cleanup failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def create_tempmail_for_registration(request):
    """Create a tempmail session specifically for user registration (longer duration)."""
    try:
        # Rate limiting by IP
        client_ip, _ = get_client_ip(request)
        cache_key = f"tempmail_registration_{client_ip}"
        
        if cache.get(cache_key):
            return Response({
                'error': 'Rate limit exceeded. Please wait before creating another email.'
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        # Set rate limit (1 email per 2 minutes per IP for registration)
        cache.set(cache_key, True, 120)
        
        # Create session with longer duration for registration
        session = TempEmailSession.generate_email(
            ip_address=client_ip,
            duration_minutes=60  # 1 hour for registration
        )
        
        serializer = TempEmailSessionSerializer(session)
        
        logger.info(f"Created tempmail for registration: {session.email_address} from IP {client_ip}")
        
        return Response({
            **serializer.data,
            'message': 'Temporary email created for registration. Valid for 1 hour.',
            'registration_tip': 'Use this email to register and check this inbox for verification emails.'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error creating tempmail for registration: {str(e)}")
        return Response({
            'error': 'Failed to create temporary email'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])
def test_webhook(request):
    """Test endpoint to verify webhook functionality."""
    return Response({
        'status': 'success',
        'message': 'Webhook endpoint is working',
        'method': request.method,
        'data': request.data if request.method == 'POST' else None,
        'headers': dict(request.headers),
        'timestamp': timezone.now().isoformat()
    })