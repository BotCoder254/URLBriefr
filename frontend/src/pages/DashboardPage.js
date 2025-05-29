import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLink, FiCopy, FiTrash2, FiEdit, FiPlus, FiX, FiAlertCircle, FiCheckCircle, FiExternalLink, FiSearch, FiBarChart2 } from 'react-icons/fi';
import urlService from '../services/urlService';

const DashboardPage = () => {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(null);
  
  // New URL form state
  const [newUrl, setNewUrl] = useState({
    original_url: '',
    custom_code: '',
    title: '',
    expiration_days: ''
  });
  
  // Form errors
  const [formErrors, setFormErrors] = useState({});
  
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  
  useEffect(() => {
    fetchUrls();
  }, []);
  
  const fetchUrls = async () => {
    try {
      setLoading(true);
      const data = await urlService.getUserUrls();
      setUrls(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching URLs:', err);
      setError('Failed to load your URLs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateUrl = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = {};
    if (!newUrl.original_url) {
      errors.original_url = 'URL is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    setFormErrors({});
    
    try {
      const urlData = { ...newUrl };
      
      // Clean up empty fields
      Object.keys(urlData).forEach(key => {
        if (!urlData[key]) delete urlData[key];
      });
      
      // Ensure URL has http/https
      if (!urlData.original_url.startsWith('http://') && !urlData.original_url.startsWith('https://')) {
        urlData.original_url = `https://${urlData.original_url}`;
      }
      
      // Convert expiration_days to number if present
      if (urlData.expiration_days) {
        urlData.expiration_days = parseInt(urlData.expiration_days, 10);
      }
      
      const response = await urlService.createUrl(urlData);
      
      // Add new URL to list
      setUrls(prevUrls => [response, ...prevUrls]);
      
      // Reset form
      setNewUrl({
        original_url: '',
        custom_code: '',
        title: '',
        expiration_days: ''
      });
      
      setCreateSuccess(true);
      setTimeout(() => {
        setCreateSuccess(false);
        setShowCreateModal(false);
      }, 2000);
      
    } catch (err) {
      console.error('Error creating URL:', err);
      setFormErrors({
        submit: err.response?.data?.original_url?.[0] || 
                err.response?.data?.custom_code?.[0] || 
                'Failed to create URL. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteClick = (url) => {
    setSelectedUrl(url);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = async () => {
    if (!selectedUrl) return;
    
    try {
      await urlService.deleteUrl(selectedUrl.id);
      
      // Remove deleted URL from list
      setUrls(prevUrls => prevUrls.filter(url => url.id !== selectedUrl.id));
      
      setShowDeleteModal(false);
      setSelectedUrl(null);
    } catch (err) {
      console.error('Error deleting URL:', err);
      setError('Failed to delete URL. Please try again.');
    }
  };
  
  const handleCopy = (url) => {
    if (!url || !url.full_short_url) {
      console.error('URL or full_short_url is undefined');
      return;
    }

    navigator.clipboard.writeText(url.full_short_url)
      .then(() => {
        setCopied(url.id);
        setTimeout(() => setCopied(null), 2000);
      })
      .catch((err) => {
        console.error('Could not copy text: ', err);
      });
  };
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewUrl(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Filter URLs based on search term
  const filteredUrls = urls.filter(url => {
    const searchLower = searchTerm.toLowerCase();
    return (
      url.original_url.toLowerCase().includes(searchLower) ||
      url.short_code.toLowerCase().includes(searchLower) ||
      (url.title && url.title.toLowerCase().includes(searchLower))
    );
  });
  
  // Format date string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <motion.div variants={itemVariants} className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-display font-bold text-dark-900">URL Dashboard</h1>
              <p className="mt-2 text-dark-500">
                Manage all your shortened URLs in one place
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <FiPlus />
              <span>Create URL</span>
            </button>
          </motion.div>
          
          {error && (
            <motion.div 
              variants={itemVariants}
              className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start"
            >
              <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
          
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-display font-semibold text-dark-900">Your URLs</h2>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-dark-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search URLs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            
            {urls.length === 0 ? (
              <div className="text-center py-10">
                <FiLink className="mx-auto h-12 w-12 text-dark-300" />
                <h3 className="mt-4 text-lg font-medium text-dark-900">No URLs yet</h3>
                <p className="mt-1 text-dark-500">Create your first shortened URL using the button above.</p>
              </div>
            ) : filteredUrls.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-dark-500">No URLs matching "{searchTerm}"</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                        Short URL
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                        Original URL
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                        Clicks
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUrls.map((url) => (
                      <tr key={url.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-primary-600">
                              {url.full_short_url ? url.full_short_url.split('/').pop() : url.short_code}
                            </span>
                            <button
                              onClick={() => handleCopy(url)}
                              className="text-dark-400 hover:text-dark-600"
                              title="Copy to clipboard"
                              disabled={!url.full_short_url}
                            >
                              {copied === url.id ? <FiCheckCircle className="text-accent-500" /> : <FiCopy />}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="max-w-xs truncate text-sm text-dark-500">
                              {url.original_url}
                            </div>
                            <a
                              href={url.original_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-dark-400 hover:text-dark-600"
                              title="Open original URL"
                            >
                              <FiExternalLink />
                            </a>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-500">
                          {url.title || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-900">
                          <Link to={`/analytics/${url.id}`} className="text-primary-600 hover:underline">
                            {url.access_count}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-500">
                          {formatDate(url.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-500">
                          <div className="flex space-x-3">
                            <Link to={`/analytics/${url.id}`} className="text-dark-400 hover:text-primary-600" title="View analytics">
                              <FiBarChart2 />
                            </Link>
                            <button
                              onClick={() => handleDeleteClick(url)}
                              className="text-dark-400 hover:text-red-600"
                              title="Delete URL"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
      
      {/* Create URL Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-dark-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-soft p-6 max-w-lg w-full"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-display font-semibold text-dark-900">Create New URL</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-dark-400 hover:text-dark-600"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            
            {createSuccess ? (
              <div className="bg-accent-50 text-accent-800 p-4 rounded-lg mb-4 flex items-center">
                <FiCheckCircle className="mr-2 text-accent-600" />
                URL created successfully!
              </div>
            ) : (
              <form onSubmit={handleCreateUrl} className="space-y-4">
                {formErrors.submit && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-start">
                    <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
                    <span>{formErrors.submit}</span>
                  </div>
                )}
                
                <div>
                  <label htmlFor="original_url" className="label">URL to Shorten *</label>
                  <input
                    id="original_url"
                    name="original_url"
                    type="text"
                    value={newUrl.original_url}
                    onChange={handleFormChange}
                    className={`input w-full ${formErrors.original_url ? 'border-red-500' : ''}`}
                    placeholder="https://example.com/very/long/url"
                  />
                  {formErrors.original_url && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.original_url}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="custom_code" className="label">Custom Code (Optional)</label>
                  <input
                    id="custom_code"
                    name="custom_code"
                    type="text"
                    value={newUrl.custom_code}
                    onChange={handleFormChange}
                    className="input w-full"
                    placeholder="my-custom-url"
                  />
                  <p className="mt-1 text-xs text-dark-500">
                    Leave blank to generate a random code.
                  </p>
                </div>
                
                <div>
                  <label htmlFor="title" className="label">Title (Optional)</label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={newUrl.title}
                    onChange={handleFormChange}
                    className="input w-full"
                    placeholder="My awesome link"
                  />
                </div>
                
                <div>
                  <label htmlFor="expiration_days" className="label">Expires After (Optional)</label>
                  <select
                    id="expiration_days"
                    name="expiration_days"
                    value={newUrl.expiration_days}
                    onChange={handleFormChange}
                    className="input w-full"
                  >
                    <option value="">Never expires</option>
                    <option value="1">1 day</option>
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="365">1 year</option>
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      'Create URL'
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUrl && (
        <div className="fixed inset-0 bg-dark-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-soft p-6 max-w-md w-full"
          >
            <h2 className="text-xl font-display font-semibold text-dark-900 mb-4">Confirm Deletion</h2>
            <p className="text-dark-500 mb-6">
              Are you sure you want to delete the URL <span className="font-medium text-dark-700">
                {selectedUrl.full_short_url ? selectedUrl.full_short_url.split('/').pop() : selectedUrl.short_code}
              </span>? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUrl(null);
                }}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage; 