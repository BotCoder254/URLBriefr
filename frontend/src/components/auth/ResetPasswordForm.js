import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import authService from '../../services/authService';

const ResetPasswordForm = () => {
  const { uidb64, token } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    password: '',
    password2: '',
    token: token || '',
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetError, setResetError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    // Confirm password validation
    if (formData.password !== formData.password2) {
      newErrors.password2 = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setResetError('');
    
    try {
      await authService.resetPassword(uidb64, token, formData);
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Password reset error:', error);
      setResetError(
        error.response?.data?.error || 
        error.response?.data?.password?.[0] ||
        'Failed to reset password. The link may have expired.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!uidb64 || !token) {
    return (
      <div className="bg-white rounded-2xl shadow-soft p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 text-red-700 p-3 rounded-lg"
          >
            <FiAlertCircle className="mx-auto mb-2 h-8 w-8" />
            <h3 className="text-lg font-medium">Invalid Reset Link</h3>
            <p className="mt-2">The password reset link is invalid or has expired.</p>
          </motion.div>
          
          <div className="mt-6">
            <Link to="/forgot-password" className="btn btn-primary w-full">
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-soft p-8 max-w-md w-full">
      <div className="text-center mb-8">
        <motion.h2 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-display font-bold text-dark-900"
        >
          Reset Your Password
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-dark-500 mt-2"
        >
          Enter your new password below
        </motion.p>
      </div>
      
      {resetError && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 text-red-700 p-3 rounded-lg flex items-start mb-6"
        >
          <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
          <span>{resetError}</span>
        </motion.div>
      )}
      
      {success ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-accent-50 text-accent-800 p-6 rounded-xl mb-6 text-center"
        >
          <FiCheckCircle className="mx-auto mb-4 h-12 w-12 text-accent-600" />
          <h3 className="text-lg font-medium mb-2">Password Reset Successfully</h3>
          <p className="mb-4">
            Your password has been updated. You will be redirected to the login page in a few seconds.
          </p>
          <div className="mt-6">
            <Link 
              to="/login" 
              className="btn btn-primary w-full"
            >
              Sign In Now
            </Link>
          </div>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="label">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-dark-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                className={`input pl-10 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="••••••••"
              />
            </div>
            {errors.password ? (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            ) : (
              <p className="mt-1 text-xs text-dark-500">
                Password must be at least 8 characters long
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="password2" className="label">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-dark-400" />
              </div>
              <input
                id="password2"
                name="password2"
                type="password"
                autoComplete="new-password"
                value={formData.password2}
                onChange={handleChange}
                className={`input pl-10 ${errors.password2 ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="••••••••"
              />
            </div>
            {errors.password2 && (
              <p className="mt-1 text-sm text-red-600">{errors.password2}</p>
            )}
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
                  Resetting password...
                </span>
              ) : (
                'Reset Password'
              )}
            </button>
          </div>
        </form>
      )}
      
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
    </div>
  );
};

export default ResetPasswordForm; 