import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLink, FiCopy, FiTrash2, FiEdit, FiPlus, FiX, FiAlertCircle, FiCheckCircle, FiExternalLink, FiSearch, FiBarChart2, FiToggleLeft, FiToggleRight, FiCalendar, FiClock, FiEye, FiGrid, FiTag, FiFolder, FiFilter, FiSettings, FiAlertTriangle } from 'react-icons/fi';
import urlService from '../services/urlService';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SelfDestructDashboard = () => {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive'
  const [sortBy, setSortBy] = useState('created_at'); // 'created_at', 'access_count', 'short_code'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [statsData, setStatsData] = useState({
    totalSelfDestructLinks: 0,
    activeLinks: 0,
    destroyedLinks: 0,
    averageClicks: 0,
    clicksToDestruction: []
  });

  // Define fetchUrls before it's used in useEffect
  const fetchUrls = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build filters object
      const filters = {
        self_destruct: true // Only fetch self-destructing links
      };
      
      // Add search term filter
      if (searchTerm) {
        filters.search = searchTerm;
      }
      
      const data = await urlService.getUserUrls(filters);
      setUrls(data);
      
      // Calculate stats
      const activeLinks = data.filter(url => url.is_active && !url.is_expired).length;
      const destroyedLinks = data.filter(url => !url.is_active || url.is_expired).length;
      const totalClicks = data.reduce((sum, url) => sum + url.access_count, 0);
      const averageClicks = data.length > 0 ? Math.round(totalClicks / data.length) : 0;
      
      // Prepare data for clicks to destruction chart
      const clicksToDestruction = data.map(url => ({
        name: url.short_code,
        total: url.max_clicks || 0,
        remaining: url.remaining_clicks || 0,
        used: (url.max_clicks || 0) - (url.remaining_clicks || 0)
      }));
      
      setStatsData({
        totalSelfDestructLinks: data.length,
        activeLinks,
        destroyedLinks,
        averageClicks,
        clicksToDestruction
      });
      
      setError(null);
    } catch (err) {
      console.error('Error fetching URLs:', err);
      setError('Failed to load your self-destructing URLs. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);
  
  useEffect(() => {
    fetchUrls();
  }, [fetchUrls]);
  
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
      } else if (sortBy === 'remaining_clicks') {
        valueA = a.remaining_clicks || 0;
        valueB = b.remaining_clicks || 0;
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
  
  // COLORS for charts
  const COLORS = ['#0ea5e9', '#d946ef', '#10b981', '#f97316', '#f43f5e', '#8b5cf6'];
  
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
              <h1 className="text-3xl font-display font-bold text-dark-900">Self-Destructing Links</h1>
              <p className="mt-2 text-dark-500">
                Monitor and manage your self-destructing URLs
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                to="/dashboard"
                className="btn btn-outline flex items-center space-x-2"
              >
                <FiLink />
                <span>All URLs</span>
              </Link>
              <Link
                to="/dashboard"
                className="btn btn-primary flex items-center space-x-2"
                state={{ createSelfDestruct: true }}
              >
                <FiPlus />
                <span>Create Self-Destructing URL</span>
              </Link>
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
          
          {/* Stats Overview */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-soft p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-md bg-primary-500 text-white flex items-center justify-center mr-4">
                  <FiLink className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-dark-500 text-sm font-medium">Total Self-Destructing Links</p>
                  <h3 className="text-2xl font-display font-bold text-dark-900">
                    {statsData.totalSelfDestructLinks}
                  </h3>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-soft p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-md bg-accent-500 text-white flex items-center justify-center mr-4">
                  <FiCheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-dark-500 text-sm font-medium">Active Links</p>
                  <h3 className="text-2xl font-display font-bold text-dark-900">
                    {statsData.activeLinks}
                  </h3>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-soft p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-md bg-red-500 text-white flex items-center justify-center mr-4">
                  <FiAlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-dark-500 text-sm font-medium">Self-Destructed</p>
                  <h3 className="text-2xl font-display font-bold text-dark-900">
                    {statsData.destroyedLinks}
                  </h3>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-soft p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-md bg-secondary-500 text-white flex items-center justify-center mr-4">
                  <FiBarChart2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-dark-500 text-sm font-medium">Average Clicks</p>
                  <h3 className="text-2xl font-display font-bold text-dark-900">
                    {statsData.averageClicks}
                  </h3>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Charts */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Clicks to Destruction Chart */}
            <div className="bg-white rounded-xl shadow-soft p-6">
              <h3 className="text-lg font-display font-medium text-dark-900 mb-4">
                Clicks to Self-Destruction
              </h3>
              <div className="h-72">
                {statsData.clicksToDestruction.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={statsData.clicksToDestruction.slice(0, 10)} // Show only top 10
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      barSize={20}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="used" name="Clicks Used" fill="#0ea5e9" stackId="a" />
                      <Bar dataKey="remaining" name="Clicks Remaining" fill="#10b981" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-dark-400">No self-destructing links data available</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Status Distribution Chart */}
            <div className="bg-white rounded-xl shadow-soft p-6">
              <h3 className="text-lg font-display font-medium text-dark-900 mb-4">
                Link Status Distribution
              </h3>
              <div className="h-72">
                {urls.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Active', value: statsData.activeLinks },
                          { name: 'Self-Destructed', value: statsData.destroyedLinks }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell key="cell-0" fill="#10b981" />
                        <Cell key="cell-1" fill="#f43f5e" />
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} links`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-dark-400">No self-destructing links data available</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
          
          {/* URLs Table */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
              <h2 className="text-xl font-display font-semibold text-dark-900">Self-Destructing URLs</h2>
              
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
                    <option value="inactive">Self-Destructed</option>
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
                    <option value="remaining_clicks-asc">Closest to destruction</option>
                    <option value="remaining_clicks-desc">Furthest from destruction</option>
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
                <FiAlertTriangle className="mx-auto h-12 w-12 text-dark-300" />
                <h3 className="mt-4 text-lg font-medium text-dark-900">No self-destructing URLs yet</h3>
                <p className="mt-1 text-dark-500">Create your first self-destructing URL using the button above.</p>
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
                        Max Clicks
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                        Remaining
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-900">
                          {url.max_clicks || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {url.remaining_clicks !== null ? (
                            <div className="flex items-center">
                              <span className={`text-sm ${url.remaining_clicks < 3 ? 'text-red-500 font-bold' : 'text-dark-500'}`}>
                                {url.remaining_clicks}
                              </span>
                              {url.remaining_clicks < 3 && (
                                <FiAlertTriangle className="ml-1 text-amber-500" />
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-dark-500">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-500">
                          {new Date(url.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-500">
                          <div className="flex space-x-3">
                            <Link to={`/analytics/${url.id}`} className="text-dark-400 hover:text-primary-600" title="View analytics">
                              <FiBarChart2 />
                            </Link>
                            <Link to={`/dashboard`} state={{ editUrl: url.id }} className="text-dark-400 hover:text-primary-600" title="Edit URL">
                              <FiEdit />
                            </Link>
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
    </div>
  );
};

export default SelfDestructDashboard; 