import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiChevronDown, FiChevronUp, FiCalendar, FiClock, FiCheck, FiX, FiExternalLink } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const AdvancedOptionsForm = ({ formData, setFormData }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRedirectExpanded, setIsRedirectExpanded] = useState(false);
  
  const handleExpirationTypeChange = (type) => {
    setFormData({
      ...formData,
      expiration_type: type,
      expiration_date: type === 'date' ? formData.expiration_date || new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000) : null,
      expiration_days: type === 'days' ? formData.expiration_days || 7 : null
    });
  };
  
  const handleRedirectPageToggle = (useRedirect) => {
    setFormData({
      ...formData,
      use_redirect_page: useRedirect,
      redirect_page_type: useRedirect ? (formData.redirect_page_type || 'default') : 'default'
    });
  };
  
  const handleRedirectTypeChange = (type) => {
    setFormData({
      ...formData,
      redirect_page_type: type
    });
  };
  
  return (
    <div className="mt-6">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-medium text-dark-900">Advanced Options</h3>
        {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
      </div>
      
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 space-y-6"
        >
          {/* Expiration settings */}
          <div className="space-y-3">
            <h4 className="text-md font-medium text-dark-800">URL Expiration</h4>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={`px-4 py-2 rounded-md border ${
                  formData.expiration_type === 'none'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-300 text-dark-500 hover:bg-gray-50'
                }`}
                onClick={() => handleExpirationTypeChange('none')}
              >
                {formData.expiration_type === 'none' && <FiCheck className="inline mr-1" />}
                Never expires
              </button>
              
              <button
                type="button"
                className={`px-4 py-2 rounded-md border flex items-center ${
                  formData.expiration_type === 'days'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-300 text-dark-500 hover:bg-gray-50'
                }`}
                onClick={() => handleExpirationTypeChange('days')}
              >
                {formData.expiration_type === 'days' && <FiCheck className="mr-1" />}
                <FiClock className="mr-1" /> Expires in days
              </button>
              
              <button
                type="button"
                className={`px-4 py-2 rounded-md border flex items-center ${
                  formData.expiration_type === 'date'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-300 text-dark-500 hover:bg-gray-50'
                }`}
                onClick={() => handleExpirationTypeChange('date')}
              >
                {formData.expiration_type === 'date' && <FiCheck className="mr-1" />}
                <FiCalendar className="mr-1" /> Specific date
              </button>
            </div>
            
            {formData.expiration_type === 'days' && (
              <div className="flex items-center">
                <label htmlFor="expiration_days" className="mr-2 text-dark-700">Days:</label>
                <input
                  type="number"
                  id="expiration_days"
                  min="1"
                  max="365"
                  value={formData.expiration_days || 7}
                  onChange={(e) => setFormData({ ...formData, expiration_days: parseInt(e.target.value) })}
                  className="w-24 border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            )}
            
            {formData.expiration_type === 'date' && (
              <div>
                <DatePicker
                  selected={formData.expiration_date ? new Date(formData.expiration_date) : null}
                  onChange={(date) => setFormData({ ...formData, expiration_date: date })}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="MMMM d, yyyy h:mm aa"
                  minDate={new Date()}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            )}
          </div>
          
          {/* Custom redirect page settings */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setIsRedirectExpanded(!isRedirectExpanded)}
            >
              <h4 className="text-md font-medium text-dark-800">Custom Redirect Page</h4>
              {isRedirectExpanded ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={`px-4 py-2 rounded-md border flex items-center ${
                  !formData.use_redirect_page
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-300 text-dark-500 hover:bg-gray-50'
                }`}
                onClick={() => handleRedirectPageToggle(false)}
              >
                {!formData.use_redirect_page && <FiCheck className="mr-1" />}
                <FiExternalLink className="mr-1" /> Direct redirect
              </button>
              
              <button
                type="button"
                className={`px-4 py-2 rounded-md border flex items-center ${
                  formData.use_redirect_page
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-300 text-dark-500 hover:bg-gray-50'
                }`}
                onClick={() => handleRedirectPageToggle(true)}
              >
                {formData.use_redirect_page && <FiCheck className="mr-1" />}
                Custom redirect page
              </button>
            </div>
            
            {formData.use_redirect_page && isRedirectExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 mt-3 pl-3 border-l-2 border-gray-100"
              >
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-dark-700">Animation Type</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={`px-3 py-1 rounded-md text-sm ${
                        formData.redirect_page_type === 'default'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-dark-500 hover:bg-gray-200'
                      }`}
                      onClick={() => handleRedirectTypeChange('default')}
                    >
                      Default
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1 rounded-md text-sm ${
                        formData.redirect_page_type === 'rocket'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-dark-500 hover:bg-gray-200'
                      }`}
                      onClick={() => handleRedirectTypeChange('rocket')}
                    >
                      Rocket
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1 rounded-md text-sm ${
                        formData.redirect_page_type === 'working'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-dark-500 hover:bg-gray-200'
                      }`}
                      onClick={() => handleRedirectTypeChange('working')}
                    >
                      Working
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1 rounded-md text-sm ${
                        formData.redirect_page_type === 'digging'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-dark-500 hover:bg-gray-200'
                      }`}
                      onClick={() => handleRedirectTypeChange('digging')}
                    >
                      Digging
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="redirect_delay" className="block text-sm font-medium text-dark-700">
                    Redirect Delay (seconds)
                  </label>
                  <input
                    type="range"
                    id="redirect_delay"
                    min="1"
                    max="10"
                    value={formData.redirect_delay || 3}
                    onChange={(e) => setFormData({ ...formData, redirect_delay: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-dark-500">
                    <span>1s</span>
                    <span>{formData.redirect_delay || 3}s</span>
                    <span>10s</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="custom_redirect_message" className="block text-sm font-medium text-dark-700">
                    Custom Message (optional)
                  </label>
                  <input
                    type="text"
                    id="custom_redirect_message"
                    placeholder="Redirecting to your destination..."
                    value={formData.custom_redirect_message || ''}
                    onChange={(e) => setFormData({ ...formData, custom_redirect_message: e.target.value })}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="brand_name" className="block text-sm font-medium text-dark-700">
                    Brand Name (optional)
                  </label>
                  <input
                    type="text"
                    id="brand_name"
                    placeholder="Your Company Name"
                    value={formData.brand_name || ''}
                    onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="brand_logo_url" className="block text-sm font-medium text-dark-700">
                    Brand Logo URL (optional)
                  </label>
                  <input
                    type="url"
                    id="brand_logo_url"
                    placeholder="https://example.com/logo.png"
                    value={formData.brand_logo_url || ''}
                    onChange={(e) => setFormData({ ...formData, brand_logo_url: e.target.value })}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AdvancedOptionsForm; 