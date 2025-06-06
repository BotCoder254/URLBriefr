import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiUser, FiLogOut, FiLink, FiPieChart, FiGitBranch, FiTag } from 'react-icons/fi';
import useAuth from '../../hooks/useAuth';

const Navbar = () => {
  const { isLoggedIn, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
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
  
  return (
    <nav className="bg-white shadow-sm">
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
                className="text-xl font-display font-bold text-dark-900 transition-colors"
              >
                URLBriefr
              </motion.span>
            </Link>
            
            {/* Desktop navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-6">
              <Link to="/" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-dark-700 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-500 transition-colors">
                Home
              </Link>
              
              {isLoggedIn && (
                <>
                  <Link to="/dashboard" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-dark-700 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-500 transition-colors">
                    Dashboard
                  </Link>
                  <Link to="/analytics" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-dark-700 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-500 transition-colors">
                    Analytics
                  </Link>
                  <Link to="/ab-testing" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-dark-700 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-500 transition-colors">
                    A/B Testing
                  </Link>
                  <Link to="/organize" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-dark-700 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-500 transition-colors">
                    Organize
                  </Link>
                </>
              )}
              
              <Link to="/pricing" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-dark-700 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-500 transition-colors">
                Pricing
              </Link>
              
              <Link to="/about" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-dark-700 hover:text-primary-600 border-b-2 border-transparent hover:border-primary-500 transition-colors">
                About
              </Link>
            </div>
          </div>
          
          {/* Right section: auth buttons or user menu */}
          <div className="flex items-center">
            {isLoggedIn ? (
              <div className="hidden md:ml-4 md:flex md:items-center">
                <div className="ml-3 relative">
                  <div>
                    <button 
                      type="button" 
                      className="flex items-center max-w-xs rounded-full text-sm focus:outline-none"
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                    >
                      <span className="mr-2 text-dark-700">{currentUser?.first_name || currentUser?.email}</span>
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
                        className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1"
                      >
                        <Link 
                          to="/profile" 
                          className="flex items-center px-4 py-2 text-sm text-dark-700 hover:bg-gray-100"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <FiUser className="mr-2" /> Profile
                        </Link>
                        
                        <Link 
                          to="/dashboard" 
                          className="flex items-center px-4 py-2 text-sm text-dark-700 hover:bg-gray-100"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <FiLink className="mr-2" /> My URLs
                        </Link>
                        
                        <Link 
                          to="/analytics" 
                          className="flex items-center px-4 py-2 text-sm text-dark-700 hover:bg-gray-100"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <FiPieChart className="mr-2" /> Analytics
                        </Link>
                        
                        <Link 
                          to="/ab-testing" 
                          className="flex items-center px-4 py-2 text-sm text-dark-700 hover:bg-gray-100"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <FiGitBranch className="mr-2" /> A/B Testing
                        </Link>
                        
                        <Link 
                          to="/organize" 
                          className="flex items-center px-4 py-2 text-sm text-dark-700 hover:bg-gray-100"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <FiTag className="mr-2" /> Organize
                        </Link>
                        
                        <button 
                          className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
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
                <Link to="/login" className="btn btn-outline">
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
                className="inline-flex items-center justify-center p-2 rounded-md text-dark-700 hover:text-dark-900 hover:bg-gray-100 focus:outline-none"
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
            className="md:hidden bg-white shadow-lg rounded-b-xl"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              <motion.div variants={itemVariants}>
                <Link 
                  to="/" 
                  className="block px-3 py-2 rounded-md text-base font-medium text-dark-700 hover:text-primary-600 hover:bg-gray-50"
                  onClick={() => setIsOpen(false)}
                >
                  Home
                </Link>
              </motion.div>
              
              {isLoggedIn && (
                <>
                  <motion.div variants={itemVariants}>
                    <Link 
                      to="/dashboard" 
                      className="block px-3 py-2 rounded-md text-base font-medium text-dark-700 hover:text-primary-600 hover:bg-gray-50"
                      onClick={() => setIsOpen(false)}
                    >
                      Dashboard
                    </Link>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <Link 
                      to="/analytics" 
                      className="block px-3 py-2 rounded-md text-base font-medium text-dark-700 hover:text-primary-600 hover:bg-gray-50"
                      onClick={() => setIsOpen(false)}
                    >
                      Analytics
                    </Link>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <Link 
                      to="/ab-testing" 
                      className="block px-3 py-2 rounded-md text-base font-medium text-dark-700 hover:text-primary-600 hover:bg-gray-50"
                      onClick={() => setIsOpen(false)}
                    >
                      A/B Testing
                    </Link>
                  </motion.div>
                </>
              )}
              
              <motion.div variants={itemVariants}>
                <Link 
                  to="/pricing" 
                  className="block px-3 py-2 rounded-md text-base font-medium text-dark-700 hover:text-primary-600 hover:bg-gray-50"
                  onClick={() => setIsOpen(false)}
                >
                  Pricing
                </Link>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <Link 
                  to="/about" 
                  className="block px-3 py-2 rounded-md text-base font-medium text-dark-700 hover:text-primary-600 hover:bg-gray-50"
                  onClick={() => setIsOpen(false)}
                >
                  About
                </Link>
              </motion.div>
              
              {isLoggedIn ? (
                <>
                  <motion.div variants={itemVariants}>
                    <Link 
                      to="/profile" 
                      className="block px-3 py-2 rounded-md text-base font-medium text-dark-700 hover:text-primary-600 hover:bg-gray-50"
                      onClick={() => setIsOpen(false)}
                    >
                      Profile
                    </Link>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <Link 
                      to="/organize" 
                      className="block px-3 py-2 rounded-md text-base font-medium text-dark-700 hover:text-primary-600 hover:bg-gray-50"
                      onClick={() => setIsOpen(false)}
                    >
                      Organize
                    </Link>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <button 
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-50"
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                    >
                      Logout
                    </button>
                  </motion.div>
                </>
              ) : (
                <div className="mt-4 flex flex-col space-y-2 px-3">
                  <motion.div variants={itemVariants}>
                    <Link 
                      to="/login" 
                      className="btn btn-outline w-full"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign in
                    </Link>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <Link 
                      to="/register" 
                      className="btn btn-primary w-full"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign up
                    </Link>
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar; 