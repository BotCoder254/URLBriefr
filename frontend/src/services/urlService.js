import api from './api';

// URL shortener service
const urlService = {
  // Create a new shortened URL
  createUrl: async (urlData) => {
    try {
      // Ensure original_url is properly formatted
      if (urlData.original_url && !urlData.original_url.match(/^https?:\/\//)) {
        urlData.original_url = `https://${urlData.original_url}`;
      }
      
      const response = await api.post('/urls/', urlData);
      return response.data;
    } catch (error) {
      console.error('Error in createUrl:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Get all URLs for the current user
  getUserUrls: async () => {
    const response = await api.get('/urls/');
    return response.data;
  },
  
  // Get URL details by ID
  getUrlById: async (id) => {
    const response = await api.get(`/urls/${id}/`);
    return response.data;
  },
  
  // Update a URL
  updateUrl: async (id, urlData) => {
    const response = await api.patch(`/urls/${id}/`, urlData);
    return response.data;
  },
  
  // Toggle URL active status (activate/deactivate)
  toggleUrlStatus: async (id, isActive) => {
    const response = await api.patch(`/urls/${id}/`, { is_active: isActive });
    return response.data;
  },
  
  // Delete a URL
  deleteUrl: async (id) => {
    const response = await api.delete(`/urls/${id}/`);
    return response.data;
  },
  
  // Get URL statistics
  getUrlStats: async (id) => {
    const response = await api.get(`/analytics/${id}/`);
    return response.data;
  },
  
  // Get dashboard stats
  getDashboardStats: async () => {
    const response = await api.get('/analytics/dashboard/');
    return response.data;
  },
  
  // Check URL status before redirecting
  checkUrlStatus: async (shortCode) => {
    try {
      // This will try to redirect but will return error info if inactive/expired
      const response = await api.get(`/s/${shortCode}/`, { validateStatus: false });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return error.response.data;
      }
      throw error;
    }
  },
  
  // Set URL expiration
  setUrlExpiration: async (id, expirationType, expirationValue) => {
    let urlData = {};
    
    if (expirationType === 'days') {
      urlData = {
        expiration_type: 'days',
        expiration_days: expirationValue
      };
    } else if (expirationType === 'date') {
      urlData = {
        expiration_type: 'date',
        expiration_date: expirationValue
      };
    } else {
      // Remove expiration
      urlData = {
        expiration_type: 'none',
        expires_at: null
      };
    }
    
    const response = await api.patch(`/urls/${id}/`, urlData);
    return response.data;
  }
};

export default urlService; 