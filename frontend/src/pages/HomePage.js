import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLink, FiCopy, FiArrowRight, FiCheckCircle, FiAlertCircle, FiSettings, FiX, FiClock, FiTag, FiCode, FiCalendar, FiGrid } from 'react-icons/fi';
import urlService from '../services/urlService';
import QRCodeModal from '../components/url/QRCodeModal';

const HomePage = () => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [shortenedUrl, setShortenedUrl] = useState('');
  const [shortenedUrlData, setShortenedUrlData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  
  // Advanced options
  const [customCode, setCustomCode] = useState('');
  const [title, setTitle] = useState('');
  const [expirationType, setExpirationType] = useState('never');
  const [expirationDays, setExpirationDays] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  
  // Get tomorrow's date in YYYY-MM-DD format for min date in date picker
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  
  const validateUrl = (url) => {
    // Simple URL validation
    if (!url) return false;
    
    // Add https:// if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    
    return url;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!originalUrl) {
      setError('Please enter a URL');
      return;
    }
    
    const validatedUrl = validateUrl(originalUrl);
    if (!validatedUrl) {
      setError('Please enter a valid URL');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const urlData = {
        original_url: validatedUrl
      };
      
      // Add advanced options if provided
      if (showAdvancedOptions) {
        if (customCode) urlData.custom_code = customCode;
        if (title) urlData.title = title;
        
        // Handle expiration based on type
        if (expirationType === 'days' && expirationDays) {
          urlData.expiration_type = 'days';
          urlData.expiration_days = parseInt(expirationDays, 10);
        } else if (expirationType === 'date' && expirationDate) {
          urlData.expiration_type = 'date';
          urlData.expiration_date = expirationDate;
        } else if (expirationType === 'never') {
          urlData.expiration_type = 'never';
        }
      }
      
      const response = await urlService.createUrl(urlData);
      setShortenedUrl(response.full_short_url);
      setShortenedUrlData(response);
    } catch (error) {
      console.error('Error shortening URL:', error);
      let errorMessage = 'Failed to shorten URL. Please try again.';
      
      if (error.response?.data) {
        if (error.response.data.original_url) {
          errorMessage = error.response.data.original_url[0];
        } else if (error.response.data.custom_code) {
          errorMessage = error.response.data.custom_code[0];
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.expiration_date) {
          errorMessage = error.response.data.expiration_date[0];
        } else if (error.response.data.expiration_days) {
          errorMessage = error.response.data.expiration_days[0];
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(shortenedUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Could not copy text: ', err);
      });
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50" />
        
        <div className="relative pt-20 pb-24 sm:pt-32 sm:pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-center"
            >
              <motion.h1 
                variants={itemVariants} 
                className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-dark-900 tracking-tight"
              >
                <span className="block">Shorten URLs,</span>
                <span className="block text-primary-600">Expand Possibilities</span>
              </motion.h1>
              
              <motion.p 
                variants={itemVariants}
                className="mt-6 max-w-lg mx-auto text-xl text-dark-500"
              >
                URLBriefr is a modern URL shortener with powerful analytics and customization options.
              </motion.p>
              
              <motion.div 
                variants={itemVariants}
                className="mt-10 max-w-lg mx-auto"
              >
                <div className="rounded-2xl bg-white shadow-soft p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="url" className="sr-only">
                        URL to shorten
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiLink className="h-5 w-5 text-dark-400" />
                        </div>
                        <input
                          type="text"
                          id="url"
                          className={`block w-full pl-10 pr-12 py-3 text-base rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 ${error ? 'border-red-500' : ''}`}
                          placeholder="Paste your long URL here"
                          value={originalUrl}
                          onChange={(e) => {
                            setOriginalUrl(e.target.value);
                            setError('');
                          }}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-r-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 h-full"
                          >
                            {isSubmitting ? (
                              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <FiArrowRight className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Advanced Options Toggle */}
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                        className="text-sm text-primary-600 flex items-center focus:outline-none hover:text-primary-700"
                      >
                        {showAdvancedOptions ? (
                          <>
                            <FiX className="mr-1 h-4 w-4" /> Hide advanced options
                          </>
                        ) : (
                          <>
                            <FiSettings className="mr-1 h-4 w-4" /> Show advanced options
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* Advanced Options */}
                    <AnimatePresence>
                      {showAdvancedOptions && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3 border-t border-gray-200 pt-3"
                        >
                          <div>
                            <label htmlFor="custom_code" className="block text-sm font-medium text-dark-700 mb-1">
                              <FiCode className="inline mr-1" /> Custom Code (Optional)
                            </label>
                            <input
                              type="text"
                              id="custom_code"
                              value={customCode}
                              onChange={(e) => setCustomCode(e.target.value)}
                              placeholder="e.g., my-link"
                              className="input w-full py-2"
                            />
                            <p className="mt-1 text-xs text-dark-500">
                              Create a custom alias for your URL (letters, numbers, and hyphens only).
                            </p>
                          </div>
                          
                          <div>
                            <label htmlFor="title" className="block text-sm font-medium text-dark-700 mb-1">
                              <FiTag className="inline mr-1" /> Title (Optional)
                            </label>
                            <input
                              type="text"
                              id="title"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder="e.g., My awesome link"
                              className="input w-full py-2"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="expiration_type" className="block text-sm font-medium text-dark-700 mb-1">
                              <FiClock className="inline mr-1" /> Expiration (Optional)
                            </label>
                            <select
                              id="expiration_type"
                              value={expirationType}
                              onChange={(e) => setExpirationType(e.target.value)}
                              className="input w-full py-2 mb-2"
                            >
                              <option value="never">Never expires</option>
                              <option value="days">Expire after days</option>
                              <option value="date">Expire on specific date</option>
                            </select>
                            
                            {expirationType === 'days' && (
                              <select
                                id="expiration_days"
                                value={expirationDays}
                                onChange={(e) => setExpirationDays(e.target.value)}
                                className="input w-full py-2"
                              >
                                <option value="">Select number of days</option>
                                <option value="1">1 day</option>
                                <option value="7">7 days</option>
                                <option value="30">30 days</option>
                                <option value="90">90 days</option>
                                <option value="365">1 year</option>
                              </select>
                            )}
                            
                            {expirationType === 'date' && (
                              <div>
                                <div className="flex items-center">
                                  <FiCalendar className="text-dark-400 mr-2" />
                                  <input
                                    type="date"
                                    id="expiration_date"
                                    value={expirationDate}
                                    onChange={(e) => setExpirationDate(e.target.value)}
                                    min={getTomorrowDate()}
                                    className="input w-full py-2"
                                  />
                                </div>
                                <p className="mt-1 text-xs text-dark-500">
                                  The URL will expire at the end of the selected day.
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {error && (
                      <div className="text-red-600 text-sm flex items-center">
                        <FiAlertCircle className="mr-1" />
                        {error}
                      </div>
                    )}
                    
                    {shortenedUrl && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 bg-primary-50 rounded-lg overflow-hidden"
                      >
                        <div className="p-4 border-b border-primary-100">
                          <div className="flex items-center justify-between">
                            <span className="text-primary-800 font-medium">Shortened URL</span>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-primary-800 font-medium truncate mr-2 text-lg">
                              {shortenedUrl}
                            </span>
                            <button
                              type="button"
                              onClick={handleCopy}
                              className="flex-shrink-0 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                              {copied ? (
                                <>
                                  <FiCheckCircle className="mr-1" /> Copied!
                                </>
                              ) : (
                                <>
                                  <FiCopy className="mr-1" /> Copy
                                </>
                              )}
                            </button>
                          </div>
                          
                          {shortenedUrlData && (
                            <div className="mt-2 space-y-1 text-sm text-primary-700">
                              <p className="truncate">
                                <span className="font-medium">Original:</span> {shortenedUrlData.original_url}
                              </p>
                              {shortenedUrlData.title && (
                                <p>
                                  <span className="font-medium">Title:</span> {shortenedUrlData.title}
                                </p>
                              )}
                              <p>
                                <span className="font-medium">Created:</span> {formatDate(shortenedUrlData.created_at)}
                              </p>
                              {shortenedUrlData.expires_at && (
                                <p>
                                  <span className="font-medium">Expires:</span> {formatDate(shortenedUrlData.expires_at)}
                                </p>
                              )}
                              <div className="pt-3 flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setShowQRCode(true)}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-secondary-700 bg-secondary-100 hover:bg-secondary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500"
                                >
                                  <FiGrid className="mr-1" /> Generate QR Code
                                </button>
                                
                                <div className="flex-grow"></div>
                                
                                <Link
                                  to="/login"
                                  className="text-primary-600 hover:text-primary-800 font-medium"
                                >
                                  Sign in
                                </Link>
                                <span className="mx-2 text-primary-400">or</span>
                                <Link
                                  to="/register"
                                  className="text-primary-600 hover:text-primary-800 font-medium"
                                >
                                  create an account
                                </Link>
                                <span className="text-primary-600"> to track analytics</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </form>
                </div>
              </motion.div>
              
              <motion.div 
                variants={itemVariants}
                className="mt-10 flex justify-center space-x-6"
              >
                <Link
                  to="/register"
                  className="btn btn-primary px-8 py-3"
                >
                  Sign up for free
                </Link>
                <Link
                  to="/features"
                  className="btn btn-outline px-8 py-3"
                >
                  Learn more
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Features section */}
      <div className="py-16 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-display font-bold text-dark-900 tracking-tight sm:text-4xl">
              Why Choose URLBriefr?
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-dark-500 sm:mt-4">
              Our platform offers everything you need to manage and analyze your shortened links.
            </p>
          </div>
          
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col"
            >
              <div className="h-12 w-12 rounded-md bg-primary-500 text-white flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-display font-medium text-dark-900">Lightning Fast</h3>
              <p className="mt-2 text-base text-dark-500">
                Our optimized infrastructure ensures your links are redirected instantly, providing a seamless user experience.
              </p>
            </motion.div>
            
            {/* Feature 2 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col"
            >
              <div className="h-12 w-12 rounded-md bg-secondary-500 text-white flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-display font-medium text-dark-900">Detailed Analytics</h3>
              <p className="mt-2 text-base text-dark-500">
                Track clicks, geographic locations, devices, and more with our comprehensive analytics dashboard.
              </p>
            </motion.div>
            
            {/* Feature 3 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col"
            >
              <div className="h-12 w-12 rounded-md bg-accent-500 text-white flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-display font-medium text-dark-900">Secure & Reliable</h3>
              <p className="mt-2 text-base text-dark-500">
                Built with security in mind, URLBriefr ensures your links are safe, reliable, and always available.
              </p>
            </motion.div>
            
            {/* Feature 4 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col"
            >
              <div className="h-12 w-12 rounded-md bg-primary-500 text-white flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-lg font-display font-medium text-dark-900">Custom URLs</h3>
              <p className="mt-2 text-base text-dark-500">
                Create branded, memorable links with custom aliases that reflect your brand or content.
              </p>
            </motion.div>
            
            {/* Feature 5 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col"
            >
              <div className="h-12 w-12 rounded-md bg-secondary-500 text-white flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-display font-medium text-dark-900">Team Collaboration</h3>
              <p className="mt-2 text-base text-dark-500">
                Easily share and manage URLs with your team through role-based access control.
              </p>
            </motion.div>
            
            {/* Feature 6 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col"
            >
              <div className="h-12 w-12 rounded-md bg-accent-500 text-white flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-display font-medium text-dark-900">Expiration Control</h3>
              <p className="mt-2 text-base text-dark-500">
                Set expiration dates for your links to ensure they're only active when you need them to be.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* CTA section */}
      <div className="bg-primary-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-display font-bold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block text-primary-300">Create your account today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50"
              >
                Sign up for free
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-500"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRCode && shortenedUrlData && (
          <QRCodeModal 
            url={shortenedUrlData} 
            onClose={() => setShowQRCode(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomePage;