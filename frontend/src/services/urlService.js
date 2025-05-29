import api from './api';

// URL shortener service
const urlService = {
  // Create a new shortened URL
  createUrl: async (urlData) => {
    const response = await api.post('/urls/', urlData);
    return response.data;
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
};

export default urlService; 