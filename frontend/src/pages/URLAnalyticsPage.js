import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiBarChart2, FiGlobe, FiClock, FiCalendar, FiCopy, FiCheckCircle, FiAlertCircle, FiToggleLeft, FiToggleRight, FiSmartphone, FiMonitor, FiTablet, FiUser, FiGitBranch, FiEye, FiExternalLink } from 'react-icons/fi';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import urlService from '../services/urlService';
import ABTestingStats from '../components/url/ABTestingStats';

const URLAnalyticsPage = () => {
  const { id } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [statusToggling, setStatusToggling] = useState(false);
  const [updatingPreview, setUpdatingPreview] = useState(false);
  
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
    if (!dateStr) return '';
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
  
  const handleToggleStatus = async () => {
    if (!analytics?.url) return;
    
    setStatusToggling(true);
    
    try {
      const updatedUrl = await urlService.toggleUrlStatus(
        analytics.url.id, 
        !analytics.url.is_active
      );
      
      // Update analytics with the new URL data
      setAnalytics({
        ...analytics,
        url: updatedUrl
      });
    } catch (err) {
      console.error('Error toggling URL status:', err);
      setError('Failed to update URL status. Please try again.');
    } finally {
      setStatusToggling(false);
    }
  };
  
  // Check if URL is expired
  const isExpired = (url) => {
    if (!url || !url.expires_at) return false;
    return new Date(url.expires_at) < new Date();
  };
  
  // Process device data to handle "Unknown" devices better
  const processDeviceData = (deviceData) => {
    if (!deviceData || !Array.isArray(deviceData) || deviceData.length === 0) {
      return [{ name: 'No Data', value: 1 }];
    }
    
    // Map device types to more user-friendly names and icons
    return deviceData.map(item => {
      const deviceName = item.device || 'Unknown';
      let displayName = deviceName;
      
      // For visualization, group similar devices
      if (deviceName.toLowerCase().includes('iphone') || 
          deviceName.toLowerCase().includes('android') ||
          deviceName.toLowerCase().includes('mobile')) {
        displayName = 'Mobile';
      } else if (deviceName.toLowerCase().includes('ipad') || 
                deviceName.toLowerCase().includes('tablet')) {
        displayName = 'Tablet';  
      } else if (deviceName.toLowerCase() === 'unknown' || 
                deviceName.toLowerCase() === 'other') {
        displayName = 'Unknown Device';
      } else {
        displayName = 'Desktop';
      }
      
      return {
        name: displayName,
        value: item.count,
        originalName: deviceName
      };
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
  
  // Add this section to display the location data
  const LocationSection = ({ analytics }) => {
    if (!analytics || !analytics.clicks_by_country || analytics.clicks_by_country.length === 0) {
      return null;
    }
    
    return (
      <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-soft p-6">
        <h3 className="text-lg font-display font-medium text-dark-900 mb-4">
          Location Analytics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Country chart */}
          <div>
            <h4 className="text-base font-medium text-dark-800 mb-3">Top Countries</h4>
            <div className="h-60">
              {analytics.clicks_by_country.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.clicks_by_country.map(item => ({
                      name: item.country || 'Unknown',
                      clicks: item.count
                    }))}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      width={80}
                    />
                    <Tooltip />
                    <Bar dataKey="clicks" fill="#0ea5e9" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-dark-400">No country data available</p>
                </div>
              )}
            </div>
          </div>
          
          {/* City table */}
          <div>
            <h4 className="text-base font-medium text-dark-800 mb-3">Top Cities</h4>
            {analytics.clicks_by_city && analytics.clicks_by_city.length > 0 ? (
              <div className="overflow-auto h-60 rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                        City
                      </th>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                        Country
                      </th>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                        Clicks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.clicks_by_city.map((city, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-dark-800">
                          {city.city || 'Unknown'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-dark-700">
                          {city.country || 'Unknown'}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-dark-700">
                          {city.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex h-60 items-center justify-center border border-gray-200 rounded-lg">
                <p className="text-dark-400">No city data available</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  // Add this section to display recent visitors with IP data
  const RecentVisitorsSection = ({ analytics }) => {
    if (!analytics || !analytics.recent_clicks || analytics.recent_clicks.length === 0) {
      return null;
    }
    
    return (
      <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-soft p-6">
        <h3 className="text-lg font-display font-medium text-dark-900 mb-4">
          Recent Visitors
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                  Time
                </th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                  Location
                </th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                  Device / Browser
                </th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                  OS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.recent_clicks.map((click, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-dark-700">
                    {new Date(click.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-mono text-dark-700">
                    {click.ip_address || 'Unknown'}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-dark-700">
                    {click.city ? `${click.city}, ` : ''}{click.country || 'Unknown'}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-dark-700">
                    {click.device || 'Unknown'} / {(click.browser || 'Unknown').split(' ')[0]}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-dark-700">
                    {(click.os || 'Unknown').split(' ')[0]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    );
  };
  
  // Add this section after LocationSection
  const ABTestingSection = ({ analytics }) => {
    if (!analytics || !analytics.url || !analytics.url.is_ab_test || !analytics.url.variants || analytics.url.variants.length === 0) {
      return null;
    }
    
    return (
      <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-soft p-6">
        <div className="flex items-center mb-4">
          <div className="h-8 w-8 rounded-md bg-secondary-500 text-white flex items-center justify-center mr-3">
            <FiGitBranch className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-display font-medium text-dark-900">A/B Testing Analytics</h3>
        </div>
        
        <ABTestingStats variants={analytics.url.variants} />
      </motion.div>
    );
  };
  
  // Add Retention Metrics Section
  const RetentionMetricsSection = ({ analytics }) => {
    if (!analytics || !analytics.retention) {
      return null;
    }
    
    const { retention } = analytics;
    
    // Prepare data for return visit distribution chart
    const returnVisitData = retention.return_visit_distribution 
      ? retention.return_visit_distribution.map(item => ({
          name: `${item.visit_count} visits`,
          value: item.session_count
        }))
      : [];
    
    return (
      <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-soft p-6">
        <h3 className="text-lg font-display font-medium text-dark-900 mb-4">
          Visitor Retention Analysis
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* 1-Day Retention */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-dark-600 mb-1">1-Day Retention</h4>
            <div className="flex items-end">
              <span className="text-2xl font-display font-bold text-primary-600">
                {retention.one_day_retention_rate}%
              </span>
              <span className="text-xs text-dark-500 ml-2 mb-1">
                ({retention.one_day_retention} visitors)
              </span>
            </div>
          </div>
          
          {/* 7-Day Retention */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-dark-600 mb-1">7-Day Retention</h4>
            <div className="flex items-end">
              <span className="text-2xl font-display font-bold text-primary-600">
                {retention.seven_day_retention_rate}%
              </span>
              <span className="text-xs text-dark-500 ml-2 mb-1">
                ({retention.seven_day_retention} visitors)
              </span>
            </div>
          </div>
          
          {/* 30-Day Retention */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-dark-600 mb-1">30-Day Retention</h4>
            <div className="flex items-end">
              <span className="text-2xl font-display font-bold text-primary-600">
                {retention.thirty_day_retention_rate}%
              </span>
              <span className="text-xs text-dark-500 ml-2 mb-1">
                ({retention.thirty_day_retention} visitors)
              </span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Return Visit Distribution Chart */}
          <div>
            <h4 className="text-base font-medium text-dark-800 mb-3">Return Visit Distribution</h4>
            <div className="h-60">
              {returnVisitData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={returnVisitData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {returnVisitData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} sessions`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-dark-400">No return visit data available</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Retention Stats */}
          <div>
            <h4 className="text-base font-medium text-dark-800 mb-3">Retention Statistics</h4>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-dark-500">Total Sessions</p>
                    <p className="text-lg font-display font-semibold">{retention.total_sessions}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-dark-500">Avg. Return Time</p>
                    <p className="text-lg font-display font-semibold">
                      {retention.avg_return_time_hours 
                        ? `${retention.avg_return_time_hours} hours` 
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Key Insights</p>
                <ul className="text-xs text-dark-500 space-y-1">
                  <li>• {retention.one_day_retention_rate > 5 
                    ? `Strong 1-day retention at ${retention.one_day_retention_rate}%` 
                    : `Low 1-day retention at ${retention.one_day_retention_rate}%`}</li>
                  <li>• {retention.seven_day_retention_rate > 2 
                    ? `Good 7-day retention at ${retention.seven_day_retention_rate}%` 
                    : `Weak 7-day retention at ${retention.seven_day_retention_rate}%`}</li>
                  <li>• Average visitor returns in {retention.avg_return_time_hours || 'N/A'} hours</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Add Funnel Analysis Section
  const FunnelAnalysisSection = ({ analytics }) => {
    if (!analytics || !analytics.funnel) {
      return null;
    }
    
    const { funnel } = analytics;
    const { stages, drop_offs } = funnel;
    
    // Calculate conversion percentages
    const destinationRate = stages.total_clicks > 0 
      ? (stages.reached_destination / stages.total_clicks * 100).toFixed(1) 
      : 0;
      
    const actionRate = stages.reached_destination > 0 
      ? (stages.completed_action / stages.reached_destination * 100).toFixed(1) 
      : 0;
      
    const overallRate = stages.total_clicks > 0 
      ? (stages.completed_action / stages.total_clicks * 100).toFixed(1) 
      : 0;
    
    // Prepare data for funnel chart
    const funnelData = [
      { name: 'Clicks', value: stages.total_clicks },
      { name: 'Destination', value: stages.reached_destination },
      { name: 'Action Completed', value: stages.completed_action }
    ];
    
    return (
      <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-soft p-6">
        <h3 className="text-lg font-display font-medium text-dark-900 mb-4">
          Conversion Funnel Analysis
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Click to Destination */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-dark-600 mb-1">Click → Destination</h4>
            <div className="flex items-end">
              <span className="text-2xl font-display font-bold text-accent-600">
                {destinationRate}%
              </span>
              <span className="text-xs text-dark-500 ml-2 mb-1">
                conversion rate
              </span>
            </div>
            <div className="mt-2 text-xs text-red-500">
              {drop_offs.click_to_destination}% drop-off
            </div>
          </div>
          
          {/* Destination to Action */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-dark-600 mb-1">Destination → Action</h4>
            <div className="flex items-end">
              <span className="text-2xl font-display font-bold text-accent-600">
                {actionRate}%
              </span>
              <span className="text-xs text-dark-500 ml-2 mb-1">
                conversion rate
              </span>
            </div>
            <div className="mt-2 text-xs text-red-500">
              {drop_offs.destination_to_action}% drop-off
            </div>
          </div>
          
          {/* Overall Conversion */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-dark-600 mb-1">Overall Conversion</h4>
            <div className="flex items-end">
              <span className="text-2xl font-display font-bold text-accent-600">
                {overallRate}%
              </span>
              <span className="text-xs text-dark-500 ml-2 mb-1">
                conversion rate
              </span>
            </div>
            <div className="mt-2 text-xs text-red-500">
              {drop_offs.overall_drop_off}% drop-off
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Funnel Visualization */}
          <div>
            <h4 className="text-base font-medium text-dark-800 mb-3">Funnel Stages</h4>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={funnelData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium mb-2">Funnel Insights</p>
          <ul className="text-xs text-dark-500 space-y-1">
            <li>• {drop_offs.click_to_destination > 50 
              ? `High drop-off (${drop_offs.click_to_destination}%) between clicks and destination visits` 
              : `Good destination visit rate with only ${drop_offs.click_to_destination}% drop-off`}</li>
            <li>• {drop_offs.destination_to_action > 70 
              ? `Very high drop-off (${drop_offs.destination_to_action}%) from destination to action completion` 
              : drop_offs.destination_to_action > 40 
                ? `Moderate drop-off (${drop_offs.destination_to_action}%) from destination to action completion`
                : `Strong action completion rate with only ${drop_offs.destination_to_action}% drop-off`}</li>
            <li>• Overall funnel efficiency: {overallRate > 25 
              ? 'Excellent' 
              : overallRate > 10 
                ? 'Good' 
                : overallRate > 5 
                  ? 'Average' 
                  : 'Poor'}</li>
          </ul>
        </div>
      </motion.div>
    );
  };
  
  // Add PreviewSection component after the LocationSection component
  const PreviewSection = ({ url, onUpdatePreview, isUpdating }) => {
    if (!url) return null;
    
    const hasPreviewData = url.enable_preview && 
      (url.preview_image || url.preview_title || url.preview_description);
    
    return (
      <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-soft p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-display font-medium text-dark-900">
            <FiEye className="inline mr-2" /> Destination Preview
          </h3>
          
          <button
            onClick={onUpdatePreview}
            disabled={isUpdating}
            className="btn btn-sm btn-outline"
          >
            {isUpdating ? 'Updating...' : 'Update Preview'}
          </button>
        </div>
        
        {url.enable_preview ? (
          hasPreviewData ? (
            <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
              {url.preview_image && (
                <div className="relative h-64 bg-gray-100">
                  <img 
                    src={url.preview_image} 
                    alt={url.preview_title || "Preview"} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-4">
                {url.preview_title && (
                  <h3 className="font-medium text-lg mb-2 text-dark-900">
                    {url.preview_title}
                  </h3>
                )}
                
                {url.preview_description && (
                  <p className="text-dark-600 text-sm mb-4">
                    {url.preview_description}
                  </p>
                )}
                
                {url.preview_updated_at && (
                  <div className="text-sm text-dark-500 flex items-center">
                    <FiCalendar className="mr-1" />
                    <span>Updated: {new Date(url.preview_updated_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
              
              <div className="p-3 bg-gray-50 border-t border-gray-200">
                <a 
                  href={url.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline flex items-center justify-center"
                >
                  Visit website <FiExternalLink className="ml-1" />
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <FiEye className="mx-auto text-gray-400 text-4xl mb-3" />
              <p className="text-dark-500">Preview is enabled but no preview data has been generated yet.</p>
              <p className="text-sm text-dark-400 mt-2">
                Click "Update Preview" to fetch content from the destination URL.
              </p>
            </div>
          )
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <FiEye className="mx-auto text-gray-400 text-4xl mb-3" />
            <p className="text-dark-500">Preview is not enabled for this URL.</p>
            <p className="text-sm text-dark-400 mt-2">
              Enable preview in URL settings to show a preview of the destination content.
            </p>
          </div>
        )}
      </motion.div>
    );
  };
  
  // Add handleUpdatePreview function
  const handleUpdatePreview = async () => {
    if (!analytics?.url) return;
    
    setUpdatingPreview(true);
    
    try {
      const result = await urlService.updatePreview(id);
      if (result && result.success) {
        // Update analytics with the new preview data
        setAnalytics({
          ...analytics,
          url: {
            ...analytics.url,
            enable_preview: true,
            preview_title: result.preview.title,
            preview_description: result.preview.description,
            preview_image: result.preview.image,
            preview_updated_at: result.preview.updated_at
          }
        });
      }
    } catch (err) {
      console.error('Error updating preview:', err);
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
                    {analytics.url.title && (
                      <div className="mt-1 text-dark-500 text-sm">
                        Title: {analytics.url.title}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 md:mt-0 space-y-2">
                    <div className="flex items-center">
                      {analytics.url.is_active && !isExpired(analytics.url) ? (
                        <span className="flex h-3 w-3 relative mr-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-500"></span>
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full h-3 w-3 bg-gray-300 mr-2"></span>
                      )}
                      <span className="text-sm text-dark-500">
                        {analytics.url.is_active ? (
                          isExpired(analytics.url) ? 'Expired' : 'Active'
                        ) : 'Inactive'}
                      </span>
                      <button
                        onClick={handleToggleStatus}
                        disabled={statusToggling}
                        className={`ml-2 ${analytics.url.is_active ? 'text-accent-500 hover:text-accent-700' : 'text-gray-400 hover:text-gray-600'}`}
                        title={analytics.url.is_active ? 'Deactivate URL' : 'Activate URL'}
                      >
                        {statusToggling ? (
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : analytics.url.is_active ? (
                          <FiToggleRight className="h-5 w-5" />
                        ) : (
                          <FiToggleLeft className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center text-sm text-dark-500">
                      <FiCalendar className="mr-1" /> Created: {new Date(analytics.url.created_at).toLocaleDateString()}
                    </div>
                    {analytics.url.expires_at && (
                      <div className={`flex items-center text-sm ${isExpired(analytics.url) ? 'text-red-500' : 'text-dark-500'}`}>
                        <FiClock className="mr-1" /> Expires: {new Date(analytics.url.expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
              
              {/* Preview Section - Add this new section */}
              <PreviewSection 
                url={analytics.url}
                onUpdatePreview={handleUpdatePreview}
                isUpdating={updatingPreview}
              />
              
              {/* Stats Overview */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-md bg-primary-500 text-white flex items-center justify-center mr-4">
                      <FiBarChart2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-dark-500 text-sm font-medium">Total Clicks</p>
                      <h3 className="text-2xl font-display font-bold text-dark-900">
                        {analytics.total_clicks || 0}
                      </h3>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-md bg-secondary-500 text-white flex items-center justify-center mr-4">
                      <FiUser className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-dark-500 text-sm font-medium">Unique Visitors</p>
                      <h3 className="text-2xl font-display font-bold text-dark-900">
                        {analytics.unique_visitors || 0}
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
                              name: (item.browser || 'Unknown').split(' ')[0], // Get just the browser name without version
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
                        <PieChart>
                          <Pie
                            data={processDeviceData(analytics.clicks_by_device)}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {processDeviceData(analytics.clicks_by_device).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name, props) => [
                              `${value} clicks`, 
                              props.payload.originalName || name
                            ]} 
                          />
                          <Legend />
                        </PieChart>
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
                              name: (item.os || 'Unknown').split(' ')[0], // Get just the OS name without version
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
              
              {/* Add the new location section */}
              <LocationSection analytics={analytics} />
              
              {/* Add the AB testing section */}
              <ABTestingSection analytics={analytics} />
              
              {/* Add the recent visitors section */}
              <RecentVisitorsSection analytics={analytics} />
              
              {/* Add Retention Metrics Section */}
              <RetentionMetricsSection analytics={analytics} />
              
              {/* Add Funnel Analysis Section */}
              <FunnelAnalysisSection analytics={analytics} />
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default URLAnalyticsPage; 