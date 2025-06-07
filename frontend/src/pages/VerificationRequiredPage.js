import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiAlertCircle, FiSend } from 'react-icons/fi';
import useAuth from '../hooks/useAuth';

const VerificationRequiredPage = () => {
  const { verificationEmail, resendVerificationEmail, logout } = useAuth();
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const handleResendEmail = async () => {
    if (!verificationEmail) {
      setError('Email address not found. Please try logging in again.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await resendVerificationEmail(verificationEmail);
      setSuccess(true);
    } catch (error) {
      console.error('Error resending verification:', error);
      setError(
        error.response?.data?.error || 
        'Failed to resend verification email. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mb-8 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg mb-6"
        >
          <FiMail className="h-8 w-8 text-primary-600" />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-display font-bold text-dark-900 mb-2 text-center"
        >
          URLBriefr
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-dark-500 text-center"
        >
          Email Verification Required
        </motion.p>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-soft p-8 max-w-md w-full"
      >
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center">
            <FiAlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-display font-bold text-dark-900 mb-2">
            Verify Your Email to Continue
          </h2>
          <p className="text-dark-500">
            We've sent a verification email to <span className="font-semibold">{verificationEmail}</span>. 
            Please check your inbox and verify your email before accessing URLBriefr.
          </p>
        </div>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 text-red-700 p-3 rounded-lg flex items-start mb-6"
          >
            <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
        
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 text-green-700 p-3 rounded-lg flex items-start mb-6"
          >
            <FiSend className="mr-2 mt-0.5 flex-shrink-0" />
            <span>Verification email sent successfully! Please check your inbox.</span>
          </motion.div>
        )}
        
        <div className="space-y-3 mt-4">
          <button 
            onClick={handleResendEmail} 
            disabled={isSubmitting}
            className="btn btn-primary w-full py-2.5"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <FiSend className="mr-2" />
                Resend Verification Email
              </span>
            )}
          </button>
          
          <button 
            onClick={() => {
              logout();
              navigate('/login');
            }} 
            className="btn btn-outline w-full py-2.5"
          >
            Back to Login
          </button>
        </div>
        
        <div className="mt-6 text-center text-sm text-dark-500">
          <p>
            If you don't see the email in your inbox, check your spam folder or try a different email address.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default VerificationRequiredPage; 