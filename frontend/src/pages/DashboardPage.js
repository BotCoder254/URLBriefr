import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLink, FiCopy, FiTrash2, FiEdit, FiPlus, FiX, FiAlertCircle, FiCheckCircle, FiExternalLink, FiSearch, FiBarChart2, FiToggleLeft, FiToggleRight, FiCalendar, FiClock, FiEye, FiGrid, FiTag, FiFolder, FiFilter, FiSettings } from 'react-icons/fi';
import urlService from '../services/urlService';
import QRCodeModal from '../components/url/QRCodeModal';
import ABTestingForm from '../components/url/ABTestingForm';
import TagSelector from '../components/url/TagSelector';
import FolderSelector from '../components/url/FolderSelector';
import TagBadge from '../components/url/TagBadge';
import TagManagementModal from '../components/url/TagManagementModal';
import FolderManagementModal from '../components/url/FolderManagementModal';
import AdvancedOptionsForm from '../components/url/AdvancedOptionsForm';
import { toast } from 'react-hot-toast';

const DashboardPage = () => {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showExpirationModal, setShowExpirationModal] = useState(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [showTagManagementModal, setShowTagManagementModal] = useState(false);
  const [showFolderManagementModal, setShowFolderManagementModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(null);
  const [statusToggling, setStatusToggling] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive'
  const [sortBy, setSortBy] = useState('created_at'); // 'created_at', 'access_count', 'short_code'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [updatingPreview, setUpdatingPreview] = useState(false);
  
  // New URL form state
  const [newUrl, setNewUrl] = useState({
    original_url: '',
    custom_code: '',
    title: '',
    expiration_type: 'none',
    expiration_days: '',
    is_active: true,
    is_ab_test: false,
    variants: [
      { name: 'Variant A', destination_url: '', weight: 50 },
      { name: 'Variant B', destination_url: '', weight: 50 }
    ],
    folder: '',
    tag_ids: [],
    use_redirect_page: false,
    redirect_page_type: 'default',
    redirect_delay: 3
  });
  
  // Expiration form state
  const [expirationForm, setExpirationForm] = useState({
    expirationType: 'never',
    expirationDays: '',
    expirationDate: ''
  });
  
  // Form errors
  const [formErrors, setFormErrors] = useState({});
  const [expirationErrors, setExpirationErrors] = useState({});
  
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [expirationUpdating, setExpirationUpdating] = useState(false);
  
  // Filter state
  const [filterTags, setFilterTags] = useState([]);
  const [filterFolder, setFilterFolder] = useState('');
  const [activeFilters, setActiveFilters] = useState(false);
  
  // Clone URL form state
  const [cloneData, setCloneData] = useState({
    title: '',
    original_url: '',
    folder: '',
    expiration_type: 'none',
    expiration_days: 7,
    expiration_date: '',
    tag_ids: [],
    enable_ip_restrictions: false,
    spoofing_protection: false
  });
  const [cloneLoading, setCloneLoading] = useState(false);
  
  // Get tomorrow's date in YYYY-MM-DD format for min date in date picker
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  
  // Define fetchUrls before it's used in useEffect
  const fetchUrls = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build filters object
      const filters = {};
      
      // Add tag filters
      if (filterTags.length > 0) {
        filters.tag_id = filterTags.map(tag => tag.id);
      }
      
      // Add folder filter
      if (filterFolder) {
        filters.folder = filterFolder;
      }
      
      // Add search term filter
      if (searchTerm) {
        filters.search = searchTerm;
      }
      
      const data = await urlService.getUserUrls(filters);
      setUrls(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching URLs:', err);
      setError('Failed to load your URLs. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [filterTags, filterFolder, searchTerm]);
  
  useEffect(() => {
    fetchUrls();
  }, []);
  
  useEffect(() => {
    // Apply filters when search term changes, but with a small delay
    const delayDebounceFn = setTimeout(() => {
      fetchUrls();
    }, 500);
    
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fetchUrls]);
  
  const handleCreateUrl = async (e) => {
    if (e && e.preventDefault) {
    e.preventDefault();
    }
    
    // Validate form
    const errors = {};
    if (!newUrl.original_url) {
      errors.original_url = 'URL is required';
    }
    
    // If A/B testing is enabled, validate variants
    if (newUrl.is_ab_test) {
      // Check if all variants have destination URLs
      const emptyVariants = newUrl.variants.filter(v => !v.destination_url);
      if (emptyVariants.length > 0) {
        errors.variants = 'All variants must have destination URLs';
      }
      
      // Check if weights sum to 100
      const totalWeight = newUrl.variants.reduce((sum, v) => sum + Number(v.weight), 0);
      if (totalWeight !== 100) {
        errors.variants = `Variant weights must sum to 100% (current: ${totalWeight}%)`;
      }
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
        if (!urlData[key] && key !== 'is_active' && key !== 'is_ab_test') delete urlData[key];
      });
      
      // Ensure URL has http/https
      if (!urlData.original_url.startsWith('http://') && !urlData.original_url.startsWith('https://')) {
        urlData.original_url = `https://${urlData.original_url}`;
      }
      
      // Process expiration settings
      if (urlData.expiration_type) {
        // If expiration type is days, ensure we have a number
        if (urlData.expiration_type === 'days' && urlData.expiration_days) {
        urlData.expiration_days = parseInt(urlData.expiration_days, 10);
        } else if (urlData.expiration_type === 'none') {
          // If no expiration, remove any expiration dates
          delete urlData.expiration_days;
          delete urlData.expiration_date;
        }
      } else {
        // If no expiration type is set, default to none
        urlData.expiration_type = 'none';
      }
      
      // Remove empty fields from advanced options
      if (!urlData.custom_redirect_message) delete urlData.custom_redirect_message;
      if (!urlData.brand_name) delete urlData.brand_name;
      if (!urlData.brand_logo_url) delete urlData.brand_logo_url;
      
      console.log('Creating URL with data:', urlData);
      
      // If A/B testing is not enabled, remove variants
      if (!urlData.is_ab_test) {
        delete urlData.variants;
      } else {
        // Ensure weights are numbers
        urlData.variants = urlData.variants.map(variant => ({
          ...variant,
          weight: Number(variant.weight)
        }));
        
        // Set first variant's destination URL to original URL if empty
        if (!urlData.variants[0].destination_url) {
          urlData.variants[0].destination_url = urlData.original_url;
        }
      }
      
      const response = await urlService.createUrl(urlData);
      
      // Add new URL to list
      setUrls(prevUrls => [response, ...prevUrls]);
      
      // Refresh folders to ensure new folders are displayed
      if (urlData.folder) {
        try {
          await urlService.getFolders();
        } catch (folderErr) {
          console.warn('Error refreshing folders:', folderErr);
        }
      }
      
      // Reset form
      setNewUrl({
        original_url: '',
        custom_code: '',
        title: '',
        expiration_type: 'none',
        expiration_days: '',
        is_active: true,
        is_ab_test: false,
        variants: [
          { name: 'Variant A', destination_url: '', weight: 50 },
          { name: 'Variant B', destination_url: '', weight: 50 }
        ],
        folder: '',
        tag_ids: [],
        use_redirect_page: false,
        redirect_page_type: 'default',
        redirect_delay: 3,
        custom_redirect_message: '',
        brand_name: '',
        brand_logo_url: ''
      });
      
      setCreateSuccess(true);
      setTimeout(() => {
        setCreateSuccess(false);
        setShowCreateModal(false);
      }, 2000);
      
    } catch (err) {
      console.error('Error creating URL:', err);
      
      // Get more detailed error information
      const responseData = err.response?.data || {};
      console.log('Error response data:', responseData);
      
      // Check if there's a specific error message
      let errorMessage = 'Failed to create URL. Please try again.';
      
      // Look for specific field errors
      if (typeof responseData === 'object') {
        // Check common field errors
        const fieldErrors = [
          responseData.original_url?.[0],
          responseData.custom_code?.[0],
          responseData.variants?.[0],
          responseData.expiration_days?.[0],
          responseData.expiration_date?.[0],
          responseData.error
        ].filter(Boolean);
        
        if (fieldErrors.length > 0) {
          errorMessage = fieldErrors[0];
        } else if (typeof responseData === 'string') {
          // Sometimes the error might be a string
          errorMessage = responseData;
        }
      }
      
      setFormErrors({
        submit: errorMessage
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
    
    // Clear form errors
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
    
    // If enabling A/B testing, set first variant's destination URL to the original URL
    if (name === 'is_ab_test' && checked && newUrl.original_url) {
      const validatedUrl = newUrl.original_url.startsWith('http') ? 
        newUrl.original_url : 
        `https://${newUrl.original_url}`;
        
      setNewUrl(prev => ({
        ...prev,
        is_ab_test: checked,
        variants: [
          { ...prev.variants[0], destination_url: validatedUrl },
          { ...prev.variants[1] }
        ]
      }));
    }
  };
  
  const handleViewDetails = (url) => {
    setSelectedUrl(url);
    setShowDetailsModal(true);
  };
  
  // Format date string
  const formatDate = (dateString) => {
    // Handle null, undefined, or empty string cases
    if (!dateString) return 'Never';
    
    try {
      // Parse date
    const date = new Date(dateString);
      
      // Check for invalid date
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date format received: "${dateString}"`);
        return 'Never';
      }
      
      // Format date with more details
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (err) {
      console.error('Error formatting date:', err, 'for input:', dateString);
      return 'Never';
    }
  };
  
  // Format datetime string
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Check if URL is expired
  const isExpired = (url) => {
    // If no expiration date, it never expires
    if (!url.expires_at) return false;
    
    try {
      // Parse the expiration date
      const expiryDate = new Date(url.expires_at);
      
      // Check if date is valid
      if (isNaN(expiryDate.getTime())) {
        console.warn(`Invalid expiry date found: "${url.expires_at}" for URL ID ${url.id}`);
        return false;
      }
      
      // Compare with current date
      const now = new Date();
      return expiryDate < now;
    } catch (err) {
      console.error('Error checking if URL is expired:', err, 'for URL:', url);
      return false;
    }
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
  
  const handleExpirationClick = (url) => {
    setSelectedUrl(url);
    
    // Initialize form based on current URL expiration
    if (url.expires_at) {
      const expiresAt = new Date(url.expires_at);
      const today = new Date();
      const diffTime = Math.abs(expiresAt - today);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Check if it's a standard expiration period
      if (diffDays === 1 || diffDays === 7 || diffDays === 30 || diffDays === 90 || diffDays === 365) {
        setExpirationForm({
          expirationType: 'days',
          expirationDays: diffDays.toString(),
          expirationDate: expiresAt.toISOString().split('T')[0]
        });
      } else {
        setExpirationForm({
          expirationType: 'date',
          expirationDays: '',
          expirationDate: expiresAt.toISOString().split('T')[0]
        });
      }
    } else {
      setExpirationForm({
        expirationType: 'never',
        expirationDays: '',
        expirationDate: ''
      });
    }
    
    setShowExpirationModal(true);
  };
  
  const handleExpirationFormChange = (e) => {
    const { name, value } = e.target;
    setExpirationForm(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (expirationErrors[name]) {
      setExpirationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleUpdateExpiration = async () => {
    if (!selectedUrl) return;
    
    // Validate form
    const errors = {};
    if (expirationForm.expirationType === 'days' && !expirationForm.expirationDays) {
      errors.expirationDays = 'Please select number of days';
    }
    
    if (expirationForm.expirationType === 'date' && !expirationForm.expirationDate) {
      errors.expirationDate = 'Please select a date';
    }
    
    if (Object.keys(errors).length > 0) {
      setExpirationErrors(errors);
      return;
    }
    
    setExpirationUpdating(true);
    setExpirationErrors({});
    
    try {
      console.log(`Updating URL ID ${selectedUrl.id} expiration to ${expirationForm.expirationType}`);
      
      // First attempt with the specialized endpoint
      let updatedUrl;
      
      try {
      if (expirationForm.expirationType === 'never') {
        updatedUrl = await urlService.setUrlExpiration(selectedUrl.id, 'none', null);
      } else if (expirationForm.expirationType === 'days') {
        updatedUrl = await urlService.setUrlExpiration(
          selectedUrl.id, 
          'days', 
          parseInt(expirationForm.expirationDays, 10)
        );
      } else if (expirationForm.expirationType === 'date') {
          // Ensure we have a valid date to send
          const dateValue = expirationForm.expirationDate;
          if (!dateValue) {
            throw new Error('Invalid date value');
          }
          
        updatedUrl = await urlService.setUrlExpiration(
          selectedUrl.id,
          'date',
            dateValue
          );
        }
        
        console.log('Initial response from update:', updatedUrl);
      } catch (updateError) {
        console.error('Error during expiration update:', updateError);
        throw updateError;
      }
      
      // Always fetch a fresh copy to make sure we have all fields
      try {
        console.log('Fetching fresh URL data after update');
        const freshUrl = await urlService.getUrlById(selectedUrl.id);
        console.log('Fresh URL data after update:', freshUrl);
        
        if (freshUrl && freshUrl.id) {
          // Check if the expires_at field exists in the fresh data
          if ((expirationForm.expirationType === 'never' && freshUrl.expires_at === null) ||
              (expirationForm.expirationType !== 'never' && freshUrl.expires_at)) {
            console.log('Fresh URL data contains correctly set expires_at field:', freshUrl.expires_at);
          } else {
            console.warn('Fresh URL data may have incorrect expires_at:', freshUrl.expires_at, 
              'for expiration type:', expirationForm.expirationType);
          }
          
          // Use the fresh data regardless
          updatedUrl = freshUrl;
        }
      } catch (fetchError) {
        console.error('Error fetching fresh URL data:', fetchError);
        // Continue with whatever data we have from the update
      }
      
      // Update URL in list with the final data
      if (updatedUrl) {
        // Enhanced logging for debugging
        console.log(`Updating URL in state with expires_at:`, 
          updatedUrl.expires_at !== undefined ? updatedUrl.expires_at : 'UNDEFINED',
          'Full URL data:', updatedUrl
        );
        
        // Always fetch the latest data one more time if expires_at is missing
        if (expirationForm.expirationType !== 'never' && !updatedUrl.expires_at) {
          try {
            console.log('Making one final attempt to get latest URL data with expires_at field');
            const finalAttempt = await urlService.getUrlById(selectedUrl.id);
            console.log('Final data attempt:', finalAttempt);
            
            if (finalAttempt && finalAttempt.id) {
              updatedUrl = finalAttempt;
            }
          } catch (finalError) {
            console.error('Error in final data fetch attempt:', finalError);
          }
        }
        
        // Update state with the best data we have
      setUrls(prevUrls => 
        prevUrls.map(item => 
          item.id === selectedUrl.id ? updatedUrl : item
        )
      );
      }
      
      setShowExpirationModal(false);
      setSelectedUrl(null);
    } catch (err) {
      console.error('Error updating URL expiration:', err);
      setExpirationErrors({
        submit: err.response?.data?.expiration_date?.[0] || 
                err.response?.data?.expiration_days?.[0] || 
                'Failed to update expiration. Please try again.'
      });
    } finally {
      setExpirationUpdating(false);
    }
  };
  
  // Add a new handler for QR code generation
  const handleShowQRCode = (url) => {
    setSelectedUrl(url);
    setShowQRCodeModal(true);
  };
  
  const handleCloneClick = (url) => {
    setSelectedUrl(url);
    
    // Pre-fill the clone form with data from the original URL
    setCloneData({
      title: `Clone of ${url.title || url.short_code}`,
      original_url: url.original_url,
      folder: url.folder || '',
      expiration_type: url.expires_at ? 'date' : 'none',
      expiration_days: 7,
      expiration_date: url.expires_at ? formatDateForInput(url.expires_at) : getTomorrowDate(),
      tag_ids: url.tags ? url.tags.map(tag => tag.id) : [],
      enable_ip_restrictions: url.enable_ip_restrictions || false,
      spoofing_protection: url.spoofing_protection || false
    });
    
    setShowCloneModal(true);
  };
  
  const handleCloneFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setCloneData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmitClone = async (e) => {
    e.preventDefault();
    
    if (!selectedUrl) return;
    
    setCloneLoading(true);
    
    try {
      // Convert tag_ids to integers if they're strings
      const formattedData = {
        ...cloneData,
        tag_ids: cloneData.tag_ids.map(id => typeof id === 'string' ? parseInt(id, 10) : id)
      };
      
      // Clone the URL
      const clonedUrl = await urlService.cloneUrl(selectedUrl.id, formattedData);
      
      // Add the cloned URL to the list
      setUrls(prevUrls => [clonedUrl, ...prevUrls]);
      
      // Close the modal
      setShowCloneModal(false);
      
      // Show success message
      toast.success('URL cloned successfully!');
    } catch (error) {
      console.error('Error cloning URL:', error);
      toast.error(error.response?.data?.error || 'Failed to clone URL');
    } finally {
      setCloneLoading(false);
    }
  };
  
  // Helper function to format date for input fields
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };
  
  // Add a function to update the URL preview
  const handleUpdatePreview = async (url) => {
    if (!url || !url.id) return;
    
    setUpdatingPreview(true);
    
    try {
      const result = await urlService.updatePreview(url.id);
      if (result && result.success) {
        // Update the selected URL with the new preview data
        const updatedUrl = {
          ...url,
          enable_preview: true,
          preview_title: result.preview.title,
          preview_description: result.preview.description,
          preview_image: result.preview.image,
          preview_updated_at: result.preview.updated_at
        };
        
        setSelectedUrl(updatedUrl);
        
        // Also update the URL in the list
        setUrls(prevUrls => prevUrls.map(u => u.id === url.id ? updatedUrl : u));
        
        toast.success('Preview updated successfully');
      }
    } catch (err) {
      console.error('Error updating preview:', err);
      toast.error('Failed to update preview');
    } finally {
      setUpdatingPreview(false);
    }
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
            <div className="flex space-x-3">
              <Link
                to="/organize"
                className="btn btn-outline flex items-center space-x-2"
              >
                <FiTag />
                <span>Organize</span>
              </Link>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary flex items-center space-x-2"
              >
                <FiPlus />
                <span>Create URL</span>
              </button>
            </div>
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
                
                {/* Filter button */}
                <button
                  onClick={() => setActiveFilters(!activeFilters)}
                  className={`btn ${activeFilters ? 'btn-primary' : 'btn-outline'} flex items-center`}
                >
                  <FiFilter className="mr-1" />
                  <span>Filters</span>
                  {(filterTags.length > 0 || filterFolder) && (
                    <span className="ml-1 bg-primary-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {filterTags.length + (filterFolder ? 1 : 0)}
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            {/* Advanced filters section */}
            <AnimatePresence>
              {activeFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 border-t border-gray-100 pt-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tag filter */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-dark-700">
                          <FiTag className="inline mr-1" /> Filter by Tags
                        </label>
                        <button 
                          type="button"
                          onClick={() => setShowTagManagementModal(true)}
                          className="text-xs text-primary-600 hover:text-primary-700 flex items-center"
                        >
                          <FiSettings className="mr-1 h-3 w-3" /> Manage Tags
                        </button>
                      </div>
                      <TagSelector 
                        selectedTags={filterTags} 
                        onChange={setFilterTags} 
                        allowCreate={false}
                        allowEdit={false}
                      />
                    </div>
                    
                    {/* Folder filter */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-dark-700">
                          <FiFolder className="inline mr-1" /> Filter by Folder
                        </label>
                        <button 
                          type="button"
                          onClick={() => setShowFolderManagementModal(true)}
                          className="text-xs text-primary-600 hover:text-primary-700 flex items-center"
                        >
                          <FiSettings className="mr-1 h-3 w-3" /> Manage Folders
                        </button>
                      </div>
                      <FolderSelector 
                        selectedFolder={filterFolder} 
                        onChange={setFilterFolder} 
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4 space-x-3">
                    <button
                      onClick={() => {
                        setFilterTags([]);
                        setFilterFolder('');
                        setActiveFilters(false);
                        fetchUrls();
                      }}
                      className="btn btn-outline"
                    >
                      Clear Filters
                    </button>
                    <button
                      onClick={() => {
                        fetchUrls();
                        setActiveFilters(false);
                      }}
                      className="btn btn-primary"
                    >
                      Apply Filters
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
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
                        Tags
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                        Folder
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                        Expiration
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
                          <div className="flex flex-wrap gap-1">
                            {url.tags && url.tags.length > 0 ? (
                              <>
                                {url.tags.slice(0, 2).map(tag => (
                                  <TagBadge key={tag.id} tag={tag} size="sm" />
                                ))}
                                {url.tags.length > 2 && (
                                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                                    +{url.tags.length - 2}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-500">
                          {url.folder ? (
                            <div className="flex items-center">
                              <FiFolder className="mr-1 text-gray-500" />
                              <span className="bg-gray-100 px-2 py-0.5 rounded-md text-sm">{url.folder}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">Not in a folder</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {url.expires_at ? (
                            <div className={`flex items-center text-sm ${isExpired(url) ? 'text-red-500' : 'text-dark-500'}`}>
                              <FiClock className="mr-1 h-4 w-4" /> 
                              <span>{formatDate(url.expires_at)}</span>
                              <button
                                onClick={() => handleExpirationClick(url)}
                                className="ml-2 text-primary-600 hover:text-primary-700"
                                title="Change expiration"
                              >
                                <FiEdit className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center text-sm text-dark-500">
                              <span>Never</span>
                              <button
                                onClick={() => handleExpirationClick(url)}
                                className="ml-2 text-primary-600 hover:text-primary-700"
                                title="Set expiration"
                              >
                                <FiEdit className="h-3 w-3" />
                              </button>
                            </div>
                          )}
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
                            <button
                              onClick={() => handleShowQRCode(url)}
                              className="text-dark-400 hover:text-primary-600"
                              title="Show QR Code"
                            >
                              <FiGrid />
                            </button>
                            <button
                              onClick={() => handleCloneClick(url)}
                              className="text-dark-400 hover:text-primary-600"
                              title="Clone URL"
                            >
                              <FiCopy />
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
        <div className="fixed inset-0 bg-dark-900 bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-soft p-6 max-w-lg w-full my-8 max-h-[90vh] overflow-y-auto"
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
                
                <div className="flex items-center">
                  <input
                    id="is_ab_test"
                    name="is_ab_test"
                    type="checkbox"
                    checked={newUrl.is_ab_test}
                    onChange={handleFormChange}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="is_ab_test" className="ml-2 block text-sm text-dark-700">
                    Enable A/B Testing
                  </label>
                </div>
                
                {/* A/B Testing Form */}
                <AnimatePresence>
                  {newUrl.is_ab_test && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-3 border-t border-gray-200"
                      style={{ overflow: 'visible' }}
                    >
                      {formErrors.variants && (
                        <div className="mb-3 bg-red-50 text-red-700 p-2 rounded-lg text-sm">
                          <FiAlertCircle className="inline mr-1" /> {formErrors.variants}
                        </div>
                      )}
                      <ABTestingForm 
                        variants={newUrl.variants} 
                        setVariants={(updatedVariants) => {
                          setNewUrl(prev => ({
                            ...prev,
                            variants: updatedVariants
                          }));
                        }} 
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Organization section */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <h3 className="text-md font-medium text-dark-800 mb-3">Organization</h3>
                  
                  <div className="space-y-3">
                    {/* Folder selection */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-medium text-dark-700">
                          <FiFolder className="inline mr-1" /> Folder (Optional)
                        </label>
                        <button 
                          type="button"
                          onClick={() => {
                            // Save current form state and open folder management modal
                            setShowFolderManagementModal(true);
                          }}
                          className="text-xs text-primary-600 hover:text-primary-700 flex items-center"
                        >
                          <FiSettings className="mr-1 h-3 w-3" /> Manage
                        </button>
                      </div>
                      <FolderSelector
                        selectedFolder={newUrl.folder}
                        onChange={(folder) => setNewUrl(prev => ({ ...prev, folder }))}
                      />
                    </div>
                    
                    {/* Tags selection */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-medium text-dark-700">
                          <FiTag className="inline mr-1" /> Tags (Optional)
                        </label>
                        <button 
                          type="button"
                          onClick={() => {
                            // Save current form state and open tag management modal
                            setShowTagManagementModal(true);
                          }}
                          className="text-xs text-primary-600 hover:text-primary-700 flex items-center"
                        >
                          <FiSettings className="mr-1 h-3 w-3" /> Manage
                        </button>
                      </div>
                      <TagSelector
                        selectedTags={newUrl.tag_ids}
                        onChange={(tags) => setNewUrl(prev => ({ ...prev, tag_ids: tags }))}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Advanced options */}
                <AdvancedOptionsForm 
                  formData={newUrl} 
                  setFormData={(updatedData) => {
                    console.log('Updating form data from AdvancedOptionsForm:', updatedData);
                    setNewUrl(updatedData);
                  }} 
                />
                
                <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateUrl}
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
                
                <div>
                  <p className="text-sm text-dark-500 mb-1">Expiration</p>
                  <div className="flex items-center">
                    {selectedUrl.expires_at ? (
                      <span className={isExpired(selectedUrl) ? 'text-red-500' : ''}>
                        {formatDateTime(selectedUrl.expires_at)}
                      </span>
                    ) : (
                      <span>Never expires</span>
                    )}
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleExpirationClick(selectedUrl);
                      }}
                      className="ml-2 text-primary-600 hover:text-primary-700"
                      title="Change expiration"
                    >
                      <FiEdit className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-dark-500 mb-1">Last Accessed</p>
                  <p>{selectedUrl.last_accessed ? formatDateTime(selectedUrl.last_accessed) : 'Never'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-dark-500 mb-1">Folder</p>
                  {selectedUrl.folder ? (
                    <div className="flex items-center">
                      <FiFolder className="mr-1 text-gray-500" />
                      <span className="bg-gray-100 px-2 py-0.5 rounded-md text-sm">{selectedUrl.folder}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">Not in a folder</span>
                  )}
                </div>
                
                <div>
                  <p className="text-sm text-dark-500 mb-1">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedUrl.tags && selectedUrl.tags.length > 0 ? (
                      selectedUrl.tags.map(tag => (
                        <TagBadge key={tag.id} tag={tag} size="sm" />
                      ))
                    ) : (
                      <span className="text-gray-400">No tags</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-dark-500 mb-1">Total Clicks</p>
                <p className="text-2xl font-display font-bold text-primary-600">{selectedUrl.access_count}</p>
              </div>
              
              {/* Preview section */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-dark-500">URL Preview</p>
                  <button
                    onClick={() => handleUpdatePreview(selectedUrl)}
                    disabled={updatingPreview}
                    className="btn btn-sm btn-outline flex items-center"
                  >
                    <FiEye className="mr-1" />
                    {updatingPreview ? 'Updating...' : 'Update Preview'}
                  </button>
                </div>
                
                {selectedUrl.enable_preview && (selectedUrl.preview_image || selectedUrl.preview_title || selectedUrl.preview_description) ? (
                  <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                    {selectedUrl.preview_image && (
                      <img
                        src={selectedUrl.preview_image}
                        alt={selectedUrl.preview_title || "Preview"}
                        className="w-full h-32 object-cover"
                      />
                    )}
                    
                    <div className="p-3">
                      {selectedUrl.preview_title && (
                        <p className="font-medium text-dark-900 mb-1">
                          {selectedUrl.preview_title}
                        </p>
                      )}
                      
                      {selectedUrl.preview_description && (
                        <p className="text-sm text-dark-600 line-clamp-2">
                          {selectedUrl.preview_description}
                        </p>
                      )}
                      
                      {selectedUrl.preview_updated_at && (
                        <p className="text-xs text-dark-400 mt-1">
                          Updated: {formatDateTime(selectedUrl.preview_updated_at)}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <p className="text-sm text-dark-500">No preview available</p>
                    {selectedUrl.one_time_use && (
                      <p className="text-xs text-amber-600 mt-1">
                        Note: One-time use links will expire after first click
                      </p>
                    )}
                  </div>
                )}
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
                      setShowDetailsModal(false);
                      handleExpirationClick(selectedUrl);
                    }}
                    className="btn btn-outline"
                  >
                    <FiClock className="mr-2" /> Manage Expiration
                  </button>
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
      
      {/* Expiration Modal */}
      {showExpirationModal && selectedUrl && (
        <div className="fixed inset-0 bg-dark-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-soft p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-display font-semibold text-dark-900">Set URL Expiration</h2>
              <button
                onClick={() => {
                  setShowExpirationModal(false);
                  setSelectedUrl(null);
                }}
                className="text-dark-400 hover:text-dark-600"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-dark-500">
                Set when this URL should expire. After expiration, the URL will no longer redirect to the original destination.
              </p>
            </div>
            
            {expirationErrors.submit && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-start mb-4">
                <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
                <span>{expirationErrors.submit}</span>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">
                  Expiration Type
                </label>
                <select
                  name="expirationType"
                  value={expirationForm.expirationType}
                  onChange={handleExpirationFormChange}
                  className="input w-full py-2"
                >
                  <option value="never">Never expires</option>
                  <option value="days">Expire after days</option>
                  <option value="date">Expire on specific date</option>
                </select>
              </div>
              
              {expirationForm.expirationType === 'days' && (
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">
                    Number of Days
                  </label>
                  <select
                    name="expirationDays"
                    value={expirationForm.expirationDays}
                    onChange={handleExpirationFormChange}
                    className={`input w-full py-2 ${expirationErrors.expirationDays ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select number of days</option>
                    <option value="1">1 day</option>
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="365">1 year</option>
                  </select>
                  {expirationErrors.expirationDays && (
                    <p className="mt-1 text-sm text-red-600">{expirationErrors.expirationDays}</p>
                  )}
                </div>
              )}
              
              {expirationForm.expirationType === 'date' && (
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">
                    Expiration Date
                  </label>
                  <div className="flex items-center">
                    <FiCalendar className="text-dark-400 mr-2" />
                    <input
                      type="date"
                      name="expirationDate"
                      value={expirationForm.expirationDate}
                      onChange={handleExpirationFormChange}
                      min={getTomorrowDate()}
                      className={`input w-full py-2 ${expirationErrors.expirationDate ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {expirationErrors.expirationDate && (
                    <p className="mt-1 text-sm text-red-600">{expirationErrors.expirationDate}</p>
                  )}
                  <p className="mt-1 text-xs text-dark-500">
                    The URL will expire at the end of the selected day.
                  </p>
                </div>
              )}
              
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowExpirationModal(false);
                    setSelectedUrl(null);
                  }}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateExpiration}
                  disabled={expirationUpdating}
                  className="btn btn-primary"
                >
                  {expirationUpdating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRCodeModal && selectedUrl && (
          <QRCodeModal 
            url={selectedUrl} 
            onClose={() => setShowQRCodeModal(false)} 
          />
        )}
      </AnimatePresence>
      
      {/* Tag Management Modal */}
      <TagManagementModal 
        isOpen={showTagManagementModal} 
        onClose={() => {
          setShowTagManagementModal(false);
          fetchUrls(); // Refresh data after managing tags
        }}
      />
      
      {/* Folder Management Modal */}
      <FolderManagementModal 
        isOpen={showFolderManagementModal} 
        onClose={() => {
          setShowFolderManagementModal(false);
          fetchUrls(); // Refresh data after managing folders
        }}
      />
      
      {/* Clone URL Modal */}
      {showCloneModal && selectedUrl && (
        <div className="fixed inset-0 bg-dark-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-soft p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-display font-semibold text-dark-900">Clone URL</h2>
              <button
                onClick={() => setShowCloneModal(false)}
                className="text-dark-400 hover:text-dark-600"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitClone} className="space-y-4">
              <div>
                <label htmlFor="title" className="label">Title</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={cloneData.title}
                  onChange={handleCloneFormChange}
                  className="input w-full"
                  placeholder="Enter a title for the cloned URL"
                />
              </div>
              
              <div>
                <label htmlFor="original_url" className="label">Original URL</label>
                <input
                  id="original_url"
                  name="original_url"
                  type="text"
                  value={cloneData.original_url}
                  onChange={handleCloneFormChange}
                  className="input w-full"
                  placeholder="Enter the original URL"
                />
              </div>
              
              <div>
                <label htmlFor="folder" className="label">Folder</label>
                <FolderSelector
                  selectedFolder={cloneData.folder}
                  onChange={(folder) => setCloneData(prev => ({ ...prev, folder }))}
                />
              </div>
              
              <div>
                <label className="label">Expiration</label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="clone-expiration-none"
                      name="expiration_type"
                      value="none"
                      checked={cloneData.expiration_type === 'none'}
                      onChange={handleCloneFormChange}
                      className="mr-2"
                    />
                    <label htmlFor="clone-expiration-none">No expiration</label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="clone-expiration-days"
                      name="expiration_type"
                      value="days"
                      checked={cloneData.expiration_type === 'days'}
                      onChange={handleCloneFormChange}
                      className="mr-2"
                    />
                    <label htmlFor="clone-expiration-days">Expires in days</label>
                    {cloneData.expiration_type === 'days' && (
                      <input
                        type="number"
                        name="expiration_days"
                        value={cloneData.expiration_days}
                        onChange={handleCloneFormChange}
                        min="1"
                        max="365"
                        className="input ml-3 w-20"
                      />
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="clone-expiration-date"
                      name="expiration_type"
                      value="date"
                      checked={cloneData.expiration_type === 'date'}
                      onChange={handleCloneFormChange}
                      className="mr-2"
                    />
                    <label htmlFor="clone-expiration-date">Expires on date</label>
                    {cloneData.expiration_type === 'date' && (
                      <input
                        type="date"
                        name="expiration_date"
                        value={cloneData.expiration_date}
                        onChange={handleCloneFormChange}
                        min={getTomorrowDate()}
                        className="input ml-3"
                      />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Security Features */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-medium mb-3 text-dark-900">Security Features</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="spoofing_protection"
                      name="spoofing_protection"
                      checked={cloneData.spoofing_protection}
                      onChange={handleCloneFormChange}
                      className="mr-2"
                    />
                    <label htmlFor="spoofing_protection" className="text-sm">
                      <span className="font-medium">Tamper-Proof Links</span>
                      <span className="block text-dark-500 text-xs">Verify link integrity using cryptographic hashes</span>
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enable_ip_restrictions"
                      name="enable_ip_restrictions"
                      checked={cloneData.enable_ip_restrictions}
                      onChange={handleCloneFormChange}
                      className="mr-2"
                    />
                    <label htmlFor="enable_ip_restrictions" className="text-sm">
                      <span className="font-medium">IP-Based Restrictions</span>
                      <span className="block text-dark-500 text-xs">Block specific IP addresses from accessing your link</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="tag_ids" className="label">Tags</label>
                <TagSelector
                  selectedTags={cloneData.tag_ids.map(id => ({ id }))}
                  onChange={(tags) => setCloneData(prev => ({ ...prev, tag_ids: tags.map(tag => tag.id) }))}
                />
              </div>
              
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCloneModal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={cloneLoading}
                  className="btn btn-primary"
                >
                  {cloneLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Cloning...
                    </>
                  ) : (
                    'Clone URL'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage; 