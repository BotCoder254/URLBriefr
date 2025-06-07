# URLBriefr Deployment Guide

This document provides instructions for deploying the URLBriefr application using various methods.

## Table of Contents
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Render Deployment](#render-deployment)
- [Environment Variables](#environment-variables)

## Local Development

### Backend Setup
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

4. Start the development server:
   ```
   python manage.py runserver
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

## Docker Deployment

1. Make sure Docker and Docker Compose are installed on your system.

2. Create a `.env` file based on the environment variables listed in the [Environment Variables](#environment-variables) section.

3. Build and start the containers:
   ```
   docker-compose up -d
   ```

4. Access the application at `http://localhost`.

## Render Deployment

1. Create a new account on [Render](https://render.com) if you don't have one.

2. Connect your GitHub repository to Render.

3. Use the `render.yaml` file in the repository to set up the services.

4. Render will automatically deploy the application based on the configuration in the `render.yaml` file.

## Environment Variables

### Backend Environment Variables
- `DEBUG`: Set to "True" for development, "False" for production
- `SECRET_KEY`: Django secret key
- `ALLOWED_HOSTS`: Comma-separated list of allowed hosts
- `DATABASE_URL`: PostgreSQL connection string

### Frontend Environment Variables
- `REACT_APP_API_URL`: URL of the backend API

## Additional Notes

- The application uses PostgreSQL as the database. Make sure it's installed and configured properly.
- For production deployment, make sure to set `DEBUG=False` and configure proper `ALLOWED_HOSTS`.
- SSL/TLS certificates should be configured for production deployments to ensure secure connections. 