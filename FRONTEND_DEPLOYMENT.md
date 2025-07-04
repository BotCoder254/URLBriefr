# URLBriefr Frontend Deployment Guide

This document provides instructions for deploying the URLBriefr frontend application separately from the backend.

## Deploying to Render

### Option 1: Static Site (Recommended)

1. Sign in to your Render account
2. Go to Dashboard and click "New +"
3. Select "Static Site"
4. Connect your GitHub repository
5. Configure the following settings:
   - **Name**: urlbriefr-frontend
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`
   - **Environment Variables**:
     - `REACT_APP_API_URL`: Your backend API URL (e.g., https://urlbriefr-backend.onrender.com)

6. Click "Create Static Site"

### Option 2: Web Service

If you need server-side rendering or other Node.js capabilities:

1. Sign in to your Render account
2. Go to Dashboard and click "New +"
3. Select "Web Service"
4. Connect your GitHub repository
5. Configure the following settings:
   - **Name**: urlbriefr-frontend
   - **Environment**: Node
   - **Region**: Choose the region closest to your users
   - **Branch**: main (or your preferred branch)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Start Command**: `cd frontend && npm start`
   - **Environment Variables**:
     - `REACT_APP_API_URL`: Your backend API URL (e.g., https://urlbriefr-backend.onrender.com)

6. Click "Create Web Service"

## Deploying to Vercel (Alternative)

1. Sign up for a Vercel account at https://vercel.com
2. Install the Vercel CLI: `npm i -g vercel`
3. Navigate to your frontend directory: `cd frontend`
4. Run: `vercel`
5. Follow the prompts to link your project
6. Set the environment variable:
   - `REACT_APP_API_URL`: Your backend API URL

## Deploying to Netlify (Alternative)

1. Sign up for a Netlify account at https://netlify.com
2. Go to your Netlify dashboard and click "New site from Git"
3. Connect to your GitHub repository
4. Configure the build settings:
   - **Base directory**: frontend
   - **Build command**: npm run build
   - **Publish directory**: build
5. Add environment variable:
   - `REACT_APP_API_URL`: Your backend API URL

## Important Notes

1. Make sure CORS is properly configured on your backend to accept requests from your frontend domain
2. For production, ensure your environment variables are properly set
3. If you update your API URL, you'll need to rebuild the frontend application
