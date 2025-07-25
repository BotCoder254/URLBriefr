# URLBriefr Backend Deployment Guide

This document provides instructions for deploying the URLBriefr backend application separately from the frontend.

## Deploying to Render

1. Sign in to your Render account
2. Go to Dashboard and click "New +"
3. Select "Web Service"
4. Connect your GitHub repository
5. Configure the following settings:
   - **Name**: urlbriefr-backend
   - **Environment**: Python
   - **Region**: Choose the region closest to your users
   - **Branch**: main (or your preferred branch)
   - **Build Command**: `cd backend && pip install -r requirements.txt && pip install gunicorn`
   - **Start Command**: `cd backend && python manage.py migrate && gunicorn core.wsgi:application --bind 0.0.0.0:$PORT`

6. Set up Environment Variables:
   - **DEBUG**: false
   - **SECRET_KEY**: (generate a secure random string)
   - **ALLOWED_HOSTS**: .onrender.com
   - **CORS_ALLOWED_ORIGINS**: (URLs of your frontend, comma-separated)

7. Set up a PostgreSQL database:
   - Go to Dashboard and click "New +"
   - Select "PostgreSQL"
   - Configure your database settings
   - After creation, get the connection string from the database dashboard
   - Add it as an environment variable to your backend service:
     - **DATABASE_URL**: (your database connection string)

8. Click "Create Web Service"

## Deploying to Heroku (Alternative)

1. Install the Heroku CLI and log in
2. Navigate to your backend directory: `cd backend`
3. Create a new Heroku app: `heroku create urlbriefr-backend`
4. Add PostgreSQL: `heroku addons:create heroku-postgresql:hobby-dev`
5. Configure environment variables:
   ```
    DEBUG=False
    ALLOWED_HOSTS=.herokuapp.com
    SECRET_KEY=your_secret_key
    CORS_ALLOWED_ORIGINS=https://your-frontend-url.com
   ```
6. Deploy your application:
   ```
   git subtree push --prefix backend heroku main
   ```

## Deploying to Digital Ocean App Platform (Alternative)

1. Sign up for a Digital Ocean account
2. Create a new App
3. Connect your GitHub repository
4. Configure as a Web Service with these settings:
   - **Source Directory**: backend
   - **Build Command**: pip install -r requirements.txt
   - **Run Command**: gunicorn core.wsgi:application --bind 0.0.0.0:$PORT
5. Add environment variables similar to those for Render
6. Add a PostgreSQL database component
7. Deploy your application

## Important Notes

1. Always ensure your `requirements.txt` file is up to date
2. Configure CORS settings to allow requests from your frontend domain
3. Set DEBUG=False in production environments
4. Use a strong, random SECRET_KEY
5. If your application uses static files, configure appropriate storage (e.g., AWS S3)
6. Make sure migrations are properly applied before running the application
