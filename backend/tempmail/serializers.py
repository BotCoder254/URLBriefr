from rest_framework import serializers
from .models import TempEmailSession, TempEmailMessage, TempEmailAttachment
from django.utils import timezone


class TempEmailAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for email attachments."""
    
    size_display = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()
    
    class Meta:
        model = TempEmailAttachment
        fields = [
            'id', 'filename', 'content_type', 'size_bytes', 
            'size_display', 'download_url', 'created_at'
        ]
    
    def get_size_display(self, obj):
        return obj.get_size_display()
    
    def get_download_url(self, obj):
        return f"/api/tempmail/attachments/{obj.id}/download/"


class TempEmailMessageSerializer(serializers.ModelSerializer):
    """Serializer for temporary email messages."""
    
    attachments = TempEmailAttachmentSerializer(many=True, read_only=True)
    sender_display = serializers.SerializerMethodField()
    body_display = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    
    class Meta:
        model = TempEmailMessage
        fields = [
            'id', 'message_id', 'sender_email', 'sender_name', 'sender_display',
            'subject', 'body_text', 'body_html', 'body_display',
            'is_read', 'received_at', 'expires_at', 'time_ago', 'is_expired',
            'is_spam', 'spam_score', 'size_bytes', 'attachments'
        ]
        read_only_fields = [
            'id', 'message_id', 'sender_email', 'sender_name', 'subject',
            'body_text', 'body_html', 'received_at', 'expires_at',
            'is_spam', 'spam_score', 'size_bytes'
        ]
    
    def get_sender_display(self, obj):
        return obj.get_sender_display()
    
    def get_body_display(self, obj):
        return obj.get_display_body()
    
    def get_time_ago(self, obj):
        now = timezone.now()
        diff = now - obj.received_at
        
        if diff.days > 0:
            return f"{diff.days}d ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours}h ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes}m ago"
        else:
            return "Just now"
    
    def get_is_expired(self, obj):
        return obj.is_expired()


class TempEmailSessionSerializer(serializers.ModelSerializer):
    """Serializer for temporary email sessions."""
    
    messages = TempEmailMessageSerializer(many=True, read_only=True)
    time_remaining = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TempEmailSession
        fields = [
            'session_token', 'email_address', 'created_at', 'expires_at',
            'is_active', 'message_count', 'last_accessed', 'time_remaining',
            'is_expired', 'unread_count', 'messages'
        ]
        read_only_fields = [
            'session_token', 'email_address', 'created_at', 'expires_at',
            'message_count', 'last_accessed'
        ]
    
    def get_time_remaining(self, obj):
        return obj.time_remaining()
    
    def get_is_expired(self, obj):
        return obj.is_expired()
    
    def get_unread_count(self, obj):
        return obj.messages.filter(is_read=False).count()


class CreateTempEmailSessionSerializer(serializers.Serializer):
    """Serializer for creating a new temporary email session."""
    
    duration_minutes = serializers.IntegerField(
        default=30, 
        min_value=5, 
        max_value=60,
        help_text="Session duration in minutes (5-60)"
    )
    
    def create(self, validated_data):
        ip_address = self.context.get('ip_address')
        duration = validated_data.get('duration_minutes', 30)
        
        return TempEmailSession.generate_email(
            ip_address=ip_address,
            duration_minutes=duration
        )