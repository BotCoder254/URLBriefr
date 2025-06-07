import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

// Create the Auth Context
export const AuthContext = createContext();

// Auth Context Provider Component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  
  // Initialize auth state on component mount
  useEffect(() => {
    const initAuth = () => {
      try {
        const user = authService.getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.error('Failed to initialize auth state:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);
  
  // Login function
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await authService.login(credentials);
      
      // Check if email verification is required
      if (data.requiresVerification) {
        setRequiresVerification(true);
        setVerificationEmail(credentials.email);
        setLoading(false);
        return { requiresVerification: true, email: credentials.email };
      }
      
      const { access, refresh, ...user } = data;
      setCurrentUser(user);
      return user;
    } catch (err) {
      const message = err.response?.data?.detail || 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.register(userData);
      // After registration, set verification pending state
      setRequiresVerification(true);
      setVerificationEmail(userData.email);
      return { ...result, requiresVerification: true, email: userData.email };
    } catch (err) {
      const message = 
        err.response?.data?.email?.[0] || 
        err.response?.data?.password?.[0] ||
        'Registration failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    setRequiresVerification(false);
    setVerificationEmail('');
  };
  
  // Update profile function
  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedUser = await authService.updateProfile(userData);
      setCurrentUser(updatedUser);
      return updatedUser;
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to update profile';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Verify email function
  const verifyEmail = async (token, email) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.verifyEmail(token, email);
      setRequiresVerification(false);
      return result;
    } catch (err) {
      const message = err.response?.data?.error || 'Email verification failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Resend verification email function
  const resendVerificationEmail = async (email) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.resendVerificationEmail(email || verificationEmail);
      return result;
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to resend verification email';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Context value
  const value = {
    currentUser,
    isLoggedIn: !!currentUser,
    userRole: currentUser?.role,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    requiresVerification,
    verificationEmail,
    verifyEmail,
    resendVerificationEmail,
    isEmailVerified: currentUser?.email_verified || false,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 