import api from './api';

// Authentication service
const authService = {
  // Register a new user
  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },
  
  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login/', credentials);
    
    // Check if email verification is required
    if (response.data.email_verification_required) {
      return {
        ...response.data,
        requiresVerification: true
      };
    }
    
    // Store tokens and user info in localStorage
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      // Store user info except tokens
      const { access, refresh, ...user } = response.data;
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    return response.data;
  },
  
  // Logout user
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
  
  // Get current user info
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },
  
  // Check if user is logged in
  isLoggedIn: () => {
    return !!localStorage.getItem('access_token');
  },
  
  // Get user role
  getUserRole: () => {
    const user = authService.getCurrentUser();
    return user ? user.role : null;
  },
  
  // Request password reset
  requestPasswordReset: async (email) => {
    const response = await api.post('/auth/password-reset/', { email });
    return response.data;
  },
  
  // Confirm password reset
  resetPassword: async (uidb64, token, passwords) => {
    const response = await api.post(`/auth/password-reset/${uidb64}/${token}/`, passwords);
    return response.data;
  },
  
  // Change password (for logged in users)
  changePassword: async (passwordData) => {
    const response = await api.post('/auth/password-change/', passwordData);
    return response.data;
  },
  
  // Delete user account
  deleteAccount: async () => {
    const response = await api.delete('/auth/account/delete/');
    // Clear all local storage if successful
    if (response.status === 204) {
      authService.logout();
    }
    return response;
  },
  
  // Get detailed user profile (including IP and other metadata)
  getFullProfile: async () => {
    const response = await api.get('/auth/me/');
    return response.data;
  },
  
  // Update user profile
  updateProfile: async (userData) => {
    const response = await api.patch('/auth/me/', userData);
    
    // Update stored user data
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...response.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    return response.data;
  },
  
  // Verify email
  verifyEmail: async (token, email) => {
    const response = await api.post(`/auth/verify-email/${token}/${email}/`);
    return response.data;
  },
  
  // Resend verification email
  resendVerificationEmail: async (email) => {
    const response = await api.post('/auth/resend-verification-email/', { email });
    return response.data;
  },
  
  // Check if user email is verified
  isEmailVerified: () => {
    const user = authService.getCurrentUser();
    return user ? user.email_verified : false;
  },
};

export default authService; 