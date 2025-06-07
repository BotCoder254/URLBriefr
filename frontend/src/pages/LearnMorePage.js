import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiLink, FiPieChart, FiGitBranch, FiTag, FiClock, FiLock, FiCode, FiExternalLink, FiGithub } from 'react-icons/fi';
import useAuth from '../hooks/useAuth';

const LearnMorePage = () => {
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
                <span className="block">Learn More About</span>
                <span className="block text-primary-600">URLBriefr</span>
              </h1>
              
              <p className="mt-6 max-w-2xl mx-auto text-xl text-dark-500 dark:text-dark-300">
                Discover how URLBriefr can help you create, manage, and analyze shortened URLs.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Features in depth */}
      <div className="py-16 bg-white dark:bg-dark-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="lg:text-center mb-16">
              <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Features</h2>
              <p className="mt-2 text-3xl font-display leading-8 font-bold text-dark-900 dark:text-white sm:text-4xl">
                Powerful tools for link management
              </p>
            </div>
            
            {/* Feature 1 */}
            <div className="lg:flex lg:items-center lg:justify-between mb-20">
              <div className="lg:w-1/2 lg:pr-8">
                <h3 className="text-2xl font-display font-bold text-dark-900 dark:text-white">Custom URL Shortening</h3>
                <p className="mt-3 text-lg text-dark-500 dark:text-dark-300">
                  Create short, memorable links with custom slugs that reflect your brand or content. Set expiration dates to automatically deactivate links after a specific time period or date.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center text-dark-500 dark:text-dark-300">
                    <FiLink className="h-5 w-5 text-primary-500 mr-2" />
                    Custom slugs for branded links
                  </li>
                  <li className="flex items-center text-dark-500 dark:text-dark-300">
                    <FiClock className="h-5 w-5 text-primary-500 mr-2" />
                    Expiration settings by date or duration
                  </li>
                  <li className="flex items-center text-dark-500 dark:text-dark-300">
                    <FiTag className="h-5 w-5 text-primary-500 mr-2" />
                    Organize links with tags and titles
                  </li>
                </ul>
              </div>
              <div className="mt-8 lg:mt-0 lg:w-1/2 lg:pl-8">
                <div className="bg-gray-50 dark:bg-dark-800 p-6 rounded-lg shadow-md">
                  <div className="flex items-center justify-center h-16 w-16 rounded-md bg-primary-500 text-white mx-auto">
                    <FiLink className="h-8 w-8" />
                  </div>
                  <p className="mt-4 text-center text-dark-500 dark:text-dark-300">
                    Example: <span className="font-mono bg-gray-100 dark:bg-dark-700 px-2 py-1 rounded">urlbriefr.com/s/product-launch</span>
                  </p>
                </div>
              </div>
            </div>
            
            {/* Feature 2 */}
            <div className="lg:flex lg:items-center lg:justify-between mb-20">
              <div className="lg:w-1/2 lg:pr-8 order-last">
                <h3 className="text-2xl font-display font-bold text-dark-900 dark:text-white">Comprehensive Analytics</h3>
                <p className="mt-3 text-lg text-dark-500 dark:text-dark-300">
                  Track every click with detailed analytics. Understand your audience with data on devices, browsers, operating systems, and geographic locations.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center text-dark-500 dark:text-dark-300">
                    <FiPieChart className="h-5 w-5 text-primary-500 mr-2" />
                    Real-time click tracking
                  </li>
                  <li className="flex items-center text-dark-500 dark:text-dark-300">
                    <FiPieChart className="h-5 w-5 text-primary-500 mr-2" />
                    Audience demographics and device data
                  </li>
                  <li className="flex items-center text-dark-500 dark:text-dark-300">
                    <FiPieChart className="h-5 w-5 text-primary-500 mr-2" />
                    Geographic visualization with maps
                  </li>
                </ul>
              </div>
              <div className="mt-8 lg:mt-0 lg:w-1/2 lg:pl-8 order-first">
                <div className="bg-gray-50 dark:bg-dark-800 p-6 rounded-lg shadow-md">
                  <div className="flex items-center justify-center h-16 w-16 rounded-md bg-primary-500 text-white mx-auto">
                    <FiPieChart className="h-8 w-8" />
                  </div>
                  <p className="mt-4 text-center text-dark-500 dark:text-dark-300">
                    Gain insights with detailed click data and visual reports
                  </p>
                </div>
              </div>
            </div>
            
            {/* Feature 3 */}
            <div className="lg:flex lg:items-center lg:justify-between">
              <div className="lg:w-1/2 lg:pr-8">
                <h3 className="text-2xl font-display font-bold text-dark-900 dark:text-white">A/B Testing</h3>
                <p className="mt-3 text-lg text-dark-500 dark:text-dark-300">
                  Split traffic between multiple destination URLs to test different landing pages. Optimize your conversion rates by comparing performance between variants.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center text-dark-500 dark:text-dark-300">
                    <FiGitBranch className="h-5 w-5 text-primary-500 mr-2" />
                    Multiple URL variants with custom weights
                  </li>
                  <li className="flex items-center text-dark-500 dark:text-dark-300">
                    <FiGitBranch className="h-5 w-5 text-primary-500 mr-2" />
                    Comparative performance analytics
                  </li>
                  <li className="flex items-center text-dark-500 dark:text-dark-300">
                    <FiGitBranch className="h-5 w-5 text-primary-500 mr-2" />
                    Easy winner selection and implementation
                  </li>
                </ul>
              </div>
              <div className="mt-8 lg:mt-0 lg:w-1/2 lg:pl-8">
                <div className="bg-gray-50 dark:bg-dark-800 p-6 rounded-lg shadow-md">
                  <div className="flex items-center justify-center h-16 w-16 rounded-md bg-primary-500 text-white mx-auto">
                    <FiGitBranch className="h-8 w-8" />
                  </div>
                  <p className="mt-4 text-center text-dark-500 dark:text-dark-300">
                    Test multiple landing pages with a single short link
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* API Section */}
      <div className="py-16 bg-gray-50 dark:bg-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="lg:text-center mb-12">
              <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Developer API</h2>
              <p className="mt-2 text-3xl font-display leading-8 font-bold text-dark-900 dark:text-white sm:text-4xl">
                Integrate URL shortening into your applications
              </p>
              <p className="mt-4 max-w-2xl text-xl text-dark-500 dark:text-dark-300 lg:mx-auto">
                Our RESTful API makes it easy to create, manage, and analyze short URLs programmatically.
              </p>
            </div>
            
            <div className="bg-white dark:bg-dark-900 rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gray-100 dark:bg-dark-700 border-b border-gray-200 dark:border-dark-600">
                <div className="flex items-center">
                  <FiCode className="h-5 w-5 text-dark-500 dark:text-dark-300 mr-2" />
                  <span className="font-mono text-sm text-dark-700 dark:text-dark-200">API Example</span>
                </div>
              </div>
              <div className="p-6">
                <pre className="bg-gray-50 dark:bg-dark-800 p-4 rounded-md overflow-x-auto">
                  <code className="text-sm font-mono text-dark-800 dark:text-dark-200">
{`// Create a shortened URL
fetch('https://api.urlbriefr.com/api/urls/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    original_url: 'https://example.com/very/long/url/that/needs/shortening',
    custom_code: 'example-link',
    expiration_days: 30
  })
})
.then(response => response.json())
.then(data => console.log(data));`}
                  </code>
                </pre>
                <div className="mt-4">
                  <Link to="/docs" className="text-primary-600 hover:text-primary-700 dark:hover:text-primary-500 font-medium flex items-center">
                    View API documentation
                    <FiExternalLink className="ml-1 h-4 w-4" />
                  </Link>
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
              <span className="block">Ready to start shortening URLs?</span>
              <span className="block text-primary-200">Create your free account now.</span>
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
                <a 
                  href="https://github.com/BotCoder254/URLBriefr.git" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-outline border-white text-white hover:bg-primary-700"
                >
                  <FiGithub className="mr-2 h-5 w-5" />
                  View on GitHub
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LearnMorePage;
