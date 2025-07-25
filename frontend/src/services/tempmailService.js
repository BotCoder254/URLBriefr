import api from './api';

const tempmailService = {
  // Create a new temporary email session
  createSession: async (durationMinutes = 30) => {
    try {
      const response = await api.post('/tempmail/sessions/', {
        duration_minutes: durationMinutes
      });
      return response.data;
    } catch (error) {
      console.error('Error creating temp email session:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get session details by token
  getSession: async (sessionToken) => {
    try {
      const response = await api.get(`/tempmail/sessions/${sessionToken}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching temp email session:', error.response?.data || error.message);
      throw error;
    }
  },

  // Extend session by 10 minutes
  extendSession: async (sessionToken) => {
    try {
      const response = await api.post(`/tempmail/sessions/${sessionToken}/extend/`);
      return response.data;
    } catch (error) {
      console.error('Error extending temp email session:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get messages for a session
  getMessages: async (sessionToken, page = 1, pageSize = 20) => {
    try {
      const response = await api.get(`/tempmail/sessions/${sessionToken}/messages/`, {
        params: { page, page_size: pageSize }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching temp email messages:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get a specific message
  getMessage: async (messageId) => {
    try {
      const response = await api.get(`/tempmail/messages/${messageId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching temp email message:', error.response?.data || error.message);
      throw error;
    }
  },

  // Delete a message
  deleteMessage: async (messageId) => {
    try {
      const response = await api.delete(`/tempmail/messages/${messageId}/delete_message/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting temp email message:', error.response?.data || error.message);
      throw error;
    }
  },

  // Delete entire session
  deleteSession: async (sessionToken) => {
    try {
      const response = await api.delete(`/tempmail/sessions/${sessionToken}/delete_session/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting temp email session:', error.response?.data || error.message);
      throw error;
    }
  },

  // Download attachment
  downloadAttachment: async (attachmentId) => {
    try {
      const response = await api.get(`/tempmail/attachments/${attachmentId}/download/`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('Error downloading attachment:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default tempmailService;