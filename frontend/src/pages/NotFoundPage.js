import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiAlertTriangle, FiHome } from 'react-icons/fi';

const NotFoundPage = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gray-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 mb-6"
        >
          <FiAlertTriangle className="h-12 w-12 text-red-600" />
        </motion.div>
        
        <h1 className="text-4xl font-display font-bold text-dark-900 mb-4">404</h1>
        <p className="text-xl font-display font-medium text-dark-700 mb-2">Page Not Found</p>
        <p className="text-dark-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <Link 
          to="/"
          className="btn btn-primary inline-flex items-center"
        >
          <FiHome className="mr-2" />
          Back to Home
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFoundPage; 