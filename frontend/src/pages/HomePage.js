import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLink, FiCopy, FiArrowRight, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import urlService from '../services/urlService';

const HomePage = () => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [shortenedUrl, setShortenedUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!originalUrl) {
      setError('Please enter a URL');
      return;
    }
    
    if (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://')) {
      setOriginalUrl(`https://${originalUrl}`);
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await urlService.createUrl({ original_url: originalUrl });
      setShortenedUrl(response.full_short_url);
    } catch (error) {
      console.error('Error shortening URL:', error);
      setError(error.response?.data?.original_url?.[0] || 'Failed to shorten URL. Please try again.');
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
                        className="mt-4 p-3 bg-primary-50 rounded-lg flex items-center justify-between"
                      >
                        <span className="text-primary-800 font-medium truncate mr-2">
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
    </div>
  );
};

export default HomePage; 