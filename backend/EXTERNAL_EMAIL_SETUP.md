# External Email Setup Guide

## 🎯 Overview

To receive emails from external services (Gmail, Yahoo, Outlook, etc.) in your temporary email system, you need to configure a mail service that can forward emails to your Django application.

## 🚀 Quick Setup Options

### Option 1: Mailgun (Recommended for Production)

1. **Sign up** at https://www.mailgun.com/
2. **Add your domain** in the Mailgun dashboard
3. **Configure DNS records** as shown in Mailgun
4. **Set environment variables**:
   ```bash
   export TEMPMAIL_DOMAIN="yourdomain.com"
   export MAILGUN_API_KEY="your-api-key"
   export MAILGUN_DOMAIN="yourdomain.com"
   ```
5. **Configure webhook** in Mailgun:
   - URL: `https://yourdomain.com/api/tempmail/receive/`
   - Method: POST
   - Events: delivered

### Option 2: SendGrid

1. **Sign up** at https://sendgrid.com/
2. **Set up Inbound Parse**
3. **Configure webhook**:
   - URL: `https://yourdomain.com/api/tempmail/receive/`

### Option 3: Development/Testing

For local development, the system works with internal Django emails automatically. External emails can be simulated using the test commands.

## 🔧 Configuration Steps

### 1. Update Environment Variables

Create a `.env` file in your backend directory:

```bash
# Your domain for temporary emails
TEMPMAIL_DOMAIN=yourdomain.com

# Mailgun configuration (if using Mailgun)
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=yourdomain.com

# SendGrid configuration (if using SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key

# Webhook security (optional)
TEMPMAIL_WEBHOOK_SECRET=your-secret-key
```

### 2. DNS Configuration

Add these DNS records to your domain:

**For Mailgun:**
```
MX    10    mxa.mailgun.org
MX    10    mxb.mailgun.org
TXT   "v=spf1 include:mailgun.org ~all"
```

**For SendGrid:**
```
MX    10    mx.sendgrid.net
TXT   "v=spf1 include:sendgrid.net ~all"
```

### 3. Webhook Configuration

Your webhook endpoint is: `https://yourdomain.com/api/tempmail/receive/`

The endpoint supports multiple formats:
- Mailgun webhook format
- SendGrid webhook format
- Postmark webhook format
- Generic JSON format

### 4. Test the Setup

```bash
# Test webhook endpoint
curl -X GET https://yourdomain.com/api/tempmail/test-webhook/

# Test email delivery
python manage.py test_tempmail_delivery

# Create a test session and send real email
python manage.py shell
>>> from tempmail.models import TempEmailSession
>>> session = TempEmailSession.generate_email()
>>> print(f"Send email to: {session.email_address}")
```

## 🧪 Testing

### 1. Test Webhook Functionality

```bash
curl -X POST https://yourdomain.com/api/tempmail/test-webhook/ \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### 2. Test Email Reception

1. Create a temporary email session
2. Send an email from Gmail/Yahoo to the generated address
3. Check if it appears in the tempmail inbox

### 3. Simulate External Email

```python
import requests

# Simulate external email
webhook_data = {
    'to': 'test123@yourdomain.com',
    'from': 'sender@gmail.com',
    'subject': 'Test Email',
    'text': 'This is a test email',
    'html': '<p>This is a <strong>test email</strong></p>'
}

response = requests.post(
    'http://localhost:8000/api/tempmail/receive/',
    json=webhook_data
)
```

## 🔍 Troubleshooting

### Emails Not Received

1. **Check DNS records**: Verify MX records are properly configured
2. **Check webhook URL**: Ensure it's accessible from the internet
3. **Check logs**: Look for webhook errors in Django logs
4. **Test webhook**: Use the test endpoint to verify connectivity

### Webhook Errors

1. **Check request format**: Different services send different formats
2. **Check authentication**: Some services require webhook authentication
3. **Check SSL**: Ensure your webhook URL uses HTTPS in production

### Domain Issues

1. **Verify domain ownership**: Complete domain verification in your email service
2. **Check SPF records**: Ensure SPF records are correctly configured
3. **Wait for DNS propagation**: DNS changes can take up to 48 hours

## 📊 Monitoring

### Check Email Reception

```python
from tempmail.models import TempEmailMessage
from django.utils import timezone
from datetime import timedelta

# Check recent messages
recent = timezone.now() - timedelta(hours=1)
messages = TempEmailMessage.objects.filter(received_at__gte=recent)
print(f"Received {messages.count()} emails in the last hour")
```

### Monitor Webhook Calls

Add logging to track webhook calls:

```python
import logging
logger = logging.getLogger('tempmail.webhook')

# In your webhook handler
logger.info(f"Webhook called: {request.method} from {request.META.get('REMOTE_ADDR')}")
```

## 🔒 Security

### Webhook Security

1. **Use HTTPS**: Always use HTTPS for webhook URLs
2. **Verify signatures**: Implement webhook signature verification
3. **Rate limiting**: Implement rate limiting for webhook endpoints
4. **IP whitelisting**: Whitelist email service IP addresses

### Spam Protection

1. **Blacklist management**: Regularly update email blacklists
2. **Content filtering**: Implement basic spam detection
3. **Rate limiting**: Limit email reception per session
4. **Session limits**: Implement reasonable session duration limits

## 🚀 Production Deployment

### Environment Setup

```bash
# Production environment variables
TEMPMAIL_DOMAIN=yourdomain.com
MAILGUN_API_KEY=your-production-api-key
MAILGUN_DOMAIN=yourdomain.com
DJANGO_SETTINGS_MODULE=urlbriefr.settings.production
```

### Scaling Considerations

1. **Database optimization**: Index frequently queried fields
2. **Caching**: Implement Redis caching for sessions
3. **Background tasks**: Use Celery for cleanup tasks
4. **Load balancing**: Use load balancer for high traffic

### Monitoring and Alerts

1. **Email delivery monitoring**: Track successful/failed deliveries
2. **Webhook monitoring**: Monitor webhook response times
3. **Storage monitoring**: Monitor database size and cleanup
4. **Error alerting**: Set up alerts for webhook failures