# URLBriefr Deployment Guide

This guide provides instructions for deploying the URLBriefr application with frontend and backend as separate services.

## Project Structure

- **backend/**: Django REST API backend
- **frontend/**: React.js frontend application

## Separate Deployment

For production, we recommend deploying the frontend and backend as separate services:

### Backend Deployment

1. **Render (Recommended)**
   - Use the `render.yaml` file for configuration
   - Database is automatically provisioned
   - Follow instructions in `BACKEND_DEPLOYMENT.md`

2. **Alternative Platforms**
   - Heroku
   - Digital Ocean App Platform
   - AWS Elastic Beanstalk

### Frontend Deployment

1. **Render Static Site (Recommended)**
   - Create a static site for the frontend
   - Connect to your GitHub repo
   - Set build command: `cd frontend && npm install && npm run build`
   - Set publish directory: `frontend/build`
   - Follow instructions in `FRONTEND_DEPLOYMENT.md`

2. **Alternative Platforms**
   - Vercel
   - Netlify
   - GitHub Pages

## Configuration

### Backend Environment Variables

```
DEBUG=False
SECRET_KEY=your_secret_key_here
ALLOWED_HOSTS=.onrender.com
DATABASE_URL=postgres://user:password@host:port/database
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### Frontend Environment Variables

```
REACT_APP_API_URL=https://your-backend-url.com
```

## Docker Deployment (Alternative)

If you prefer to use Docker, you can use the provided Dockerfile and docker-compose.yml:

```bash
docker-compose up -d
```

## Important Notes

1. Backend and frontend must communicate through proper API URLs
2. CORS is configured in the backend to allow frontend requests
3. The React app has environment variables for API connection
4. For Render, separate deployments is the recommended approach
5. Make sure to update all links between frontend and backend

For detailed instructions, refer to:
- `BACKEND_DEPLOYMENT.md`
- `FRONTEND_DEPLOYMENT.md`
- `DEPLOYMENT.md` (for combined deployment) 