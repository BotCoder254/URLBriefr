import React from 'react';
import { Link } from 'react-router-dom';
import { FiLink, FiGithub, FiTwitter } from 'react-icons/fi';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white dark:bg-dark-800 border-t border-gray-200 dark:border-dark-700">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Brand section */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center">
              <FiLink className="h-6 w-6 text-primary-600 mr-2" />
              <span className="text-lg font-display font-semibold text-dark-900 dark:text-white">URLBriefr</span>
            </Link>
            <p className="text-dark-600 dark:text-dark-300 text-sm">
              A modern URL shortener with comprehensive analytics and role-based access.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://github.com/BotCoder254/URLBriefr.git" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-dark-500 dark:text-dark-400 hover:text-dark-800 dark:hover:text-dark-200"
              >
                <FiGithub />
                <span className="sr-only">GitHub</span>
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-dark-500 dark:text-dark-400 hover:text-dark-800 dark:hover:text-dark-200"
              >
                <FiTwitter />
                <span className="sr-only">Twitter</span>
              </a>
            </div>
          </div>
          
          {/* Resources section */}
          <div className="mt-10 md:mt-0">
            <h3 className="text-sm font-semibold text-dark-500 dark:text-dark-300 tracking-wide uppercase">
              Resources
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/docs" className="text-base text-dark-600 dark:text-dark-300 hover:text-primary-600">
                  Documentation
                </Link>
              </li>
              {/* <li>
                <Link to="/support" className="text-base text-dark-600 dark:text-dark-300 hover:text-primary-600">
                  Support
                </Link>
              </li> */}
              <li>
                <Link to="/about" className="text-base text-dark-600 dark:text-dark-300 hover:text-primary-600">
                  About
                </Link>
              </li>
              <li>
                <Link to="/learn-more" className="text-base text-dark-600 dark:text-dark-300 hover:text-primary-600">
                  Learn More
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom section with legal links */}
        <div className="mt-12 border-t border-gray-200 dark:border-dark-700 pt-8 flex flex-col md:flex-row justify-between">
          <p className="text-sm text-dark-500 dark:text-dark-400">
            &copy; {currentYear} URLBriefr. All rights reserved.
          </p>
          
          <div className="mt-4 md:mt-0 flex space-x-6">
            <Link to="/privacy" className="text-sm text-dark-500 dark:text-dark-400 hover:text-primary-600">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-sm text-dark-500 dark:text-dark-400 hover:text-primary-600">
              Terms of Service
            </Link>
            <a 
              href="https://github.com/BotCoder254/URLBriefr.git" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-dark-500 dark:text-dark-400 hover:text-primary-600"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 