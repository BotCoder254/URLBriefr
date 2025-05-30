import React from 'react';
import { motion } from 'framer-motion';
import { FiAlertCircle, FiCalendar, FiClock, FiX, FiExternalLink, FiLink, FiMail, FiUser } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const InactiveUrlModal = ({ urlInfo, onClose }) => {
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Calculate time since expiration
  const getTimeSinceExpiration = (expirationDate) => {
    if (!expirationDate) return '';
    
    const expDate = new Date(expirationDate);
    const now = new Date();
    const diffTime = Math.abs(now - expDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} and ${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return 'just now';
    }
  };
  
  return (
    <div className="fixed inset-0 bg-dark-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-soft p-6 max-w-md w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
              <FiAlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-display font-semibold text-dark-900">
              {urlInfo.reason === 'expired' ? 'URL Expired' : 'URL Inactive'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-dark-600"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            <p>
              {urlInfo.reason === 'expired' 
                ? 'This shortened URL has expired and is no longer accessible.'
                : 'This shortened URL has been deactivated by its owner.'}
            </p>
          </div>
          
          {urlInfo.url_info && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex items-center">
                <FiLink className="mr-2 text-primary-600" />
                <span className="font-medium text-dark-800">
                  {urlInfo.url_info.short_code}
                </span>
              </div>
              
              {urlInfo.url_info.title && (
                <p className="text-dark-700">
                  <span className="font-medium">Title:</span> {urlInfo.url_info.title}
                </p>
              )}
              
              {urlInfo.url_info.owner && (
                <p className="text-dark-700 flex items-center">
                  <FiUser className="mr-1 text-dark-400" /> 
                  <span className="font-medium">Owner:</span> 
                  <a href={`mailto:${urlInfo.url_info.owner}`} className="ml-1 text-primary-600 hover:underline flex items-center">
                    {urlInfo.url_info.owner} <FiMail className="ml-1" />
                  </a>
                </p>
              )}
              
              <div className="flex flex-col space-y-2">
                <p className="text-dark-700 flex items-center">
                  <FiCalendar className="mr-1 text-dark-400" /> 
                  <span className="font-medium">Created:</span> {formatDate(urlInfo.url_info.created_at)}
                </p>
                
                {urlInfo.url_info.expires_at && urlInfo.reason === 'expired' && (
                  <div className="space-y-1">
                    <p className="text-red-600 flex items-center">
                      <FiClock className="mr-1" /> 
                      <span className="font-medium">Expired:</span> {formatDate(urlInfo.url_info.expires_at)}
                    </p>
                    <p className="text-sm text-red-500">
                      Expired {getTimeSinceExpiration(urlInfo.url_info.expires_at)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="pt-4 border-t border-gray-200">
            <div className="text-center text-dark-500 mb-4">
              <p>Need to create a new shortened URL?</p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={onClose}
                className="btn btn-outline"
              >
                Close
              </button>
              <Link to="/" className="btn btn-primary flex items-center justify-center">
                <FiLink className="mr-2" /> Create New URL
              </Link>
              <Link to="/login" className="btn btn-secondary flex items-center justify-center">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InactiveUrlModal; 