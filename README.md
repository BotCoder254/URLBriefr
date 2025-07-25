# URL Shortener Application

A modern URL shortener with powerful analytics and customization options.

## Features

### URL Shortening
- Shorten URLs with custom codes and titles
- Set expiration dates for URLs (specific date or number of days)
- Comprehensive analytics dashboard
- Track clicks by device, browser, OS, and location
- User authentication and role-based access control
- Manage and search your shortened URLs

### Temporary Email System (BETA)
- **Generate Disposable Emails**: Create random, temporary email addresses instantly
- **Real-time Inbox**: Receive emails in real-time with live updates
- **Session Management**: Control email session duration (5-60 minutes)
- **Email Viewer**: Read emails with HTML support and attachment downloads
- **Auto-cleanup**: Automatic deletion of expired emails and sessions
- **No Registration**: Use temporary emails without creating an account
- **Security Features**: Spam detection and sender blacklisting
- **Mobile Responsive**: Works seamlessly on all devices

> **Note**: The temporary email system is currently in beta. While fully functional, you may experience occasional issues as we continue to improve the service.

## Setup and Installation

### Backend (Django)

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run migrations:
   ```
   python manage.py migrate
   ```

4. Start the Django development server:
   ```
   python manage.py runserver
   ```

### Temporary Email Setup

To enable the temporary email system to receive real external emails:

#### Option 1: Using Mailgun (Recommended)

1. **Sign up for Mailgun** at https://www.mailgun.com/
2. **Add your domain** and verify DNS records
3. **Configure environment variables**:
   ```bash
   export TEMPMAIL_DOMAIN="yourdomain.com"
   export MAILGUN_API_KEY="your-mailgun-api-key"
   export MAILGUN_DOMAIN="yourdomain.com"
   ```
4. **Set up webhook** in Mailgun dashboard:
   - URL: `https://yourdomain.com/api/tempmail/receive/`
   - Events: Select "delivered"

#### Option 2: Using SendGrid

1. **Sign up for SendGrid** at https://sendgrid.com/
2. **Configure environment variables**:
   ```bash
   export TEMPMAIL_DOMAIN="yourdomain.com"
   export SENDGRID_API_KEY="your-sendgrid-api-key"
   ```
3. **Set up Inbound Parse** webhook:
   - URL: `https://yourdomain.com/api/tempmail/receive/`

#### Option 3: Development Testing

For development/testing without external services:
1. **Start the email server simulator**:
   ```bash
   cd backend
   python email_server_simulator.py
   ```
2. **Configure email client** to send to localhost:1025
3. **Test with generated addresses** @yourdomain.com

#### DNS Configuration

Add these DNS records for your domain:
```
MX    10    mxa.mailgun.org
MX    10    mxb.mailgun.org
TXT   "v=spf1 include:mailgun.org ~all"
```

### Frontend (React)

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the React development server:
   ```
   npm start
   ```

## Running Scheduled Tasks

The application includes scheduled tasks to handle URL expiration. There are two ways to run these tasks:

### 1. Using the Management Command

To manually deactivate expired URLs, run:

```
python manage.py deactivate_expired_urls
```

### 2. Using Celery for Automated Tasks

For automated URL expiration checks, you need to set up Celery with Redis:

1. Install Redis (if not already installed)

2. Start the Celery worker:
   ```
   cd backend
   celery -A core worker -l info
   ```

3. Start the Celery beat scheduler:
   ```
   cd backend
   celery -A core beat -l info
   ```

## Usage

1. Access the frontend at: http://localhost:3000
2. Create shortened URLs with or without an account
3. Set custom expiration dates for your URLs
4. Track analytics and manage your URLs in the dashboard

## API Endpoints

- `POST /api/urls/`: Create a new shortened URL
- `GET /api/urls/`: Get all URLs for the current user
- `GET /api/analytics/dashboard/`: Get dashboard analytics
- `GET /api/analytics/{id}/`: Get analytics for a specific URL
- `GET /s/{short_code}/`: Redirect to the original URL

## Technologies Used

- **Frontend**: React, Tailwind CSS, Framer Motion, Recharts
- **Backend**: Django, Django REST Framework
- **Database**: SQLite (development), PostgreSQL (production)
- **Task Queue**: Celery with Redis
- **Authentication**: JWT with Simple JWT 