import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight, FiExternalLink, FiLink, FiCopy, FiCheckCircle, FiEye, FiAlertCircle } from 'react-icons/fi';
import RocketAnimation from './animations/RocketAnimation';
import WorkingAnimation from './animations/WorkingAnimation';
import DiggingAnimation from './animations/DiggingAnimation';
import urlService from '../../services/urlService';

const CustomRedirectPage = ({ destinationUrl, settings }) => {
  const [timeLeft, setTimeLeft] = useState(settings.delay || 3);
  const [copied, setCopied] = useState(false);
  
  // Format the destination URL for display
  const formatUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '');
    } catch (e) {
      return url;
    }
  };
  
  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(settings.full_short_url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Could not copy text: ', err);
      });
  };
  
  // Track funnel step - destination reached
  useEffect(() => {
    // Track that user has reached the destination page
    if (settings.session_id && settings.short_code) {
      urlService.trackFunnelStep(settings.short_code, settings.session_id, 'reached_destination');
    }
  }, [settings.session_id, settings.short_code]);
  
  // Track completion of funnel (clicking to destination)
  const handleRedirect = () => {
    // Track the completion action before redirecting
    if (settings.session_id && settings.short_code) {
      urlService.trackFunnelStep(settings.short_code, settings.session_id, 'completed_action');
    }
    window.location.href = destinationUrl;
  };
  
  // Countdown timer effect
  useEffect(() => {
    if (timeLeft <= 0) {
      handleRedirect();
      return;
    }
    
    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [timeLeft, destinationUrl]);
  
  // Render the appropriate animation based on page type
  const renderAnimation = () => {
    // If preview is enabled and we have preview data, don't show animation
    if (settings.enable_preview && settings.preview_data) {
      return renderPreview();
    }
    
    // Otherwise show the animation
    switch (settings.page_type) {
      case 'rocket':
        return <RocketAnimation />;
      case 'working':
        return <WorkingAnimation />;
      case 'digging':
        return <DiggingAnimation />;
      default:
        return (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        );
    }
  };
  
  // Render preview content
  const renderPreview = () => {
    const { preview_data } = settings;
    if (!preview_data) return null;
    
    return (
      <div className="mb-4">
        <div className="relative rounded-lg overflow-hidden shadow-md">
          {/* Preview image */}
          {preview_data.image && (
            <div className="relative">
              <img 
                src={preview_data.image} 
                alt={preview_data.title || "Preview"} 
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2 bg-primary-600 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center">
                <FiEye className="mr-1" /> Preview
              </div>
            </div>
          )}
          
          {/* Preview content */}
          <div className="p-4 bg-white">
            {preview_data.title && (
              <h3 className="font-medium text-lg mb-2 text-dark-900">
                {preview_data.title}
              </h3>
            )}
            
            {preview_data.description && (
              <p className="text-dark-600 text-sm mb-3">
                {preview_data.description}
              </p>
            )}
            
            <div className="text-sm text-dark-500 flex items-center">
              <FiExternalLink className="mr-1" />
              <span>{formatUrl(destinationUrl)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with brand info if available */}
      {(settings.brand_name || settings.brand_logo_url) && (
        <header className="bg-white shadow-sm py-4">
          <div className="container mx-auto px-4 flex items-center">
            {settings.brand_logo_url && (
              <img 
                src={settings.brand_logo_url} 
                alt={settings.brand_name || 'Brand logo'} 
                className="h-8 mr-3"
              />
            )}
            {settings.brand_name && (
              <h1 className="text-xl font-display font-semibold text-dark-900">
                {settings.brand_name}
              </h1>
            )}
          </div>
        </header>
      )}
      
      {/* Main content */}
      <main className="flex-grow flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-soft p-6 max-w-lg w-full"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-display font-semibold text-dark-900 mb-2">
              {settings.title || "You're being redirected"}
            </h2>
            <p className="text-dark-500">
              {settings.message || "Redirecting to your destination..."}
            </p>
          </div>
          
          {/* Animation or Preview */}
          {renderAnimation()}
          
          {/* Destination info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FiExternalLink className="text-primary-600 mr-2" />
                <span className="font-medium">Destination:</span>
              </div>
              <a 
                href={destinationUrl} 
                className="text-primary-600 hover:underline truncate max-w-[200px]"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleRedirect}
              >
                {formatUrl(destinationUrl)}
              </a>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center">
                <FiLink className="text-primary-600 mr-2" />
                <span className="font-medium">Short URL:</span>
              </div>
              <div className="flex items-center">
                <span className="text-dark-800 mr-2 truncate max-w-[150px]">
                  {settings.full_short_url}
                </span>
                <button
                  onClick={handleCopy}
                  className="text-dark-400 hover:text-dark-600 focus:outline-none"
                  title="Copy to clipboard"
                >
                  {copied ? <FiCheckCircle className="text-accent-500" /> : <FiCopy />}
                </button>
              </div>
            </div>
          </div>
          
          {/* One-time use warning if applicable */}
          {settings.one_time_use && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800 flex items-center">
              <FiAlertCircle className="text-amber-500 mr-2 flex-shrink-0" />
              <span>This is a one-time use link and will expire after you visit it.</span>
            </div>
          )}
          
          {/* Progress and redirect button */}
          <div className="space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary-600 h-2.5 rounded-full transition-all duration-1000 ease-linear" 
                style={{ width: `${(1 - timeLeft / settings.delay) * 100}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between text-sm text-dark-500">
              <span>Redirecting in {timeLeft} second{timeLeft !== 1 ? 's' : ''}</span>
              <a 
                href={destinationUrl}
                className="text-primary-600 hover:underline flex items-center"
                onClick={handleRedirect}
              >
                Go now <FiArrowRight className="ml-1" />
              </a>
            </div>
            
            <a 
              href={destinationUrl}
              className="btn btn-primary w-full flex items-center justify-center"
              onClick={handleRedirect}
            >
              Continue to destination <FiArrowRight className="ml-2" />
            </a>
          </div>
        </motion.div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white py-3 text-center text-sm text-dark-400">
        <p>Powered by URLBriefr</p>
      </footer>
    </div>
  );
};

export default CustomRedirectPage; 