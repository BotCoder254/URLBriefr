import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiDownload, FiShare2, FiLink, FiCheckCircle, FiRefreshCw, FiAlertCircle, FiGitBranch } from 'react-icons/fi';
import urlService from '../../services/urlService';

const QRCodeModal = ({ url, onClose }) => {
  const [qrCodeData, setQrCodeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await urlService.getQRCodeBase64(url.short_code);
        if (data) {
          setQrCodeData(data);
          setError(null);
        } else {
          setError('Failed to load QR code. Please try again.');
        }
      } catch (err) {
        console.error('Error fetching QR code:', err);
        setError('Failed to load QR code. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (url && url.short_code) {
      fetchQRCode();
    }
  }, [url, retryCount]);
  
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };
  
  const handleDownload = async () => {
    try {
      await urlService.downloadQRCode(url.short_code);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (err) {
      console.error('Error downloading QR code:', err);
      setError('Failed to download QR code. Please try again.');
    }
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(url.full_short_url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
        setError('Failed to copy link. Please try again.');
      });
  };
  
  return (
    <div className="fixed inset-0 bg-dark-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-soft p-6 max-w-md w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-display font-semibold text-dark-900">
            QR Code for Your URL
          </h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-dark-600"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <FiAlertCircle className="mr-2 flex-shrink-0" />
                <p>{error}</p>
              </div>
              <button 
                onClick={handleRetry}
                className="text-primary-600 hover:text-primary-700 flex items-center"
              >
                <FiRefreshCw className="mr-1" /> Retry
              </button>
            </div>
          )}
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-dark-700 mb-2 truncate">
              <span className="font-medium">URL:</span> {url.full_short_url}
            </p>
            {url.title && (
              <p className="text-dark-700 mb-2">
                <span className="font-medium">Title:</span> {url.title}
              </p>
            )}
          </div>
          
          <div className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-lg">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 w-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
                <p className="text-dark-500">Loading QR Code...</p>
              </div>
            ) : qrCodeData ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative group"
              >
                <img 
                  src={qrCodeData} 
                  alt="QR Code" 
                  className="h-64 w-64 object-contain"
                />
                <div className="absolute inset-0 bg-dark-900 bg-opacity-0 group-hover:bg-opacity-10 flex items-center justify-center transition-all duration-200 rounded-lg">
                  <button
                    onClick={handleDownload}
                    className="opacity-0 group-hover:opacity-100 btn btn-primary btn-sm"
                  >
                    <FiDownload className="mr-1" /> Download
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 w-64">
                <FiAlertCircle className="h-12 w-12 text-red-500 mb-2" />
                <p className="text-dark-500 text-center">QR code could not be loaded</p>
                <button 
                  onClick={handleRetry}
                  className="mt-4 btn btn-outline btn-sm"
                >
                  <FiRefreshCw className="mr-1" /> Try Again
                </button>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-3 pt-2">
            <button
              onClick={handleCopyLink}
              className="btn btn-outline flex items-center justify-center"
            >
              {copied ? (
                <>
                  <FiCheckCircle className="mr-2" /> Copied!
                </>
              ) : (
                <>
                  <FiLink className="mr-2" /> Copy Link
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="btn btn-primary flex items-center justify-center"
              disabled={isLoading || !qrCodeData}
            >
              {downloaded ? (
                <>
                  <FiCheckCircle className="mr-2" /> Downloaded!
                </>
              ) : (
                <>
                  <FiDownload className="mr-2" /> Download QR
                </>
              )}
            </button>
            {navigator.share && (
              <button
                onClick={() => {
                  navigator.share({
                    title: url.title || 'Shared URL',
                    text: 'Check out this URL',
                    url: url.full_short_url
                  }).catch(err => console.error('Error sharing:', err));
                }}
                className="btn btn-secondary flex items-center justify-center"
              >
                <FiShare2 className="mr-2" /> Share
              </button>
            )}
          </div>
          
          <div className="text-center text-sm text-dark-500 mt-4">
            <p>Scan this QR code to access the shortened URL</p>
            {url.is_ab_test && (
              <p className="mt-1 text-primary-600">
                <FiGitBranch className="inline mr-1" /> This URL is part of an A/B test
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default QRCodeModal; 