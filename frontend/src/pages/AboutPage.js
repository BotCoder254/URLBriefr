import React from 'react';
import { motion } from 'framer-motion';
import { FiGithub, FiStar, FiGitBranch, FiCode, FiUsers, FiLink, FiExternalLink } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const AboutPage = () => {
  const { isLoggedIn } = useAuth();
  
  return (
    <div className="bg-white dark:bg-dark-900">
      {/* Hero section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-dark-800 dark:via-dark-900 dark:to-dark-800" />
        
        <div className="relative pt-16 pb-20 sm:pt-24 sm:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h1 className="text-4xl font-display font-bold text-dark-900 dark:text-white tracking-tight sm:text-5xl md:text-6xl">
                <span className="block">About</span>
                <span className="block text-primary-600">URLBriefr</span>
              </h1>
              
              <p className="mt-6 max-w-2xl mx-auto text-xl text-dark-500 dark:text-dark-300">
                A modern, open source URL shortener with powerful analytics and customization options.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Open Source section */}
      <div className="py-16 bg-white dark:bg-dark-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="lg:text-center">
              <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Open Source</h2>
              <p className="mt-2 text-3xl font-display leading-8 font-bold text-dark-900 dark:text-white sm:text-4xl">
                Built by the community, for the community
              </p>
              <p className="mt-4 max-w-2xl text-xl text-dark-500 dark:text-dark-300 lg:mx-auto">
                URLBriefr is an open source project available on GitHub. We welcome contributions from developers of all skill levels.
              </p>
            </div>
            
            <div className="mt-10">
              <a 
                href="https://github.com/BotCoder254/URLBriefr.git" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-dark-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex items-center">
                  <FiGithub className="h-10 w-10 text-dark-900 dark:text-white" />
                  <span className="ml-3 text-2xl font-display font-bold text-dark-900 dark:text-white">
                    BotCoder254/URLBriefr
                  </span>
                  <FiExternalLink className="ml-2 h-5 w-5 text-dark-500 dark:text-dark-300" />
                </div>
                <p className="mt-4 text-dark-500 dark:text-dark-300">
                  Star and fork the repository to contribute to the project
                </p>
              </a>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Features section */}
      <div className="py-16 bg-gray-50 dark:bg-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="lg:text-center">
              <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Features</h2>
              <p className="mt-2 text-3xl font-display leading-8 font-bold text-dark-900 dark:text-white sm:text-4xl">
                Everything you need in a URL shortener
              </p>
            </div>
            
            <div className="mt-10">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white dark:bg-dark-900 p-6 rounded-lg shadow">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    <FiLink className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-display font-medium text-dark-900 dark:text-white">Custom Short URLs</h3>
                  <p className="mt-2 text-base text-dark-500 dark:text-dark-300">
                    Create branded, memorable short links with custom slugs and expiration dates.
                  </p>
                </div>
                
                <div className="bg-white dark:bg-dark-900 p-6 rounded-lg shadow">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    <FiGitBranch className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-display font-medium text-dark-900 dark:text-white">A/B Testing</h3>
                  <p className="mt-2 text-base text-dark-500 dark:text-dark-300">
                    Split traffic between multiple destination URLs to test different landing pages.
                  </p>
                </div>
                
                <div className="bg-white dark:bg-dark-900 p-6 rounded-lg shadow">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    <FiUsers className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-display font-medium text-dark-900 dark:text-white">Comprehensive Analytics</h3>
                  <p className="mt-2 text-base text-dark-500 dark:text-dark-300">
                    Track clicks by device, browser, OS, and location with detailed reports.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* CTA section */}
      <div className="bg-primary-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h2 className="text-3xl font-display font-bold tracking-tight text-white sm:text-4xl">
              <span className="block">Ready to get started?</span>
              <span className="block text-primary-200">Start shortening URLs today.</span>
            </h2>
            <div className="mt-8 flex">
              {!isLoggedIn && (
                <div className="inline-flex rounded-md shadow">
                  <Link to="/register" className="btn bg-white text-primary-600 hover:bg-gray-50">
                    Sign up for free
                  </Link>
                </div>
              )}
              <div className={`${!isLoggedIn ? 'ml-3' : ''} inline-flex rounded-md shadow`}>
                <Link to="/learn-more" className="btn btn-outline border-white text-white hover:bg-primary-700">
                  Learn more
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage; 