import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiCheck, FiAlertCircle } from 'react-icons/fi';
import useAuth from '../hooks/useAuth';

const EmailVerificationPage = () => {
  const { token, email } = useParams();
  const { verifyEmail, loading } = useAuth();
  const navigate = useNavigate();
  
  const [verificationStatus, setVerificationStatus] = useState('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  
  useEffect(() => {
    const verifyUserEmail = async () => {
      try {
        await verifyEmail(token, email);
        setVerificationStatus('success');
      } catch (error) {
        console.error('Verification error:', error);
        setVerificationStatus('error');
        setErrorMessage(
          error.response?.data?.error || 
          'Failed to verify your email. Please try again.'
        );
      }
    };
    
    if (token && email) {
      verifyUserEmail();
    }
  }, [token, email, verifyEmail]);
  
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
          Email Verification
        </motion.p>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-soft p-8 max-w-md w-full"
      >
        <div className="text-center mb-6">
          {verificationStatus === 'verifying' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary-500 border-t-transparent"></div>
              </div>
              <h2 className="text-2xl font-display font-bold text-dark-900 mb-2">
                Verifying Your Email
              </h2>
              <p className="text-dark-500">
                Please wait while we verify your email address...
              </p>
            </>
          )}
          
          {verificationStatus === 'success' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <FiCheck className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-display font-bold text-dark-900 mb-2">
                Email Verified Successfully!
              </h2>
              <p className="text-dark-500 mb-6">
                Your email has been verified. You can now log in to your account.
              </p>
              <button 
                onClick={() => navigate('/login')} 
                className="btn btn-primary w-full py-2.5"
              >
                Log In
              </button>
            </>
          )}
          
          {verificationStatus === 'error' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                  <FiAlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <h2 className="text-2xl font-display font-bold text-dark-900 mb-2">
                Verification Failed
              </h2>
              <p className="text-red-500 mb-6">
                {errorMessage}
              </p>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/resend-verification')} 
                  className="btn btn-primary w-full py-2.5"
                >
                  Request New Verification Link
                </button>
                <button 
                  onClick={() => navigate('/login')} 
                  className="btn btn-outline w-full py-2.5"
                >
                  Back to Login
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default EmailVerificationPage; 