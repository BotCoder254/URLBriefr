import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiUser, FiLogOut, FiLink, FiPieChart, FiGitBranch, FiTag, FiShield, FiMoon, FiSun, FiStar, FiAlertTriangle } from 'react-icons/fi';
import useAuth from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';

const Navbar = () => {
  const { isLoggedIn, currentUser, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsProfileOpen(false);
  };
  
  // Animation variants
  const menuVariants = {
    closed: { opacity: 0, x: -20 },
    open: { opacity: 1, x: 0 }
  };
  
  const itemVariants = {
    closed: { opacity: 0, x: -10 },
    open: { opacity: 1, x: 0 }
  };
  
  const dropdownVariants = {
    closed: { opacity: 0, scale: 0.95 },
    open: { opacity: 1, scale: 1 }
  };
  
  return (
    <nav className="bg-white dark:bg-dark-800 shadow-sm dark:shadow-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <motion.div 
                initial={{ rotate: -10 }}
                animate={{ rotate: 0 }}
                whileHover={{ scale: 1.1, rotate: -5 }}
                className="h-8 w-8 mr-2"
              >
                <FiLink className="h-8 w-8 text-primary-600" />
              </motion.div>
              <motion.span 
                whileHover={{ color: '#0ea5e9' }}
                className="text-xl font-display font-bold text-dark-900 dark:text-white transition-colors"
              >
                URLBriefr
              </motion.span>
            </Link>
            
            {/* Desktop navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-6">
              <Link to="/" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-dark-700 dark:text-dark-200 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-500 transition-colors">
                Home
              </Link>
              
              <Link to="/tempmail" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-dark-700 dark:text-dark-200 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-500 transition-colors">
                Temp Email
                <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">BETA</span>
              </Link>
              
              {isLoggedIn && (
                <>
                  <Link to="/dashboard" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-dark-700 dark:text-dark-200 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-500 transition-colors">
                    Dashboard
                  </Link>
                  <Link to="/analytics" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-dark-700 dark:text-dark-200 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-500 transition-colors">
                    Analytics
                  </Link>
                  <Link to="/ab-testing" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-dark-700 dark:text-dark-200 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-500 transition-colors">
                    A/B Testing
                  </Link>
                  <Link to="/organize" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-dark-700 dark:text-dark-200 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-500 transition-colors">
                    Organize
                  </Link>
                  <div className="relative">
                    <button 
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-dark-700 dark:text-dark-200 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-500 transition-colors"
                      onClick={() => setIsSecurityOpen(!isSecurityOpen)}
                    >
                      <FiShield className="mr-1" /> Security
                    </button>
                    
                    <AnimatePresence>
                      {isSecurityOpen && (
                        <motion.div 
                          initial="closed"
                          animate="open"
                          exit="closed"
                          variants={dropdownVariants}
                          className="absolute left-0 mt-2 w-48 rounded-xl shadow-lg bg-white dark:bg-dark-800 ring-1 ring-black ring-opacity-5 dark:ring-dark-700 py-1 z-10"
                        >
                          <Link 
                            to="/security" 
                            className="flex items-center px-4 py-2 text-sm text-dark-700 dark:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-700"
                            onClick={() => setIsSecurityOpen(false)}
                          >
                            <FiShield className="mr-2" /> Security Overview
                          </Link>
                          <Link 
                            to="/security/malware" 
                            className="flex items-center px-4 py-2 text-sm text-dark-700 dark:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-700"
                            onClick={() => setIsSecurityOpen(false)}
                          >
                            <FiAlertTriangle className="mr-2" /> Malware Detection
                          </Link>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
              
              {/* <Link to="/pricing" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-dark-700 dark:text-dark-200 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-500 transition-colors">
                Pricing
              </Link> */}
              
              <Link to="/about" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-dark-700 dark:text-dark-200 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-500 transition-colors">
                About
              </Link>
            </div>
          </div>
          
          {/* Right section: auth buttons or user menu */}
          <div className="flex items-center">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-dark-700 dark:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-700 mr-2"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <FiSun className="h-5 w-5" />
              ) : (
                <FiMoon className="h-5 w-5" />
              )}
            </button>

            {isLoggedIn ? (
              <div className="hidden md:ml-4 md:flex md:items-center">
                <div className="ml-3 relative">
                  <div>
                    <button 
                      type="button" 
                      className="flex items-center max-w-xs rounded-full text-sm focus:outline-none"
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                    >
                      <span className="mr-2 text-dark-700 dark:text-dark-200">{currentUser?.first_name || currentUser?.email}</span>
                      <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white">
                        {currentUser?.first_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white dark:bg-dark-800 ring-1 ring-black ring-opacity-5 dark:ring-dark-700 py-1"
                      >
                        <Link 
                          to="/profile" 
                          className="flex items-center px-4 py-2 text-sm text-dark-700 dark:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-700"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <FiUser className="mr-2" /> Profile
                        </Link>
                        
                        <Link 
                          to="/dashboard" 
                          className="flex items-center px-4 py-2 text-sm text-dark-700 dark:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-700"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <FiLink className="mr-2" /> My URLs
                        </Link>
                        
                        <Link 
                          to="/favorites" 
                          className="flex items-center px-4 py-2 text-sm text-dark-700 dark:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-700"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <FiStar className="mr-2" /> Favorites
                        </Link>
                        
                        <Link 
                          to="/analytics" 
                          className="flex items-center px-4 py-2 text-sm text-dark-700 dark:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-700"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <FiPieChart className="mr-2" /> Analytics
                        </Link>
                        
                        <Link 
                          to="/ab-testing" 
                          className="flex items-center px-4 py-2 text-sm text-dark-700 dark:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-700"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <FiGitBranch className="mr-2" /> A/B Testing
                        </Link>
                        
                        <Link 
                          to="/organize" 
                          className="flex items-center px-4 py-2 text-sm text-dark-700 dark:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-700"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <FiTag className="mr-2" /> Organize
                        </Link>
                        
                        <Link 
                          to="/security" 
                          className="flex items-center px-4 py-2 text-sm text-dark-700 dark:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-700"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <FiShield className="mr-2" /> Security
                        </Link>
                        
                        <Link 
                          to="/security/malware" 
                          className="flex items-center px-4 py-2 text-sm text-dark-700 dark:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-700"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <FiAlertTriangle className="mr-2" /> Malware Detection
                        </Link>
                        
                        <button 
                          className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-dark-700"
                          onClick={handleLogout}
                        >
                          <FiLogOut className="mr-2" /> Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex md:items-center md:space-x-2">
                <Link to="/login" className="btn btn-outline dark:text-white">
                  Sign in
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Sign up
                </Link>
              </div>
            )}
            
            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-dark-700 dark:text-dark-200 hover:text-dark-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-700 focus:outline-none"
              >
                <span className="sr-only">{isOpen ? 'Close menu' : 'Open menu'}</span>
                {isOpen ? (
                  <FiX className="block h-6 w-6" />
                ) : (
                  <FiMenu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className="md:hidden bg-white dark:bg-dark-800 shadow-md"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
                <Link 
                  to="/" 
                  className="block px-3 py-2 rounded-md text-base font-medium text-dark-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-700"
                  onClick={() => setIsOpen(false)}
                >
                  Home
                </Link>
                
                <Link 
                  to="/tempmail" 
                  className="block px-3 py-2 rounded-md text-base font-medium text-dark-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-700"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center">
                    Temp Email
                    <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">BETA</span>
                  </div>
                </Link>
              
              {isLoggedIn ? (
                <>
                    <Link 
                      to="/dashboard" 
                      className="block px-3 py-2 rounded-md text-base font-medium text-dark-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-700"
                      onClick={() => setIsOpen(false)}
                    >
                      Dashboard
                    </Link>
                  
                    <Link 
                      to="/analytics" 
                      className="block px-3 py-2 rounded-md text-base font-medium text-dark-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-700"
                      onClick={() => setIsOpen(false)}
                    >
                      Analytics
                    </Link>
                  
                    <Link 
                      to="/ab-testing" 
                      className="block px-3 py-2 rounded-md text-base font-medium text-dark-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-700"
                      onClick={() => setIsOpen(false)}
                    >
                      A/B Testing
                    </Link>
              
                    <Link 
                      to="/organize"
                      className="block px-3 py-2 rounded-md text-base font-medium text-dark-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-700"
                      onClick={() => setIsOpen(false)}
                    >
                      Organize
                    </Link>
              
                    <Link 
                      to="/security"
                      className="block px-3 py-2 rounded-md text-base font-medium text-dark-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-700"
                      onClick={() => setIsOpen(false)}
                    >
                      <FiShield className="inline-block mr-1" /> Security Overview
                    </Link>
                
                    <Link 
                      to="/security/malware"
                      className="block px-3 py-2 rounded-md text-base font-medium text-dark-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-700 pl-8"
                      onClick={() => setIsOpen(false)}
                    >
                      <FiAlertTriangle className="inline-block mr-1" /> Malware Detection
                    </Link>
              
                    <Link 
                      to="/profile" 
                      className="block px-3 py-2 rounded-md text-base font-medium text-dark-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-700"
                      onClick={() => setIsOpen(false)}
                    >
                      Profile
                    </Link>
                  
                    <button 
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-100 dark:hover:bg-dark-700"
                      onClick={() => { setIsOpen(false); handleLogout(); }}
                    >
                      Logout
                    </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/pricing"
                    className="block px-3 py-2 rounded-md text-base font-medium text-dark-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-700"
                    onClick={() => setIsOpen(false)}
                  >
                    Pricing
                  </Link>
                  
                  <Link 
                    to="/about"
                    className="block px-3 py-2 rounded-md text-base font-medium text-dark-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-700"
                    onClick={() => setIsOpen(false)}
                  >
                    About
                  </Link>
                  
                  <div className="pt-4 pb-3 border-t border-gray-200 dark:border-dark-700">
                    <div className="flex items-center px-4">
                      <div className="flex-shrink-0">
                        <Link 
                          to="/login" 
                          className="block w-full px-4 py-2 text-center font-medium rounded-md text-dark-900 dark:text-white bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 mb-2"
                          onClick={() => setIsOpen(false)}
                        >
                          Sign in
                        </Link>
                        <Link 
                          to="/register" 
                          className="block w-full px-4 py-2 text-center font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                          onClick={() => setIsOpen(false)}
                        >
                          Sign up
                        </Link>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar; 