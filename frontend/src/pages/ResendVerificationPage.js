import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiAlertCircle, FiSend } from 'react-icons/fi';
import useAuth from '../hooks/useAuth';

const ResendVerificationPage = () => {
  const { resendVerificationEmail, verificationEmail, loading } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState(verificationEmail || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await resendVerificationEmail(email);
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
          Resend Verification Email
        </motion.p>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-soft p-8 max-w-md w-full"
      >
        {!success ? (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-display font-bold text-dark-900 mb-2">
                Verify Your Email
              </h2>
              <p className="text-dark-500">
                Enter your email address below to receive a new verification link
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
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="label">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="text-dark-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-10"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
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
                      Send Verification Email
                    </span>
                  )}
                </button>
              </div>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-dark-500">
                Remember your password?{' '}
                <Link 
                  to="/login" 
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <FiMail className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-display font-bold text-dark-900 mb-2">
              Verification Email Sent
            </h2>
            <p className="text-dark-500 mb-6">
              We've sent a verification email to <span className="font-semibold">{email}</span>. Please check your inbox and follow the instructions to verify your account.
            </p>
            <p className="text-dark-500 mb-6">
              If you don't see the email, check your spam folder or try again.
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/login')} 
                className="btn btn-primary w-full py-2.5"
              >
                Return to Login
              </button>
              <button 
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                }} 
                className="btn btn-outline w-full py-2.5"
              >
                Send to Another Email
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ResendVerificationPage; 