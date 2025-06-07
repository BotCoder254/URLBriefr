import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiTrash2, FiEdit, FiAlertCircle, FiCheck, FiShield, FiGlobe, FiLock } from 'react-icons/fi';
import urlService from '../services/urlService';
import toast from 'react-hot-toast';

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

const SecuritySettingsPage = () => {
  // IP Restrictions
  const [ipRestrictions, setIpRestrictions] = useState([]);
  const [newRestriction, setNewRestriction] = useState({
    restriction_type: 'block',
    ip_address: '',
    description: ''
  });
  const [editingRestriction, setEditingRestriction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);

  // Load IP restrictions
  useEffect(() => {
    const fetchIpRestrictions = async () => {
      try {
        setLoading(true);
        const data = await urlService.getIpRestrictions();
        setIpRestrictions(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching IP restrictions:', err);
        setError('Failed to load IP restrictions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchIpRestrictions();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewRestriction(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateIpAddress = (ip) => {
    // Simple validation for IPv4 addresses or CIDR notation
    if (ip.includes('/')) {
      // CIDR notation
      const [ipPart, cidrPart] = ip.split('/');
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      const cidrValue = parseInt(cidrPart, 10);
      return ipRegex.test(ipPart) && !isNaN(cidrValue) && cidrValue >= 0 && cidrValue <= 32;
    } else {
      // Regular IPv4 address
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      return ipRegex.test(ip);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate IP address
    if (!newRestriction.ip_address) {
      setFormError('IP address is required');
      return;
    }
    
    if (!validateIpAddress(newRestriction.ip_address)) {
      setFormError('Invalid IP address format. Use IPv4 format (e.g., 192.168.1.1) or CIDR notation (e.g., 192.168.1.0/24)');
      return;
    }
    
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      let result;
      
      if (editingRestriction) {
        // Update existing restriction
        result = await urlService.updateIpRestriction(editingRestriction.id, newRestriction);
        toast.success('IP restriction updated successfully');
        
        // Update state
        setIpRestrictions(prev => 
          prev.map(r => r.id === editingRestriction.id ? result : r)
        );
        
        // Reset editing state
        setEditingRestriction(null);
      } else {
        // Create new restriction
        result = await urlService.createIpRestriction(newRestriction);
        toast.success('IP restriction added successfully');
        
        // Add to state
        setIpRestrictions(prev => [...prev, result]);
      }
      
      // Reset form
      setNewRestriction({
        restriction_type: 'block',
        ip_address: '',
        description: ''
      });
    } catch (error) {
      console.error('Error submitting IP restriction:', error);
      setFormError(error.response?.data?.error || 'Failed to save IP restriction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this IP restriction?')) {
      return;
    }
    
    try {
      await urlService.deleteIpRestriction(id);
      toast.success('IP restriction deleted successfully');
      
      // Remove from state
      setIpRestrictions(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting IP restriction:', error);
      toast.error('Failed to delete IP restriction');
    }
  };

  const handleEdit = (restriction) => {
    setEditingRestriction(restriction);
    setNewRestriction({
      restriction_type: restriction.restriction_type,
      ip_address: restriction.ip_address,
      description: restriction.description || ''
    });
  };

  const handleCancel = () => {
    setEditingRestriction(null);
    setNewRestriction({
      restriction_type: 'block',
      ip_address: '',
      description: ''
    });
    setFormError(null);
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
          className="space-y-8"
        >
          <motion.div variants={itemVariants} className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-display font-bold text-dark-900">Security Settings</h1>
              <p className="mt-2 text-dark-500">
                Manage IP-based restrictions and security features for your links
              </p>
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

          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* IP Restrictions Section */}
            <div className="bg-white rounded-xl shadow-soft p-6">
              <div className="flex items-center mb-6">
                <FiGlobe className="text-primary-600 mr-2 h-5 w-5" />
                <h2 className="text-xl font-display font-semibold text-dark-900">IP Restrictions</h2>
              </div>
              
              <p className="text-dark-500 mb-6">
                Block or allow specific IP addresses or ranges from accessing your shortened links.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                {formError && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-start text-sm">
                    <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                
                <div>
                  <label htmlFor="restriction_type" className="block text-sm font-medium text-dark-700 mb-1">
                    Restriction Type
                  </label>
                  <select
                    id="restriction_type"
                    name="restriction_type"
                    value={newRestriction.restriction_type}
                    onChange={handleFormChange}
                    className="input w-full py-2"
                  >
                    <option value="block">Block List (deny specified IPs)</option>
                    <option value="allow">Allow List (allow only specified IPs)</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="ip_address" className="block text-sm font-medium text-dark-700 mb-1">
                    IP Address / Range
                  </label>
                  <input
                    id="ip_address"
                    name="ip_address"
                    type="text"
                    value={newRestriction.ip_address}
                    onChange={handleFormChange}
                    className="input w-full"
                    placeholder="e.g., 192.168.1.1 or 192.168.1.0/24"
                  />
                  <p className="mt-1 text-xs text-dark-500">
                    Enter a single IP (192.168.1.1) or a CIDR range (192.168.1.0/24)
                  </p>
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-dark-700 mb-1">
                    Description (Optional)
                  </label>
                  <input
                    id="description"
                    name="description"
                    type="text"
                    value={newRestriction.description}
                    onChange={handleFormChange}
                    className="input w-full"
                    placeholder="e.g., Office network"
                  />
                </div>
                
                <div className="flex space-x-3 pt-2">
                  {editingRestriction && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="btn btn-outline"
                    >
                      Cancel
                    </button>
                  )}
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {editingRestriction ? 'Updating...' : 'Adding...'}
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <FiPlus className="mr-1" />
                        {editingRestriction ? 'Update Restriction' : 'Add Restriction'}
                      </span>
                    )}
                  </button>
                </div>
              </form>
              
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-md font-medium text-dark-900 mb-4">Your IP Restrictions</h3>
                
                {ipRestrictions.length === 0 ? (
                  <div className="text-dark-500 text-sm py-4 text-center bg-gray-50 rounded-lg">
                    No IP restrictions added yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ipRestrictions.map(restriction => (
                      <div 
                        key={restriction.id} 
                        className="bg-gray-50 rounded-lg p-4 flex justify-between items-center"
                      >
                        <div>
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              restriction.restriction_type === 'block' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {restriction.restriction_type === 'block' ? 'Block' : 'Allow'}
                            </span>
                            <span className="ml-2 font-medium">{restriction.ip_address}</span>
                          </div>
                          {restriction.description && (
                            <div className="text-sm text-dark-500 mt-1">
                              {restriction.description}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(restriction)}
                            className="text-dark-400 hover:text-primary-600"
                          >
                            <FiEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(restriction.id)}
                            className="text-dark-400 hover:text-red-600"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Tamper-Proof Links Section */}
            <div className="bg-white rounded-xl shadow-soft p-6">
              <div className="flex items-center mb-6">
                <FiShield className="text-primary-600 mr-2 h-5 w-5" />
                <h2 className="text-xl font-display font-semibold text-dark-900">Tamper-Proof Links</h2>
              </div>
              
              <p className="text-dark-500 mb-6">
                Protect your links from tampering with cryptographic verification. This feature helps ensure the integrity of your links.
              </p>
              
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-800 flex items-center">
                    <FiLock className="mr-2" />
                    How Tamper-Proof Links Work
                  </h3>
                  <p className="mt-2 text-blue-700 text-sm">
                    When enabled, a cryptographic hash is generated for your link. If someone attempts to modify the link before redirecting, the system will detect it and prevent the redirect.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-dark-900">Enable By Default</h3>
                      <p className="text-dark-500 text-sm">
                        Automatically enable tamper-proof protection for all new URLs
                      </p>
                    </div>
                    <div className="relative">
                      <label className="switch">
                        <input type="checkbox" />
                        <span className="slider round"></span>
                      </label>
                    </div>
                  </div>
                  
                  <p className="text-sm text-dark-500">
                    <FiCheck className="inline-block text-accent-500 mr-1" />
                    You can also enable or disable tamper-proof protection for individual links when creating or editing them.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SecuritySettingsPage;