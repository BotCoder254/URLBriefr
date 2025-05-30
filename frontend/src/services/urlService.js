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
  },
  
  // Get QR code image URL for a shortened URL
  getQRCodeUrl: (shortCode) => {
    return `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/qr/${shortCode}`;
  },
  
  // Get QR code as base64 data for embedding in pages
  getQRCodeBase64: async (shortCode) => {
    try {
      const response = await api.get(`/qr/${shortCode}/?format=base64`);
      return response.data.qr_code;
    } catch (error) {
      console.error('Error getting QR code:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Download QR code as image file
  downloadQRCode: async (shortCode, fileName = null) => {
    try {
      // Create a direct link to download the QR code
      const qrCodeUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/qr/${shortCode}/`;
      
      // Create an anchor element and simulate a click to download
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = fileName || `qr-${shortCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    } catch (error) {
      console.error('Error downloading QR code:', error);
      throw error;
    }
  }
};

export default urlService; 