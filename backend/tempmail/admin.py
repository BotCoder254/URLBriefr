from django.contrib import admin
from .models import TempEmailSession, TempEmailMessage, TempEmailAttachment, EmailBlacklist


@admin.register(TempEmailSession)
class TempEmailSessionAdmin(admin.ModelAdmin):
    list_display = [
        'email_address', 'ip_address', 'message_count', 
        'created_at', 'expires_at', 'is_active'
    ]
    list_filter = ['is_active', 'created_at', 'expires_at']
    search_fields = ['email_address', 'ip_address']
    readonly_fields = ['session_token', 'created_at', 'last_accessed']
    ordering = ['-created_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related()


class TempEmailAttachmentInline(admin.TabularInline):
    model = TempEmailAttachment
    extra = 0
    readonly_fields = ['filename', 'content_type', 'size_bytes', 'created_at']


@admin.register(TempEmailMessage)
class TempEmailMessageAdmin(admin.ModelAdmin):
    list_display = [
        'sender_email', 'subject', 'session', 'is_read', 
        'is_spam', 'received_at', 'expires_at'
    ]
    list_filter = ['is_read', 'is_spam', 'received_at', 'expires_at']
    search_fields = ['sender_email', 'subject', 'session__email_address']
    readonly_fields = [
        'message_id', 'sender_email', 'sender_name', 'subject',
        'body_text', 'body_html', 'headers', 'received_at', 'size_bytes'
    ]
    inlines = [TempEmailAttachmentInline]
    ordering = ['-received_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('session')


@admin.register(TempEmailAttachment)
class TempEmailAttachmentAdmin(admin.ModelAdmin):
    list_display = ['filename', 'content_type', 'size_bytes', 'message', 'created_at']
    list_filter = ['content_type', 'created_at']
    search_fields = ['filename', 'message__subject']
    readonly_fields = ['filename', 'content_type', 'size_bytes', 'file_data', 'created_at']
    ordering = ['-created_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('message', 'message__session')


@admin.register(EmailBlacklist)
class EmailBlacklistAdmin(admin.ModelAdmin):
    list_display = ['blacklist_type', 'value', 'reason', 'is_active', 'created_at']
    list_filter = ['blacklist_type', 'is_active', 'created_at']
    search_fields = ['value', 'reason']
    ordering = ['-created_at']