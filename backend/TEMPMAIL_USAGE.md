# Temporary Email System - Usage Guide

## 🎯 Overview

The temporary email system allows users to generate disposable email addresses that can receive emails for a limited time. This is perfect for:

- **User Registration**: Register for URLBriefr without using your real email
- **Email Verification**: Receive verification emails instantly
- **Testing**: Test email functionality during development
- **Privacy**: Keep your real email address private

## 🚀 How to Use

### For End Users

1. **Visit the TempMail Page**
   - Go to `http://localhost:3000/tempmail`
   - Click "Generate Email" to create a temporary address

2. **Use the Email Address**
   - Copy the generated email address
   - Use it to register for URLBriefr or any other service
   - Or click "Register with this Email" for quick registration

3. **Check Your Inbox**
   - Emails appear in real-time in the inbox
   - Click on any email to read the full content
   - Download attachments if present

4. **Manage Your Session**
   - Extend session by 10 minutes if needed
   - Delete session when done
   - Sessions auto-expire after the set duration

### For Registration Flow

1. **Generate Temporary Email**
   ```
   POST /api/tempmail/sessions/
   {
     "duration_minutes": 60
   }
   ```

2. **Register with Temporary Email**
   - Use the generated email address in the registration form
   - Verification emails will be delivered to the tempmail inbox

3. **Check Verification Email**
   ```
   GET /api/tempmail/sessions/{token}/messages/
   ```

4. **Complete Verification**
   - Click the verification link in the email
   - Account will be activated

## 🔧 Technical Details

### Email Delivery

The system uses a custom email backend that:
- Intercepts emails sent to `@tempbriefr.com` addresses
- Delivers them to the tempmail system instead of external SMTP
- Falls back to regular SMTP for other email addresses

### Session Management

- **Duration**: 5-60 minutes (configurable)
- **Auto-cleanup**: Expired sessions and messages are automatically deleted
- **Rate Limiting**: 1 email per minute per IP address
- **Extension**: Sessions can be extended by 10 minutes

### Security Features

- **IP Tracking**: All sessions are tied to IP addresses
- **Rate Limiting**: Prevents abuse
- **Spam Protection**: Blacklist system for malicious senders
- **Auto-expiration**: No permanent data storage

## 📧 Email Backend Configuration

The system is configured to use the custom email backend:

```python
# settings.py
EMAIL_BACKEND = 'tempmail.email_backend.TempMailBackend'
```

This backend:
- Routes `@tempbriefr.com` emails to tempmail system
- Uses SMTP for all other email addresses
- Maintains compatibility with existing email functionality

## 🧪 Testing

### Test Email Delivery
```bash
python manage.py test_tempmail_delivery
```

### Test Integration
```bash
python test_email_integration.py
```

### Manual Testing
1. Create a tempmail session
2. Send an email to the generated address
3. Check if it appears in the inbox
4. Test registration flow with the email

## 🛠️ Development Setup

### Start Email Server Simulator (Optional)
```bash
python email_server_simulator.py
```

### Run Cleanup Command
```bash
python manage.py cleanup_tempmail
```

### Check Logs
```bash
# Check Django logs for email delivery
tail -f django.log

# Check tempmail specific logs
grep "tempmail" django.log
```

## 🔍 Troubleshooting

### Emails Not Appearing in Inbox

1. **Check Email Backend Configuration**
   ```python
   # Verify in settings.py
   EMAIL_BACKEND = 'tempmail.email_backend.TempMailBackend'
   ```

2. **Check Session Status**
   ```bash
   python manage.py shell
   >>> from tempmail.models import TempEmailSession
   >>> TempEmailSession.objects.filter(is_active=True)
   ```

3. **Check Email Logs**
   ```bash
   grep "tempmail" logs/django.log
   ```

### Session Expired Issues

1. **Extend Session Duration**
   ```python
   # In views or management command
   session.extend_session(30)  # Extend by 30 minutes
   ```

2. **Check Cleanup Process**
   ```bash
   python manage.py cleanup_tempmail --dry-run
   ```

### Rate Limiting Issues

1. **Clear Rate Limit Cache**
   ```python
   from django.core.cache import cache
   cache.delete('tempmail_create_127.0.0.1')
   ```

2. **Adjust Rate Limits**
   ```python
   # In views.py
   cache.set(cache_key, True, 60)  # Adjust timeout
   ```

## 📊 Monitoring

### Check Active Sessions
```bash
python manage.py shell
>>> from tempmail.models import TempEmailSession
>>> TempEmailSession.objects.filter(is_active=True).count()
```

### Check Message Volume
```bash
>>> from tempmail.models import TempEmailMessage
>>> TempEmailMessage.objects.count()
```

### Performance Monitoring
- Monitor database size for cleanup effectiveness
- Check response times for email delivery
- Monitor rate limiting effectiveness

## 🔒 Security Considerations

1. **Data Retention**: Messages are automatically deleted after expiration
2. **Rate Limiting**: Prevents abuse and spam
3. **IP Tracking**: All sessions are tied to IP addresses
4. **Blacklisting**: Malicious senders can be blocked
5. **Session Limits**: Maximum session duration prevents long-term storage

## 🚀 Production Deployment

### Email Server Configuration
1. Set up proper DNS records for your domain
2. Configure SMTP server or email service
3. Update webhook URLs in mail server configuration
4. Set up monitoring and alerting

### Performance Optimization
1. Set up database indexing for large volumes
2. Configure Redis for caching
3. Set up Celery for background cleanup tasks
4. Monitor and optimize database queries

### Security Hardening
1. Implement CAPTCHA for high-volume usage
2. Set up proper firewall rules
3. Monitor for abuse patterns
4. Regular security audits