import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLink, FiBarChart2, FiGitBranch, FiArrowRight, FiPlus, FiTrash2, FiEdit, FiCheck, FiX, FiChevronDown, FiChevronUp, FiClock, FiInfo, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import urlService from '../services/urlService';

const ABTestingPage = () => {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTests, setExpandedTests] = useState({});

  useEffect(() => {
    const fetchABTestingUrls = async () => {
      try {
        setLoading(true);
        const data = await urlService.getUserUrls();
        // Filter only A/B testing URLs
        const abTestUrls = data.filter(url => url.is_ab_test);
        setUrls(abTestUrls);
        setError(null);
      } catch (err) {
        console.error('Error fetching A/B testing URLs:', err);
        setError('Failed to load A/B testing URLs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchABTestingUrls();
  }, []);

  // Toggle expanded state for a test
  const toggleExpanded = (urlId) => {
    setExpandedTests(prev => ({
      ...prev,
      [urlId]: !prev[urlId]
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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate conversion rate
  const calculateConversionRate = (variant) => {
    if (!variant.access_count || variant.access_count === 0) return 0;
    return (variant.conversion_count || 0) / variant.access_count * 100;
  };

  // Format conversion rate for display
  const formatConversionRate = (rate) => {
    return `${rate.toFixed(2)}%`;
  };

  // Find winning variant
  const findWinningVariant = (variants) => {
    if (!variants || variants.length === 0) return null;
    
    return variants.reduce((winner, current) => {
      const winnerRate = calculateConversionRate(winner);
      const currentRate = calculateConversionRate(current);
      return currentRate > winnerRate ? current : winner;
    }, variants[0]);
  };

  // Calculate improvement percentage
  const calculateImprovement = (variant, controlVariant) => {
    const variantRate = calculateConversionRate(variant);
    const controlRate = calculateConversionRate(controlVariant);
    
    if (controlRate === 0) return 0;
    return ((variantRate - controlRate) / controlRate) * 100;
  };

  // Get confidence level based on sample size and difference
  const getConfidenceLevel = (variant, controlVariant) => {
    // Simple confidence estimation based on sample size
    const totalSamples = variant.access_count + controlVariant.access_count;
    const improvement = Math.abs(calculateImprovement(variant, controlVariant));
    
    if (totalSamples < 30) return 'Low';
    if (totalSamples < 100) {
      return improvement > 20 ? 'Medium' : 'Low';
    }
    if (totalSamples < 500) {
      return improvement > 10 ? 'High' : 'Medium';
    }
    return improvement > 5 ? 'Very High' : 'High';
  };

  // Get confidence level color
  const getConfidenceLevelColor = (level) => {
    switch (level) {
      case 'Low': return 'text-yellow-600';
      case 'Medium': return 'text-blue-600';
      case 'High': return 'text-green-600';
      case 'Very High': return 'text-accent-600';
      default: return 'text-dark-500';
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
          className="space-y-8"
        >
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-dark-900">A/B Testing</h1>
              <p className="mt-1 text-dark-500">Manage and analyze your A/B testing experiments</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link to="/dashboard" className="btn btn-primary flex items-center">
                <FiPlus className="mr-2" /> Create New Test
              </Link>
            </div>
          </motion.div>

          {error && (
            <motion.div variants={itemVariants} className="bg-red-50 text-red-700 p-4 rounded-lg">
              <p>{error}</p>
            </motion.div>
          )}

          {urls.length === 0 && !error ? (
            <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-soft p-8 text-center">
              <FiGitBranch className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-dark-800">No A/B tests found</h3>
              <p className="mt-1 text-dark-500">Create your first A/B test to start optimizing your links.</p>
              <div className="mt-6">
                <Link to="/dashboard" className="btn btn-primary">
                  Create A/B Test
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div variants={itemVariants} className="space-y-6">
              {urls.map((url) => {
                const isExpanded = expandedTests[url.id] || false;
                const controlVariant = url.variants[0] || {};
                const winningVariant = findWinningVariant(url.variants);
                const hasWinner = winningVariant && winningVariant !== controlVariant && 
                                 calculateConversionRate(winningVariant) > calculateConversionRate(controlVariant);
                
                return (
                  <div key={url.id} className="bg-white rounded-xl shadow-soft overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-md bg-primary-100 text-primary-600 flex items-center justify-center mr-4">
                            <FiGitBranch className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-dark-900">
                              {url.title || url.short_code}
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className="text-sm text-dark-500">
                                Created: {formatDate(url.created_at)}
                              </span>
                              <span className="text-sm text-dark-500">
                                • {url.access_count} total clicks
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            to={`/analytics/${url.id}`}
                            className="btn btn-outline flex items-center"
                          >
                            <FiBarChart2 className="mr-1" /> Analytics
                          </Link>
                          <Link
                            to={`/dashboard?edit=${url.id}`}
                            className="btn btn-outline flex items-center"
                          >
                            <FiEdit className="mr-1" /> Edit
                          </Link>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {url.variants.length} Variants
                        </span>
                        {hasWinner && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-100 text-accent-800">
                            <FiCheck className="mr-1" /> Winner Found
                          </span>
                        )}
                        {url.is_active ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                      </div>
                      
                      {/* Summary Stats */}
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm text-dark-500">Total Clicks</div>
                          <div className="text-xl font-semibold">{url.access_count}</div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm text-dark-500">Avg. Conversion Rate</div>
                          <div className="text-xl font-semibold">
                            {formatConversionRate(url.variants.reduce((sum, v) => sum + calculateConversionRate(v), 0) / url.variants.length)}
                          </div>
                        </div>
                        
                        {hasWinner && (
                          <div className="bg-accent-50 p-4 rounded-lg">
                            <div className="text-sm text-accent-700">Best Performing Variant</div>
                            <div className="text-xl font-semibold text-accent-800">
                              {winningVariant.name} ({formatConversionRate(calculateConversionRate(winningVariant))})
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Variants Performance */}
                      <div className="mt-6 border-t border-gray-100 pt-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-medium text-dark-700">Variants Performance</h4>
                          <button 
                            onClick={() => toggleExpanded(url.id)}
                            className="text-primary-600 hover:text-primary-700 flex items-center text-sm"
                          >
                            {isExpanded ? (
                              <>Less details <FiChevronUp className="ml-1" /></>
                            ) : (
                              <>More details <FiChevronDown className="ml-1" /></>
                            )}
                          </button>
                        </div>
                        
                        {/* Visualization Bar Chart */}
                        <div className="mt-2 mb-4">
                          {url.variants.map((variant, index) => {
                            const conversionRate = calculateConversionRate(variant);
                            const isControl = index === 0;
                            const isWinner = hasWinner && variant === winningVariant;
                            const improvement = isControl ? 0 : calculateImprovement(variant, controlVariant);
                            
                            return (
                              <div key={index} className="mb-3">
                                <div className="flex justify-between items-center mb-1">
                                  <div className="flex items-center">
                                    <span className={`font-medium ${isWinner ? 'text-accent-700' : 'text-dark-700'}`}>
                                      {variant.name}
                                    </span>
                                    {isControl && <span className="ml-2 text-xs bg-gray-100 text-gray-700 py-0.5 px-2 rounded-full">Control</span>}
                                    {isWinner && <span className="ml-2 text-xs bg-accent-100 text-accent-700 py-0.5 px-2 rounded-full">Winner</span>}
                                  </div>
                                  <span className="text-sm font-medium">
                                    {formatConversionRate(conversionRate)}
                                    {!isControl && (
                                      <span className={`ml-2 ${improvement > 0 ? 'text-green-600' : improvement < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                        {improvement > 0 ? (
                                          <><FiTrendingUp className="inline mr-1" />+{Math.abs(improvement).toFixed(1)}%</>
                                        ) : improvement < 0 ? (
                                          <><FiTrendingDown className="inline mr-1" />-{Math.abs(improvement).toFixed(1)}%</>
                                        ) : (
                                          <>0%</>
                                        )}
                                      </span>
                                    )}
                                  </span>
                                </div>
                                <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${isWinner ? 'bg-accent-500' : isControl ? 'bg-primary-500' : 'bg-secondary-500'}`}
                                    style={{ width: `${Math.max(conversionRate * 2, 2)}%` }}
                                  ></div>
                                </div>
                                <div className="flex justify-between text-xs text-dark-500 mt-1">
                                  <span>{variant.access_count} clicks</span>
                                  <span>{variant.weight}% traffic</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {isExpanded && (
                          <div className="overflow-x-auto mt-4">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                                    Variant
                                  </th>
                                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                                    Destination
                                  </th>
                                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                                    Traffic Split
                                  </th>
                                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                                    Clicks
                                  </th>
                                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                                    Conv. Rate
                                  </th>
                                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                                    vs Control
                                  </th>
                                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                                    Confidence
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {url.variants.map((variant, index) => {
                                  const conversionRate = calculateConversionRate(variant);
                                  const isControl = index === 0;
                                  const improvement = isControl ? 0 : calculateImprovement(variant, controlVariant);
                                  const confidenceLevel = isControl ? '-' : getConfidenceLevel(variant, controlVariant);
                                  const confidenceLevelColor = getConfidenceLevelColor(confidenceLevel);
                                  
                                  return (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-dark-900">
                                        <div className="flex items-center">
                                          {variant.name}
                                          {isControl && <span className="ml-2 text-xs bg-gray-100 text-gray-700 py-0.5 px-1 rounded">Control</span>}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm text-dark-500 max-w-xs truncate">
                                        <a href={variant.destination_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600">
                                          {variant.destination_url}
                                        </a>
                                      </td>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm text-dark-500">
                                        <div className="flex items-center">
                                          <span className="mr-2">{variant.weight}%</span>
                                          <div className="w-16 bg-gray-200 rounded-full h-2">
                                            <div className={`h-2 rounded-full ${isControl ? 'bg-primary-600' : 'bg-secondary-600'}`} style={{ width: `${variant.weight}%` }}></div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm text-dark-500">
                                        {variant.access_count}
                                      </td>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm text-dark-500">
                                        {formatConversionRate(conversionRate)}
                                      </td>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                                        {isControl ? (
                                          <span className="text-dark-400">-</span>
                                        ) : (
                                          <span className={`${improvement > 0 ? 'text-green-600' : improvement < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                            {improvement > 0 ? (
                                              <><FiTrendingUp className="inline mr-1" />+{Math.abs(improvement).toFixed(1)}%</>
                                            ) : improvement < 0 ? (
                                              <><FiTrendingDown className="inline mr-1" />-{Math.abs(improvement).toFixed(1)}%</>
                                            ) : (
                                              <>0%</>
                                            )}
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                                        <span className={confidenceLevelColor}>
                                          {confidenceLevel}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                        
                        {isExpanded && (
                          <div className="mt-4 bg-gray-50 p-3 rounded-lg text-sm">
                            <div className="flex items-start">
                              <FiInfo className="text-primary-500 mt-0.5 mr-2 flex-shrink-0" />
                              <div>
                                <p className="text-dark-700 font-medium">How to interpret results</p>
                                <p className="text-dark-500 mt-1">
                                  A variant is considered better when it has a higher conversion rate than the control variant.
                                  The confidence level indicates how statistically significant the results are.
                                  Higher confidence means you can trust the results more.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 flex justify-between items-center">
                        <div className="text-sm">
                          <span className="text-dark-500">Shortened URL: </span>
                          <a 
                            href={url.full_short_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700"
                          >
                            {url.full_short_url}
                          </a>
                        </div>
                        <Link
                          to={`/analytics/${url.id}`}
                          className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                        >
                          View detailed analytics <FiArrowRight className="ml-1" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ABTestingPage; 