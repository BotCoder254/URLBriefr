import api from './api';

// URL shortener service
const urlService = {
  // Create a new shortened URL
  createUrl: async (urlData) => {
    try {
      console.log('Creating URL with data:', urlData);
      
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
      
      // Fix for tag_ids - ensure it's an array of IDs, not objects
      if (urlData.tag_ids && Array.isArray(urlData.tag_ids)) {
        // Convert tag objects to just their IDs
        urlData.tag_ids = urlData.tag_ids.map(tag => {
          // If it's already a number or string ID, return as is
          if (typeof tag === 'number' || typeof tag === 'string') {
            return tag;
          }
          // If it's an object with an id property, return just the id
          else if (tag && typeof tag === 'object' && 'id' in tag) {
            return tag.id;
          }
          // Otherwise return null (which will be filtered out)
          return null;
        }).filter(id => id !== null);
      }
      
      // Ensure expiration settings are properly set
      if (urlData.expiration_type === 'days' && urlData.expiration_days) {
        // Make sure expiration_days is a number
        urlData.expiration_days = Number(urlData.expiration_days);
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
      
      // Sanitize the URL data to match backend expectations
      const cleanedData = { ...urlData };
      
      // Convert date objects to ISO string for serialization if needed
      if (cleanedData.expiration_date instanceof Date) {
        cleanedData.expiration_date = cleanedData.expiration_date.toISOString();
      }
      
      // Make sure all properties are valid types
      Object.keys(cleanedData).forEach(key => {
        // Convert undefined values to null to avoid serialization issues
        if (cleanedData[key] === undefined) {
          cleanedData[key] = null;
        }
      });
      
      console.log('Sending URL creation request with sanitized data:', cleanedData);
      
      // Regular URL creation
      const response = await api.post('/urls/', cleanedData);
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
  
  // Clone a URL with optional modifications
  cloneUrl: async (id, modifications = {}) => {
    try {
      const response = await api.post(`/urls/${id}/clone/`, modifications);
      return response.data;
    } catch (error) {
      console.error('Error cloning URL:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // IP Restriction management
  
  // Get all IP restrictions for the current user
  getIpRestrictions: async () => {
    try {
      const response = await api.get('/ip-restrictions/');
      return response.data;
    } catch (error) {
      console.error('Error getting IP restrictions:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Create a new IP restriction
  createIpRestriction: async (restrictionData) => {
    try {
      const response = await api.post('/ip-restrictions/', restrictionData);
      return response.data;
    } catch (error) {
      console.error('Error creating IP restriction:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Update an IP restriction
  updateIpRestriction: async (id, restrictionData) => {
    try {
      const response = await api.patch(`/ip-restrictions/${id}/`, restrictionData);
      return response.data;
    } catch (error) {
      console.error('Error updating IP restriction:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Delete an IP restriction
  deleteIpRestriction: async (id) => {
    try {
      const response = await api.delete(`/ip-restrictions/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting IP restriction:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Manage IP restrictions for a URL
  addIpRestrictionToUrl: async (urlId, restrictionIds) => {
    try {
      // Get current URL data first
      const urlData = await this.getUrlById(urlId);
      
      // Enable IP restrictions if not already enabled
      const updatedData = {
        enable_ip_restrictions: true,
        ip_restriction_ids: restrictionIds
      };
      
      const response = await api.patch(`/urls/${urlId}/`, updatedData);
      return response.data;
    } catch (error) {
      console.error('Error adding IP restrictions to URL:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Security - Tamper-Proof Links
  
  // Enable tamper-proof protection for a URL
  enableTamperProof: async (urlId) => {
    try {
      const response = await api.patch(`/urls/${urlId}/`, {
        spoofing_protection: true
      });
      
      // Generate the integrity hash if needed
      if (!response.data.integrity_hash) {
        await api.post(`/urls/${urlId}/regenerate_integrity_hash/`);
        // Get fresh URL data with the hash
        return await urlService.getUrlById(urlId);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error enabling tamper-proof protection:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Disable tamper-proof protection for a URL
  disableTamperProof: async (urlId) => {
    try {
      const response = await api.patch(`/urls/${urlId}/`, {
        spoofing_protection: false
      });
      return response.data;
    } catch (error) {
      console.error('Error disabling tamper-proof protection:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Regenerate the integrity hash for a URL
  regenerateIntegrityHash: async (urlId) => {
    try {
      const response = await api.post(`/urls/${urlId}/regenerate_integrity_hash/`);
      return response.data;
    } catch (error) {
      console.error('Error regenerating integrity hash:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Verify the integrity of a URL
  verifyUrlIntegrity: async (urlId) => {
    try {
      const response = await api.get(`/urls/${urlId}/verify_integrity/`);
      return response.data;
    } catch (error) {
      console.error('Error verifying URL integrity:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Advanced URL filtering
  
  // Get all URLs with security features enabled
  getSecureUrls: async () => {
    try {
      const response = await api.get('/urls/?has_security=true');
      return response.data;
    } catch (error) {
      console.error('Error getting secure URLs:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Get all cloned URLs
  getClonedUrls: async () => {
    try {
      const response = await api.get('/urls/?cloned=true');
      return response.data;
    } catch (error) {
      console.error('Error getting cloned URLs:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Get all original (non-cloned) URLs
  getOriginalUrls: async () => {
    try {
      const response = await api.get('/urls/?cloned=false');
      return response.data;
    } catch (error) {
      console.error('Error getting original URLs:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Set URL expiration
  setUrlExpiration: async (id, expirationType, expirationValue) => {
    try {
      console.log(`Starting URL expiration update for ID ${id}, type: ${expirationType}, value:`, expirationValue);
      
      // Prepare simple data for the specialized endpoint
      let updateData = {
        expiration_type: expirationType
      };
      
      // Add the appropriate expiration value field
      if (expirationType === 'days') {
        const days = Number(expirationValue);
        updateData.expiration_days = days; // Ensure it's a number
        console.log('Setting expiration in days:', days);
        
        // For days, include a calculated date as well to ensure expires_at is set
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        updateData.expiration_date = futureDate.toISOString().split('.')[0] + 'Z';
        console.log('Also including calculated date:', updateData.expiration_date);
      } else if (expirationType === 'date') {
        // Format date for API if it's a string
        let formattedDate;
        if (typeof expirationValue === 'string') {
          // Ensure we have a valid date string in ISO format
          const dateObj = new Date(expirationValue);
          if (isNaN(dateObj.getTime())) {
            throw new Error(`Invalid date: ${expirationValue}`);
          }
          formattedDate = dateObj.toISOString().split('.')[0] + 'Z';  // Ensure consistent ISO format
        } else {
          formattedDate = expirationValue;
        }
          
        updateData.expiration_date = formattedDate;
        console.log('Setting expiration to date:', formattedDate);
      } else {
        // For 'none', we just need the expiration_type
        console.log('Removing expiration date');
      }
      
      // First get the current URL data to use as a base
      console.log('Getting current URL data first');
      const currentUrlResponse = await api.get(`/urls/${id}/`);
      const currentUrl = currentUrlResponse.data;
      
      if (!currentUrl || !currentUrl.id) {
        throw new Error(`Failed to get current URL with ID ${id}`);
      }
      
      console.log('Current URL data:', currentUrl);
      
      // Merge current data with our update data to ensure all required fields are present
      const completeUpdateData = { ...currentUrl, ...updateData };
      console.log('Complete update data:', completeUpdateData);
      
      // Try the specialized endpoint for expiration updates
      console.log('Sending to specialized expiration update endpoint');
      let updatedUrl = null;
      
      try {
        const response = await api.patch(`/urls/${id}/update_expiration/`, updateData);
        console.log('Specialized endpoint response:', response.data);
        
        // Verify we have a valid response with expires_at field when expected
        if (response.data && (expirationType === 'none' || response.data.expires_at !== undefined)) {
          console.log('Valid response from specialized endpoint with expires_at:', 
            response.data.expires_at ? response.data.expires_at : 'null (for none)');
          updatedUrl = response.data;
        } else {
          console.warn('Incomplete response from specialized endpoint:', response.data);
        }
      } catch (specializedError) {
        console.error('Error with specialized endpoint:', specializedError);
      }
      
      // If specialized endpoint didn't work, try the regular update endpoint
      if (!updatedUrl) {
        console.log('Falling back to regular update endpoint');
        try {
          const updateResponse = await api.patch(`/urls/${id}/`, completeUpdateData);
          console.log('Regular update response:', updateResponse.data);
          updatedUrl = updateResponse.data;
        } catch (regularError) {
          console.error('Error with regular update endpoint:', regularError);
        }
      }
      
      // Always fetch the latest URL data to ensure we have all fields
      console.log('Fetching latest URL data after update');
      try {
        const freshResponse = await api.get(`/urls/${id}/`);
        const freshUrl = freshResponse.data;
        console.log('Fresh URL data:', freshUrl);
        
        // Check if the expires_at field is as expected
        if (expirationType === 'none') {
          // For 'none', expires_at should be null
          if (freshUrl.expires_at !== null) {
            console.warn('Warning: expires_at should be null for "none" type, but got:', freshUrl.expires_at);
          }
        } else {
          // For days/date, expires_at should be set
          if (!freshUrl.expires_at) {
            console.warn('Warning: expires_at should be set for', expirationType, 'but is null/undefined');
          } else {
            console.log('Successfully verified expires_at is set:', freshUrl.expires_at);
          }
        }
        
        // Always use the fresh data
        return freshUrl;
      } catch (freshError) {
        console.error('Error fetching fresh URL data:', freshError);
        // Fall back to the update response if we have it
        if (updatedUrl) {
          return updatedUrl;
        }
        throw freshError;
      }
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
      // Make request to backend endpoint for folders
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
      
      // Update shared global folder list (to make sure folders are available everywhere)
      window._cachedFolders = validFolders;
      
      return validFolders;
    } catch (error) {
      // Detailed error logging
      console.error('Error getting folders:', error.response?.data || error.message);
      console.error('Error details:', error);
      
      // If we have cached folders, return those instead of an empty array
      if (window._cachedFolders && Array.isArray(window._cachedFolders)) {
        return window._cachedFolders;
      }
      
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
  },
  
  // Clone a URL with optional modifications
  cloneUrl: async (id, modifications = {}) => {
    try {
      const response = await api.post(`/urls/${id}/clone/`, modifications);
      return response.data;
    } catch (error) {
      console.error('Error cloning URL:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // IP Restriction management
  
  // Get all IP restrictions for the current user
  getIpRestrictions: async () => {
    try {
      const response = await api.get('/ip-restrictions/');
      return response.data;
    } catch (error) {
      console.error('Error getting IP restrictions:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Create a new IP restriction
  createIpRestriction: async (restrictionData) => {
    try {
      const response = await api.post('/ip-restrictions/', restrictionData);
      return response.data;
    } catch (error) {
      console.error('Error creating IP restriction:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Update an IP restriction
  updateIpRestriction: async (id, restrictionData) => {
    try {
      const response = await api.patch(`/ip-restrictions/${id}/`, restrictionData);
      return response.data;
    } catch (error) {
      console.error('Error updating IP restriction:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Delete an IP restriction
  deleteIpRestriction: async (id) => {
    try {
      const response = await api.delete(`/ip-restrictions/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting IP restriction:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Manage IP restrictions for a URL
  addIpRestrictionToUrl: async (urlId, restrictionIds) => {
    try {
      // Get current URL data first
      const urlData = await this.getUrlById(urlId);
      
      // Enable IP restrictions if not already enabled
      const updatedData = {
        enable_ip_restrictions: true,
        ip_restriction_ids: restrictionIds
      };
      
      const response = await api.patch(`/urls/${urlId}/`, updatedData);
      return response.data;
    } catch (error) {
      console.error('Error adding IP restrictions to URL:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Security - Tamper-Proof Links
  
  // Enable tamper-proof protection for a URL
  enableTamperProof: async (urlId) => {
    try {
      const response = await api.patch(`/urls/${urlId}/`, {
        spoofing_protection: true
      });
      
      // Generate the integrity hash if needed
      if (!response.data.integrity_hash) {
        await api.post(`/urls/${urlId}/regenerate_integrity_hash/`);
        // Get fresh URL data with the hash
        return await urlService.getUrlById(urlId);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error enabling tamper-proof protection:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Disable tamper-proof protection for a URL
  disableTamperProof: async (urlId) => {
    try {
      const response = await api.patch(`/urls/${urlId}/`, {
        spoofing_protection: false
      });
      return response.data;
    } catch (error) {
      console.error('Error disabling tamper-proof protection:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Regenerate the integrity hash for a URL
  regenerateIntegrityHash: async (urlId) => {
    try {
      const response = await api.post(`/urls/${urlId}/regenerate_integrity_hash/`);
      return response.data;
    } catch (error) {
      console.error('Error regenerating integrity hash:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Verify the integrity of a URL
  verifyUrlIntegrity: async (urlId) => {
    try {
      const response = await api.get(`/urls/${urlId}/verify_integrity/`);
      return response.data;
    } catch (error) {
      console.error('Error verifying URL integrity:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Advanced URL filtering
  
  // Get all URLs with security features enabled
  getSecureUrls: async () => {
    try {
      const response = await api.get('/urls/?has_security=true');
      return response.data;
    } catch (error) {
      console.error('Error getting secure URLs:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Get all cloned URLs
  getClonedUrls: async () => {
    try {
      const response = await api.get('/urls/?cloned=true');
      return response.data;
    } catch (error) {
      console.error('Error getting cloned URLs:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Get all original (non-cloned) URLs
  getOriginalUrls: async () => {
    try {
      const response = await api.get('/urls/?cloned=false');
      return response.data;
    } catch (error) {
      console.error('Error getting original URLs:', error.response?.data || error.message);
      throw error;
    }
  },
};

export default urlService; 