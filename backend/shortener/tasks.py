from django.utils import timezone
from celery import shared_task
from .models import ShortenedURL
import requests
import logging
import json
import os
from django.conf import settings

logger = logging.getLogger(__name__)

@shared_task
def deactivate_expired_urls():
    """
    Celery task to deactivate expired URLs.
    This task should be scheduled to run periodically.
    """
    count = ShortenedURL.deactivate_expired_urls()
    logger.info("Checked for and deactivated expired URLs")
    return f"Deactivated {count} expired URLs"

@shared_task
def scan_url_for_threats(url_id):
    """
    Scan a URL for malware, phishing, and other threats.
    Uses a combination of reputation databases and APIs.
    """
    from .models import ShortenedURL, MalwareDetectionResult
    
    try:
        shortened_url = ShortenedURL.objects.get(id=url_id)
    except ShortenedURL.DoesNotExist:
        logger.error(f"URL with ID {url_id} not found")
        return
        
    # Create or get malware detection result
    if shortened_url.malware_detection:
        detection_result = shortened_url.malware_detection
    else:
        detection_result = MalwareDetectionResult(url=shortened_url.original_url)
        
    # Set status to pending during scan
    detection_result.status = 'pending'
    detection_result.save()
    
    try:
        # Use Google Safe Browsing API if available
        api_key = os.environ.get('SAFE_BROWSING_API_KEY')
        if api_key:
            result = check_google_safe_browsing(shortened_url.original_url, api_key)
            if result['matches']:
                detection_result.status = 'malicious'
                detection_result.details = "Detected by Google Safe Browsing API"
                detection_result.threat_types = result['threat_types']
                detection_result.confidence_score = 0.9
                detection_result.save()
                return
        
        # Fallback to simple checks if no API key or no match
        result = simple_url_safety_check(shortened_url.original_url)
        detection_result.status = result['status']
        detection_result.details = result['details']
        detection_result.confidence_score = result['confidence']
        detection_result.save()
        
    except Exception as e:
        logger.error(f"Error scanning URL {shortened_url.original_url}: {str(e)}")
        detection_result.status = 'error'
        detection_result.details = f"Error during scan: {str(e)}"
        detection_result.save()

def check_google_safe_browsing(url, api_key):
    """Check URL against Google Safe Browsing API."""
    api_url = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={api_key}"
    
    payload = {
        "client": {
            "clientId": "urlbriefr",
            "clientVersion": "1.0.0"
        },
        "threatInfo": {
            "threatTypes": [
                "MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"
            ],
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [{"url": url}]
        }
    }
    
    response = requests.post(api_url, json=payload)
    result = response.json()
    
    if 'matches' in result:
        threat_types = [match['threatType'] for match in result['matches']]
        return {
            'matches': True,
            'threat_types': threat_types
        }
    else:
        return {
            'matches': False,
            'threat_types': []
        }

def simple_url_safety_check(url):
    """
    Perform basic safety checks on URL without external API.
    This is a fallback when API keys aren't available.
    """
    url_lower = url.lower()
    
    # Check for common phishing keywords
    phishing_keywords = [
        'login', 'verify', 'account', 'secure', 'banking', 'password',
        'credential', 'confirm', 'update', 'paypal', 'ebay', 'amazon',
        'apple', 'microsoft', 'google', 'facebook', 'instagram', 'netflix',
        'wallet', 'crypto', 'bitcoin', 'bank', 'credit', 'debit'
    ]
    
    # Check for suspicious TLDs
    suspicious_tlds = ['.tk', '.top', '.xyz', '.gq', '.ml', '.ga', '.cf']
    
    # Check for suspicious patterns
    has_suspicious_tld = any(url_lower.endswith(tld) for tld in suspicious_tlds)
    keyword_count = sum(1 for keyword in phishing_keywords if keyword in url_lower)
    has_ip_address = bool(url.split('://')[1].split('/')[0].replace('.', '').isdigit()) if '://' in url else False
    has_excessive_subdomains = url.count('.') > 3
    
    # Calculate suspicion score
    suspicion_score = 0
    if has_suspicious_tld:
        suspicion_score += 0.3
    suspicion_score += min(keyword_count * 0.1, 0.5)  # Cap at 0.5
    if has_ip_address:
        suspicion_score += 0.2
    if has_excessive_subdomains:
        suspicion_score += 0.2
    
    # Determine status based on score
    if suspicion_score >= 0.7:
        return {
            'status': 'suspicious',
            'details': "URL contains suspicious patterns that may indicate phishing",
            'confidence': suspicion_score
        }
    elif suspicion_score >= 0.4:
        return {
            'status': 'suspicious',
            'details': "URL contains some patterns that may be concerning",
            'confidence': suspicion_score
        }
    else:
        return {
            'status': 'clean',
            'details': "No obvious threats detected",
            'confidence': 1 - suspicion_score
        } 