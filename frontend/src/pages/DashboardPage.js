import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLink, FiCopy, FiTrash2, FiEdit, FiPlus, FiX, FiAlertCircle, FiCheckCircle, FiExternalLink, FiSearch, FiBarChart2, FiToggleLeft, FiToggleRight, FiCalendar, FiClock, FiEye } from 'react-icons/fi';
import urlService from '../services/urlService';

const DashboardPage = () => {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(null);
  const [statusToggling, setStatusToggling] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive'
  const [sortBy, setSortBy] = useState('created_at'); // 'created_at', 'access_count', 'short_code'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  
  // New URL form state
  const [newUrl, setNewUrl] = useState({
    original_url: '',
    custom_code: '',
    title: '',
    expiration_days: '',
    is_active: true
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
        if (!urlData[key] && key !== 'is_active') delete urlData[key];
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
        expiration_days: '',
        is_active: true
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
  
  const handleToggleStatus = async (url) => {
    setStatusToggling(url.id);
    
    try {
      const updatedUrl = await urlService.toggleUrlStatus(url.id, !url.is_active);
      
      // Update URL in list
      setUrls(prevUrls => 
        prevUrls.map(item => 
          item.id === url.id ? updatedUrl : item
        )
      );
    } catch (err) {
      console.error('Error toggling URL status:', err);
      setError('Failed to update URL status. Please try again.');
    } finally {
      setStatusToggling(null);
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
    const { name, value, type, checked } = e.target;
    setNewUrl(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleViewDetails = (url) => {
    setSelectedUrl(url);
    setShowDetailsModal(true);
  };
  
  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Format datetime string
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Check if URL is expired
  const isExpired = (url) => {
    if (!url.expires_at) return false;
    return new Date(url.expires_at) < new Date();
  };
  
  // Get the status label for a URL
  const getStatusLabel = (url) => {
    if (!url.is_active) return 'Inactive';
    if (isExpired(url)) return 'Expired';
    return 'Active';
  };
  
  // Get the status color for a URL
  const getStatusColor = (url) => {
    if (!url.is_active) return 'gray-300';
    if (isExpired(url)) return 'red-500';
    return 'accent-500';
  };
  
  // Filter and sort URLs
  const filteredAndSortedUrls = urls
    .filter(url => {
      // Filter by search term
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        url.original_url.toLowerCase().includes(searchLower) ||
        url.short_code.toLowerCase().includes(searchLower) ||
        (url.title && url.title.toLowerCase().includes(searchLower));
      
      // Filter by status
      if (filterStatus === 'all') return matchesSearch;
      if (filterStatus === 'active') return matchesSearch && url.is_active && !isExpired(url);
      if (filterStatus === 'inactive') return matchesSearch && (!url.is_active || isExpired(url));
      
      return matchesSearch;
    })
    .sort((a, b) => {
      // Sort by selected field
      let valueA, valueB;
      
      if (sortBy === 'access_count') {
        valueA = a.access_count;
        valueB = b.access_count;
      } else if (sortBy === 'short_code') {
        valueA = a.short_code.toLowerCase();
        valueB = b.short_code.toLowerCase();
        return sortOrder === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      } else {
        // Default: sort by created_at
        valueA = new Date(a.created_at).getTime();
        valueB = new Date(b.created_at).getTime();
      }
      
      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    });
  
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
              <h2 className="text-xl font-display font-semibold text-dark-900">Your URLs</h2>
              
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
                {/* Filter controls */}
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="input py-2 pr-8 pl-3"
                  >
                    <option value="all">All URLs</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive/Expired</option>
                  </select>
                </div>
                
                {/* Sort controls */}
                <div className="relative">
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [newSortBy, newSortOrder] = e.target.value.split('-');
                      setSortBy(newSortBy);
                      setSortOrder(newSortOrder);
                    }}
                    className="input py-2 pr-8 pl-3"
                  >
                    <option value="created_at-desc">Newest first</option>
                    <option value="created_at-asc">Oldest first</option>
                    <option value="access_count-desc">Most clicks</option>
                    <option value="access_count-asc">Fewest clicks</option>
                    <option value="short_code-asc">Code (A-Z)</option>
                    <option value="short_code-desc">Code (Z-A)</option>
                  </select>
                </div>
                
                {/* Search box */}
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
            </div>
            
            {urls.length === 0 ? (
              <div className="text-center py-10">
                <FiLink className="mx-auto h-12 w-12 text-dark-300" />
                <h3 className="mt-4 text-lg font-medium text-dark-900">No URLs yet</h3>
                <p className="mt-1 text-dark-500">Create your first shortened URL using the button above.</p>
              </div>
            ) : filteredAndSortedUrls.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-dark-500">No URLs matching your filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                        Status
                      </th>
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
                    {filteredAndSortedUrls.map((url) => (
                      <tr key={url.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`flex h-3 w-3 relative ${url.is_active && !isExpired(url) ? 'animate-pulse' : ''}`}>
                              <span className={`${url.is_active && !isExpired(url) ? 'animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75' : ''}`}></span>
                              <span className={`relative inline-flex rounded-full h-3 w-3 bg-${getStatusColor(url)}`}></span>
                            </span>
                            <span className="ml-2 text-xs text-dark-500">
                              {getStatusLabel(url)}
                            </span>
                          </div>
                        </td>
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
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <FiCalendar className="mr-1 h-3 w-3" /> {formatDate(url.created_at)}
                            </div>
                            {url.expires_at && (
                              <div className={`flex items-center text-xs mt-1 ${isExpired(url) ? 'text-red-500' : 'text-dark-400'}`}>
                                <FiClock className="mr-1 h-3 w-3" /> Expires: {formatDate(url.expires_at)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-500">
                          <div className="flex space-x-3">
                            <Link to={`/analytics/${url.id}`} className="text-dark-400 hover:text-primary-600" title="View analytics">
                              <FiBarChart2 />
                            </Link>
                            <button
                              onClick={() => handleViewDetails(url)}
                              className="text-dark-400 hover:text-primary-600"
                              title="View details"
                            >
                              <FiEye />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(url)}
                              disabled={statusToggling === url.id}
                              className={`${url.is_active ? 'text-accent-500 hover:text-accent-700' : 'text-gray-400 hover:text-gray-600'}`}
                              title={url.is_active ? 'Deactivate URL' : 'Activate URL'}
                            >
                              {statusToggling === url.id ? (
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : url.is_active ? (
                                <FiToggleRight className="h-5 w-5" />
                              ) : (
                                <FiToggleLeft className="h-5 w-5" />
                              )}
                            </button>
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
                
                <div className="flex items-center">
                  <input
                    id="is_active"
                    name="is_active"
                    type="checkbox"
                    checked={newUrl.is_active}
                    onChange={handleFormChange}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-dark-700">
                    Active (URL is immediately accessible)
                  </label>
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
      
      {/* URL Details Modal */}
      {showDetailsModal && selectedUrl && (
        <div className="fixed inset-0 bg-dark-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-soft p-6 max-w-2xl w-full"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-display font-semibold text-dark-900">URL Details</h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedUrl(null);
                }}
                className="text-dark-400 hover:text-dark-600"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-dark-500 mb-1">Short URL</p>
                    <div className="flex items-center">
                      <p className="font-medium text-primary-600 mr-2">
                        {selectedUrl.full_short_url || `${window.location.origin}/s/${selectedUrl.short_code}`}
                      </p>
                      <button
                        onClick={() => handleCopy(selectedUrl)}
                        className="text-dark-400 hover:text-dark-600"
                        title="Copy to clipboard"
                      >
                        {copied === selectedUrl.id ? <FiCheckCircle className="text-accent-500" /> : <FiCopy />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-dark-500 mb-1">Status</p>
                    <div className="flex items-center">
                      <span className={`inline-flex rounded-full h-3 w-3 bg-${getStatusColor(selectedUrl)} mr-2`}></span>
                      <span className="font-medium">{getStatusLabel(selectedUrl)}</span>
                      <button
                        onClick={() => {
                          handleToggleStatus(selectedUrl);
                          setShowDetailsModal(false);
                        }}
                        className="ml-2 text-primary-600 hover:text-primary-700 text-sm"
                      >
                        {selectedUrl.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-dark-500 mb-1">Original URL</p>
                <p className="break-all">
                  <a href={selectedUrl.original_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                    {selectedUrl.original_url}
                  </a>
                </p>
              </div>
              
              {selectedUrl.title && (
                <div>
                  <p className="text-sm text-dark-500 mb-1">Title</p>
                  <p className="font-medium">{selectedUrl.title}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-dark-500 mb-1">Created</p>
                  <p>{formatDateTime(selectedUrl.created_at)}</p>
                </div>
                
                {selectedUrl.expires_at && (
                  <div>
                    <p className="text-sm text-dark-500 mb-1">Expires</p>
                    <p className={isExpired(selectedUrl) ? 'text-red-500' : ''}>
                      {formatDateTime(selectedUrl.expires_at)}
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-dark-500 mb-1">Last Accessed</p>
                  <p>{selectedUrl.last_accessed ? formatDateTime(selectedUrl.last_accessed) : 'Never'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-dark-500 mb-1">Total Clicks</p>
                <p className="text-2xl font-display font-bold text-primary-600">{selectedUrl.access_count}</p>
              </div>
              
              <div className="pt-4 flex justify-between border-t border-gray-200">
                <div>
                  <Link
                    to={`/analytics/${selectedUrl.id}`}
                    className="btn btn-primary"
                  >
                    <FiBarChart2 className="mr-2" /> View Analytics
                  </Link>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      handleDeleteClick(selectedUrl);
                      setShowDetailsModal(false);
                    }}
                    className="btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                  >
                    <FiTrash2 className="mr-2" /> Delete
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedUrl(null);
                    }}
                    className="btn btn-outline"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage; 