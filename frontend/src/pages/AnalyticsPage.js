import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FiBarChart2, FiPieChart, FiTrendingUp, FiGlobe, FiMonitor, FiSmartphone, 
  FiAlertCircle, FiClock, FiCalendar, FiLink, FiExternalLink, FiCheckCircle 
} from 'react-icons/fi';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import urlService from '../services/urlService';

const AnalyticsPage = () => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const data = await urlService.getDashboardStats();
        setDashboardStats(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load analytics data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardStats();
  }, []);

  // Format date for charts
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };
  
  // Format time for display
  const formatTime = (hour) => {
    if (hour === undefined || hour === null) return '';
    return `${hour}:00`;
  };
  
  // COLORS for charts
  const COLORS = ['#0ea5e9', '#d946ef', '#10b981', '#f97316', '#f43f5e', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f59e0b'];
  
  // Get hours of the day data with empty values for missing hours
  const getHourlyData = (hourlyData) => {
    if (!hourlyData || !Array.isArray(hourlyData)) return [];
    
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const hourMap = {};
    
    hourlyData.forEach(item => {
      hourMap[item.hour] = item.count;
    });
    
    return hours.map(hour => ({
      hour: formatTime(hour),
      count: hourMap[hour] || 0
    }));
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
          <motion.div variants={itemVariants}>
            <h1 className="text-3xl font-display font-bold text-dark-900">Analytics Dashboard</h1>
            <p className="mt-2 text-dark-500">
              Get insights into your shortened URL performance
            </p>
          </motion.div>
          
          {dashboardStats && (
            <>
              {/* Stats Overview */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-md bg-primary-500 text-white flex items-center justify-center mr-4">
                      <FiLink className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-dark-500 text-sm font-medium">Total URLs</p>
                      <h3 className="text-2xl font-display font-bold text-dark-900">
                        {dashboardStats.total_urls || 0}
                      </h3>
                      <span className="text-xs text-accent-600">
                        {dashboardStats.active_urls || 0} active
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-md bg-secondary-500 text-white flex items-center justify-center mr-4">
                      <FiTrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-dark-500 text-sm font-medium">Total Clicks</p>
                      <h3 className="text-2xl font-display font-bold text-dark-900">
                        {dashboardStats.total_clicks || 0}
                      </h3>
                      <span className="text-xs text-accent-600">
                        {dashboardStats.clicks_last_24h || 0} in last 24h
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-md bg-accent-500 text-white flex items-center justify-center mr-4">
                      <FiBarChart2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-dark-500 text-sm font-medium">Avg. Clicks Per URL</p>
                      <h3 className="text-2xl font-display font-bold text-dark-900">
                        {dashboardStats.total_urls > 0 ? 
                          (dashboardStats.total_clicks / dashboardStats.total_urls).toFixed(1) : 
                          '0.0'}
                      </h3>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-md bg-primary-700 text-white flex items-center justify-center mr-4">
                      <FiClock className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-dark-500 text-sm font-medium">Recently Created</p>
                      <h3 className="text-2xl font-display font-bold text-dark-900">
                        {dashboardStats.recent_urls?.length || 0}
                      </h3>
                      <span className="text-xs text-accent-600">
                        new URLs
                      </span>
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
                    {dashboardStats.clicks_by_date && dashboardStats.clicks_by_date.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={dashboardStats.clicks_by_date.map(item => ({
                            date: formatDate(item.date),
                            clicks: item.count
                          }))}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="clicks" 
                            stroke="#0ea5e9" 
                            fill="#0ea5e9" 
                            fillOpacity={0.2}
                            activeDot={{ r: 8 }} 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-dark-400">No click data available for the last 30 days</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Clicks by Hour Chart */}
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <h3 className="text-lg font-display font-medium text-dark-900 mb-4">
                    Clicks by Time of Day
                  </h3>
                  <div className="h-72">
                    {dashboardStats.clicks_by_hour && dashboardStats.clicks_by_hour.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={getHourlyData(dashboardStats.clicks_by_hour)}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="hour" />
                          <YAxis />
                          <Tooltip />
                          <Bar 
                            dataKey="count" 
                            name="Clicks"
                            fill="#d946ef" 
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-dark-400">No hourly data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
              
              {/* Charts Row 2 */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Device Chart */}
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <h3 className="text-lg font-display font-medium text-dark-900 mb-4">
                    Clicks by Device
                  </h3>
                  <div className="h-64">
                    {dashboardStats.clicks_by_device && dashboardStats.clicks_by_device.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dashboardStats.clicks_by_device.map(item => ({
                              name: item.device || 'Unknown',
                              value: item.count
                            }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {dashboardStats.clicks_by_device.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} clicks`, 'Clicks']} />
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
                
                {/* Browser Chart */}
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <h3 className="text-lg font-display font-medium text-dark-900 mb-4">
                    Clicks by Browser
                  </h3>
                  <div className="h-64">
                    {dashboardStats.clicks_by_browser && dashboardStats.clicks_by_browser.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dashboardStats.clicks_by_browser.map(item => ({
                              name: (item.browser || 'Unknown').split(' ')[0], // Get just the browser name without version
                              value: item.count
                            }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {dashboardStats.clicks_by_browser.map((entry, index) => (
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
                
                {/* OS Chart */}
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <h3 className="text-lg font-display font-medium text-dark-900 mb-4">
                    Clicks by Operating System
                  </h3>
                  <div className="h-64">
                    {dashboardStats.clicks_by_os && dashboardStats.clicks_by_os.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dashboardStats.clicks_by_os.map(item => ({
                              name: (item.os || 'Unknown').split(' ')[0], // Get just the OS name without version
                              value: item.count
                            }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {dashboardStats.clicks_by_os.map((entry, index) => (
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
              
              {/* Country Clicks Map */}
              {dashboardStats.clicks_by_country && dashboardStats.clicks_by_country.length > 0 && (
                <motion.div variants={itemVariants}>
                  <div className="bg-white rounded-xl shadow-soft p-6">
                    <h3 className="text-lg font-display font-medium text-dark-900 mb-4">
                      Clicks by Country
                    </h3>
                    <div className="overflow-hidden">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="h-60">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={dashboardStats.clicks_by_country.map(item => ({
                                name: item.country || 'Unknown',
                                clicks: item.count
                              }))}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                              layout="vertical"
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis dataKey="name" type="category" width={100} />
                              <Tooltip />
                              <Bar 
                                dataKey="clicks" 
                                fill="#10b981" 
                                radius={[0, 4, 4, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="overflow-auto h-60 rounded-lg border border-gray-200">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                                  Country
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                                  Clicks
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                                  Percentage
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {dashboardStats.clicks_by_country.map((country, index) => {
                                const total = dashboardStats.clicks_by_country.reduce((sum, item) => sum + item.count, 0);
                                const percentage = ((country.count / total) * 100).toFixed(1);
                                
                                return (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-dark-800">
                                      {country.country || 'Unknown'}
                                    </td>
                                    <td className="px-6 py-2 whitespace-nowrap text-sm text-dark-700">
                                      {country.count}
                                    </td>
                                    <td className="px-6 py-2 whitespace-nowrap text-sm text-dark-700">
                                      {percentage}%
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Top URLs Table */}
              <motion.div variants={itemVariants}>
                <div className="bg-white rounded-xl shadow-soft p-6">
                  <h3 className="text-lg font-display font-medium text-dark-900 mb-4">
                    Top Performing URLs
                  </h3>
                  
                  {dashboardStats.top_urls && dashboardStats.top_urls.length > 0 ? (
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
                          {dashboardStats.top_urls.map((url) => (
                            <tr key={url.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">
                                {url.full_short_url ? (
                                  <a href={url.full_short_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    {url.full_short_url.split('/').pop()}
                                  </a>
                                ) : (
                                  url.short_code
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-500">
                                <div className="max-w-xs truncate">
                                  {url.original_url}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-900">
                                <span className="px-2 py-1 text-xs font-medium bg-accent-100 text-accent-800 rounded-full">
                                  {url.access_count}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-500">
                                {new Date(url.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-500">
                                <div className="flex space-x-3">
                                  <Link 
                                    to={`/analytics/${url.id}`} 
                                    className="text-primary-600 hover:text-primary-800"
                                    title="View detailed analytics"
                                  >
                                    <FiBarChart2 />
                                  </Link>
                                  <a 
                                    href={url.original_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-dark-500 hover:text-dark-700"
                                    title="Visit original URL"
                                  >
                                    <FiExternalLink />
                                  </a>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-6 text-center">
                      <p className="text-dark-400">No URL data available</p>
                    </div>
                  )}
                </div>
              </motion.div>
              
              {/* Recent Activity */}
              {dashboardStats.recent_clicks && dashboardStats.recent_clicks.length > 0 && (
                <motion.div variants={itemVariants}>
                  <div className="bg-white rounded-xl shadow-soft p-6">
                    <h3 className="text-lg font-display font-medium text-dark-900 mb-4">
                      Recent Click Activity
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                              Time
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                              URL
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                              Device
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                              Browser
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {dashboardStats.recent_clicks.map((click, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-dark-500">
                                {new Date(click.timestamp).toLocaleString()}
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-primary-600">
                                {click.url__short_code}
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-dark-700">
                                {click.device || 'Unknown'}
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-dark-700">
                                {click.browser || 'Unknown'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsPage; 