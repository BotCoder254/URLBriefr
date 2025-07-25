"""CORS settings for the URLBriefr backend."""

import os

# CORS Configuration
# In development, you can use CORS_ALLOW_ALL_ORIGINS = True
# For production, specify the allowed origins explicitly

# Get environment variable or use default value
CORS_ALLOW_ALL_ORIGINS = os.environ.get('CORS_ALLOW_ALL_ORIGINS', 'False').lower() == 'true'

# Default allowed origins (customize based on your deployment)
DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://urlbriefr-frontend.onrender.com",
    "https://urlbriefr.netlify.app",
    "https://urlbriefr.vercel.app",
]

# Get allowed origins from environment variable if provided
CORS_ALLOWED_ORIGINS_ENV = os.environ.get('CORS_ALLOWED_ORIGINS', '')
ADDITIONAL_ORIGINS = [origin.strip() for origin in CORS_ALLOWED_ORIGINS_ENV.split(',') if origin.strip()]

# Combine default and additional origins
CORS_ALLOWED_ORIGINS = DEFAULT_ALLOWED_ORIGINS + ADDITIONAL_ORIGINS

# Other CORS settings
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

CORS_EXPOSE_HEADERS = [
    'content-disposition',
]

# Allow cookies to be included in cross-site HTTP requests
CORS_ALLOW_CREDENTIALS = True
