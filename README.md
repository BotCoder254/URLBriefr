# URL Shortener Application

A modern URL shortener with powerful analytics and customization options.

## Features

- Shorten URLs with custom codes and titles
- Set expiration dates for URLs (specific date or number of days)
- Comprehensive analytics dashboard
- Track clicks by device, browser, OS, and location
- User authentication and role-based access control
- Manage and search your shortened URLs

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