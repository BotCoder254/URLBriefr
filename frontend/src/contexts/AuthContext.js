import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

// Create the Auth Context
export const AuthContext = createContext();

// Auth Context Provider Component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
      return result;
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
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 