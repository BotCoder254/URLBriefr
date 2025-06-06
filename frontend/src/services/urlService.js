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
      
      // Ensure A/B testing variant weights are numbers
      if (urlData.is_ab_test && urlData.variants) {
        urlData.variants = urlData.variants.map(variant => ({
          ...variant,
          weight: Number(variant.weight)
        }));
        
        // Ensure variant destination URLs are properly formatted
        urlData.variants = urlData.variants.map(variant => {
          if (variant.destination_url && !variant.destination_url.match(/^https?:\/\//)) {
            return {
              ...variant,
              destination_url: `https://${variant.destination_url}`
            };
          }
          return variant;
        });
        
        // If first variant has no destination URL, use the original URL
        if (!urlData.variants[0].destination_url && urlData.original_url) {
          urlData.variants[0].destination_url = urlData.original_url;
        }
        
        // Ensure weights sum to 100
        const totalWeight = urlData.variants.reduce((sum, v) => sum + v.weight, 0);
        if (totalWeight !== 100) {
          // Adjust the weights proportionally
          const factor = 100 / totalWeight;
          urlData.variants = urlData.variants.map((v, i, arr) => {
            if (i === arr.length - 1) {
              // Make sure the last variant makes the total exactly 100
              const sumOthers = arr.slice(0, -1).reduce((sum, v) => sum + Math.round(v.weight * factor), 0);
              return { ...v, weight: 100 - sumOthers };
            }
            return { ...v, weight: Math.round(v.weight * factor) };
          });
        }
      }
      
      // For folder creation, ensure we're sending a minimal payload
      if (urlData.folder && urlData.title === 'Temporary URL for folder creation') {
        // Simplified payload for folder creation - avoid tag_ids completely
        const folderPayload = {
          original_url: urlData.original_url,
          title: urlData.title,
          folder: urlData.folder,
          is_active: false
        };
        
        console.log('Creating folder with payload:', folderPayload);
        const response = await api.post('/urls/', folderPayload);
        return response.data;
      }
      
      // Regular URL creation
      const response = await api.post('/urls/', urlData);
      return response.data;
    } catch (error) {
      console.error('Error in createUrl:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Get all URLs for the current user
  getUserUrls: async (filters = {}) => {
    // Convert filters to query parameters
    const params = new URLSearchParams();
    
    // Add filters to query params
    Object.keys(filters).forEach(key => {
      if (Array.isArray(filters[key])) {
        filters[key].forEach(value => {
          params.append(key, value);
        });
      } else if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    
    const queryString = params.toString();
    const url = queryString ? `/urls/?${queryString}` : '/urls/';
    
    const response = await api.get(url);
    return response.data;
  },
  
  // Get URL details by ID
  getUrlById: async (id) => {
    const response = await api.get(`/urls/${id}/`);
    return response.data;
  },
  
  // Update a URL
  updateUrl: async (id, urlData) => {
    // Ensure A/B testing variant weights are numbers if present
    if (urlData.is_ab_test && urlData.variants) {
      urlData.variants = urlData.variants.map(variant => ({
        ...variant,
        weight: Number(variant.weight)
      }));
      
      // Ensure variant destination URLs are properly formatted
      urlData.variants = urlData.variants.map(variant => {
        if (variant.destination_url && !variant.destination_url.match(/^https?:\/\//)) {
          return {
            ...variant,
            destination_url: `https://${variant.destination_url}`
          };
        }
        return variant;
      });
      
      // Ensure weights sum to 100
      const totalWeight = urlData.variants.reduce((sum, v) => sum + v.weight, 0);
      if (totalWeight !== 100) {
        // Adjust the weights proportionally
        const factor = 100 / totalWeight;
        urlData.variants = urlData.variants.map((v, i, arr) => {
          if (i === arr.length - 1) {
            // Make sure the last variant makes the total exactly 100
            const sumOthers = arr.slice(0, -1).reduce((sum, v) => sum + Math.round(v.weight * factor), 0);
            return { ...v, weight: 100 - sumOthers };
          }
          return { ...v, weight: Math.round(v.weight * factor) };
        });
      }
    }
    
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
    try {
      const response = await api.delete(`/urls/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting URL:', error.response?.data || error.message);
      throw error;
    }
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
  
  // Check URL status before redirect
  checkUrlStatus: async (shortCode) => {
    try {
      // The API will either redirect or return status information
      const response = await api.get(`/s/${shortCode}/`, {
        // Important: don't follow redirects, we need to handle them in the frontend
        maxRedirects: 0
      });
      
      // If we get a response, it means there's either an error or custom redirect settings
      return response.data;
    } catch (error) {
      if (error.response) {
        // If we got an error response from the server
        if (error.response.status === 404) {
          // URL is inactive or expired
          return error.response.data;
        }
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
      console.log('Setting expiration in days:', expirationValue);
    } else if (expirationType === 'date') {
      urlData = {
        expiration_type: 'date',
        expiration_date: expirationValue
      };
      console.log('Setting expiration to date:', expirationValue);
    } else {
      // Remove expiration
      urlData = {
        expiration_type: 'none',
        expires_at: null
      };
      console.log('Removing expiration date');
    }
    
    try {
      console.log('Sending expiration update request for URL ID:', id, 'with data:', urlData);
      const response = await api.patch(`/urls/${id}/`, urlData);
      console.log('Expiration update response:', response.data);
      
      // Verify that the response contains an expiration date if we set one
      if (expirationType !== 'none' && !response.data.expires_at) {
        console.warn('Warning: URL expiration was set but response has no expires_at field:', response.data);
      } else {
        console.log('New expiration date set:', response.data.expires_at);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating URL expiration:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Get QR code image URL for a shortened URL
  getQRCodeUrl: (shortCode) => {
    return `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/qr/${shortCode}`;
  },
  
  // Get QR code as base64 data for embedding in pages
  getQRCodeBase64: async (shortCode) => {
    try {
      const response = await api.get(`/qr/${shortCode}/?format=base64`);
      if (response && response.data && response.data.qr_code) {
        return response.data.qr_code;
      }
      console.error('Invalid QR code response:', response);
      return null;
    } catch (error) {
      console.error('Error getting QR code:', error.response?.data || error.message);
      return null;
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
  },
  
  // Get A/B testing statistics
  getABTestingStats: async (id) => {
    try {
      const response = await api.get(`/analytics/${id}/ab-testing/`);
      return response.data;
    } catch (error) {
      console.error('Error getting A/B testing stats:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Tag management
  
  // Get all tags for the current user
  getTags: async () => {
    try {
      const response = await api.get('/tags/');
      return response.data;
    } catch (error) {
      console.error('Error getting tags:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Create a new tag
  createTag: async (tagData) => {
    try {
      const response = await api.post('/tags/', tagData);
      return response.data;
    } catch (error) {
      console.error('Error creating tag:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Update a tag
  updateTag: async (id, tagData) => {
    try {
      const response = await api.patch(`/tags/${id}/`, tagData);
      return response.data;
    } catch (error) {
      console.error('Error updating tag:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Delete a tag
  deleteTag: async (id) => {
    try {
      const response = await api.delete(`/tags/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting tag:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Get all URLs with a specific tag
  getUrlsByTag: async (tagId) => {
    try {
      const response = await api.get(`/tags/${tagId}/urls/`);
      return response.data;
    } catch (error) {
      console.error('Error getting URLs by tag:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Get all folders used by the user
  getFolders: async () => {
    try {
      // Fix the endpoint path to correctly match the backend
      const response = await api.get('/urls/folders/');
      console.log('Folders API response:', response.data);
      
      // Ensure we always return an array, even if the response is null or undefined
      if (!response.data || !Array.isArray(response.data)) {
        console.warn('Folders API returned invalid data:', response.data);
        return [];
      }
      
      // Filter out any null, undefined, or empty string values
      const validFolders = response.data.filter(folder => folder && folder.trim() !== '');
      console.log('Valid folders after filtering:', validFolders);
      return validFolders;
    } catch (error) {
      // Detailed error logging
      console.error('Error getting folders:', error.response?.data || error.message);
      console.error('Error details:', error);
      
      // Return empty array instead of throwing to prevent UI errors
      return [];
    }
  },
  
  // Update URL with custom redirect page settings
  updateUrlRedirectSettings: async (urlId, redirectSettings) => {
    try {
      const response = await api.patch(`/shortener/urls/${urlId}/`, redirectSettings);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Track funnel step for analytics
  trackFunnelStep: async (shortCode, sessionId, step) => {
    try {
      const data = {
        short_code: shortCode,
        session_id: sessionId,
        step: step // 'reached_destination' or 'completed_action'
      };
      
      // Make the API call to update the funnel step
      const response = await api.post('/analytics/track-funnel/', data);
      return response.data;
    } catch (error) {
      console.error('Error tracking funnel step:', error.response?.data || error.message);
      // Don't throw error here to prevent breaking the user experience
      return null;
    }
  }
};

export default urlService; 