import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiBarChart2, FiGlobe, FiClock, FiCalendar, FiCopy, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import urlService from '../services/urlService';

const URLAnalyticsPage = () => {
  const { id } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await urlService.getUrlStats(id);
        setAnalytics(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching URL analytics:', err);
        setError('Failed to load analytics data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [id]);

  // Format date for charts
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };
  
  const handleCopy = () => {
    if (!analytics?.url?.full_short_url) {
      console.error('Analytics URL or full_short_url is undefined');
      return;
    }
    
    navigator.clipboard.writeText(analytics.url.full_short_url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Could not copy text: ', err);
      });
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
  
  // COLORS for charts
  const COLORS = ['#0ea5e9', '#d946ef', '#10b981', '#f97316', '#f43f5e', '#8b5cf6'];
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start">
          <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
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
          <motion.div variants={itemVariants} className="flex items-center mb-4">
            <Link to="/dashboard" className="text-dark-500 hover:text-primary-600 flex items-center mr-4">
              <FiArrowLeft className="mr-1" /> Back to Dashboard
            </Link>
          </motion.div>
          
          {analytics?.url && (
            <>
              <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-soft p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-2xl font-display font-bold text-dark-900">URL Analytics</h1>
                    <div className="mt-2 flex items-center">
                      <span className="font-medium text-primary-600 mr-2">
                        {analytics.url.full_short_url || `${window.location.origin}/s/${analytics.url.short_code}`}
                      </span>
                      <button 
                        onClick={handleCopy}
                        className="text-dark-400 hover:text-dark-600"
                        title="Copy to clipboard"
                        disabled={!analytics?.url?.full_short_url}
                      >
                        {copied ? <FiCheckCircle className="text-accent-500" /> : <FiCopy />}
                      </button>
                    </div>
                    <div className="mt-1 text-dark-500 text-sm max-w-2xl truncate">
                      Original: <a href={analytics.url.original_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600">{analytics.url.original_url}</a>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
                    <div className="flex items-center text-sm text-dark-500">
                      <FiCalendar className="mr-1" /> Created: {new Date(analytics.url.created_at).toLocaleDateString()}
                    </div>
                    {analytics.url.expires_at && (
                      <div className="flex items-center text-sm text-dark-500">
                        <FiClock className="mr-1" /> Expires: {new Date(analytics.url.expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
              
              {/* Stats Overview */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-md bg-primary-500 text-white flex items-center justify-center mr-4">
                      <FiBarChart2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-dark-500 text-sm font-medium">Total Clicks</p>
                      <h3 className="text-2xl font-display font-bold text-dark-900">
                        {analytics.total_clicks}
                      </h3>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-md bg-secondary-500 text-white flex items-center justify-center mr-4">
                      <FiGlobe className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-dark-500 text-sm font-medium">Top Country</p>
                      <h3 className="text-2xl font-display font-bold text-dark-900">
                        {analytics.clicks_by_country && analytics.clicks_by_country.length > 0 
                          ? analytics.clicks_by_country[0].country || 'Unknown' 
                          : 'N/A'}
                      </h3>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-md bg-accent-500 text-white flex items-center justify-center mr-4">
                      <FiClock className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-dark-500 text-sm font-medium">Last Accessed</p>
                      <h3 className="text-lg font-display font-bold text-dark-900">
                        {analytics.url.last_accessed ? new Date(analytics.url.last_accessed).toLocaleString() : 'Never'}
                      </h3>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Charts Row 1 */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Clicks Over Time Chart */}
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <h3 className="text-lg font-display font-medium text-dark-900 mb-4">
                    Clicks Over Time (Last 30 Days)
                  </h3>
                  <div className="h-72">
                    {analytics.clicks_by_date && analytics.clicks_by_date.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={analytics.clicks_by_date.map(item => ({
                            date: formatDate(item.date),
                            clicks: item.count
                          }))}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="clicks" 
                            stroke="#0ea5e9" 
                            strokeWidth={2}
                            activeDot={{ r: 8 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-dark-400">No click data available for the last 30 days</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Browser Chart */}
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <h3 className="text-lg font-display font-medium text-dark-900 mb-4">
                    Clicks by Browser
                  </h3>
                  <div className="h-72">
                    {analytics.clicks_by_browser && analytics.clicks_by_browser.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.clicks_by_browser.map(item => ({
                              name: item.browser || 'Unknown',
                              value: item.count
                            }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {analytics.clicks_by_browser.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} clicks`, 'Clicks']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-dark-400">No browser data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
              
              {/* Charts Row 2 */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Device Chart */}
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <h3 className="text-lg font-display font-medium text-dark-900 mb-4">
                    Clicks by Device
                  </h3>
                  <div className="h-72">
                    {analytics.clicks_by_device && analytics.clicks_by_device.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analytics.clicks_by_device.map(item => ({
                            name: item.device || 'Unknown',
                            clicks: item.count
                          }))}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="clicks" fill="#0ea5e9" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-dark-400">No device data available</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* OS Chart */}
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <h3 className="text-lg font-display font-medium text-dark-900 mb-4">
                    Clicks by Operating System
                  </h3>
                  <div className="h-72">
                    {analytics.clicks_by_os && analytics.clicks_by_os.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.clicks_by_os.map(item => ({
                              name: item.os || 'Unknown',
                              value: item.count
                            }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {analytics.clicks_by_os.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} clicks`, 'Clicks']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-dark-400">No OS data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default URLAnalyticsPage; 