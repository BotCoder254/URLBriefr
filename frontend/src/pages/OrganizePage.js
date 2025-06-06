import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLink, FiFolder, FiTag, FiEdit, FiTrash2, FiPlus, FiCopy, FiExternalLink, FiCheckCircle, FiAlertCircle, FiBarChart2, FiSettings } from 'react-icons/fi';
import urlService from '../services/urlService';
import TagBadge from '../components/url/TagBadge';
import TagManagementModal from '../components/url/TagManagementModal';
import FolderManagementModal from '../components/url/FolderManagementModal';

const OrganizePage = () => {
  const [urls, setUrls] = useState([]);
  const [tags, setTags] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('tags'); // 'tags' or 'folders'
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [copied, setCopied] = useState(null);
  const [showTagManagementModal, setShowTagManagementModal] = useState(false);
  const [showFolderManagementModal, setShowFolderManagementModal] = useState(false);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
    if (selectedTag) {
      fetchUrlsByTag(selectedTag.id);
    } else if (selectedFolder) {
      fetchUrlsByFolder(selectedFolder);
    }
  }, [selectedTag, selectedFolder]);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch tags
      const tagsData = await urlService.getTags();
      setTags(tagsData);
      
      // Fetch folders
      const foldersData = await urlService.getFolders();
      setFolders(foldersData);
      
      // Fetch all URLs
      const urlsData = await urlService.getUserUrls();
      setUrls(urlsData);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUrlsByTag = async (tagId) => {
    try {
      setLoading(true);
      const data = await urlService.getUrlsByTag(tagId);
      setUrls(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching URLs by tag:', err);
      setError('Failed to load URLs for this tag. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUrlsByFolder = async (folder) => {
    try {
      setLoading(true);
      const data = await urlService.getUserUrls({ folder });
      setUrls(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching URLs by folder:', err);
      setError('Failed to load URLs for this folder. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTagClick = (tag) => {
    if (selectedTag && selectedTag.id === tag.id) {
      setSelectedTag(null);
      fetchData();
    } else {
      setSelectedTag(tag);
      setSelectedFolder(null);
    }
  };
  
  const handleFolderClick = (folder) => {
    if (selectedFolder === folder) {
      setSelectedFolder(null);
      fetchData();
    } else {
      setSelectedFolder(folder);
      setSelectedTag(null);
    }
  };
  
  const handleCopy = (url) => {
    navigator.clipboard.writeText(url.full_short_url)
      .then(() => {
        setCopied(url.id);
        setTimeout(() => setCopied(null), 2000);
      })
      .catch((err) => {
        console.error('Could not copy text: ', err);
      });
  };
  
  const handleDeleteTag = async (tag) => {
    if (!window.confirm(`Are you sure you want to delete the tag "${tag.name}"? This will not delete any URLs.`)) {
      return;
    }
    
    try {
      await urlService.deleteTag(tag.id);
      
      // If the deleted tag was selected, reset selection
      if (selectedTag && selectedTag.id === tag.id) {
        setSelectedTag(null);
      }
      
      // Refresh data
      fetchData();
    } catch (err) {
      console.error('Error deleting tag:', err);
      setError('Failed to delete tag. Please try again.');
    }
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
  
  if (loading && !urls.length && !tags.length && !folders.length) {
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
              <h1 className="text-3xl font-display font-bold text-dark-900">Organize</h1>
              <p className="mt-2 text-dark-500">
                Manage your URLs with tags and folders
              </p>
            </div>
            <Link to="/dashboard" className="btn btn-primary flex items-center space-x-2">
              <FiPlus />
              <span>Create URL</span>
            </Link>
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
          
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-xl shadow-soft p-4">
                {/* View selector */}
                <div className="flex border-b border-gray-200 mb-4">
                  <button
                    className={`flex-1 py-2 text-center ${activeView === 'tags' ? 'text-primary-600 border-b-2 border-primary-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveView('tags')}
                  >
                    <FiTag className="inline mr-1" /> Tags
                  </button>
                  <button
                    className={`flex-1 py-2 text-center ${activeView === 'folders' ? 'text-primary-600 border-b-2 border-primary-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveView('folders')}
                  >
                    <FiFolder className="inline mr-1" /> Folders
                  </button>
                </div>
                
                {/* Tags list */}
                {activeView === 'tags' && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-medium text-dark-800">Your Tags</h3>
                      <button
                        onClick={() => setShowTagManagementModal(true)}
                        className="text-xs text-primary-600 hover:text-primary-700 flex items-center"
                      >
                        <FiSettings className="mr-1 h-3 w-3" /> Manage
                      </button>
                    </div>
                    
                    {tags.length === 0 ? (
                      <div className="text-center py-4 text-dark-500">
                        <FiTag className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p>No tags yet</p>
                        <p className="text-sm">Create tags when adding URLs</p>
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {tags.map(tag => (
                          <li key={tag.id}>
                            <div className="flex items-center justify-between group">
                              <div
                                className={`flex items-center cursor-pointer rounded-md px-3 py-2 ${
                                  selectedTag && selectedTag.id === tag.id
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'hover:bg-gray-50'
                                }`}
                                onClick={() => handleTagClick(tag)}
                                style={{ 
                                  width: 'calc(100% - 60px)'
                                }}
                              >
                                <div 
                                  className="w-3 h-3 rounded-full mr-2"
                                  style={{ backgroundColor: tag.color }}
                                ></div>
                                <span className="truncate">{tag.name}</span>
                                <span className="ml-1 text-xs text-gray-500">({tag.url_count})</span>
                              </div>
                              
                              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleDeleteTag(tag)}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                  title="Delete tag"
                                >
                                  <FiTrash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                
                {/* Folders list */}
                {activeView === 'folders' && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-medium text-dark-800">Your Folders</h3>
                      <button
                        onClick={() => setShowFolderManagementModal(true)}
                        className="text-xs text-primary-600 hover:text-primary-700 flex items-center"
                      >
                        <FiSettings className="mr-1 h-3 w-3" /> Manage
                      </button>
                    </div>
                    
                    {folders.length === 0 ? (
                      <div className="text-center py-4 text-dark-500">
                        <FiFolder className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p>No folders yet</p>
                        <p className="text-sm">Organize URLs into folders when creating them</p>
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {folders.map((folder, index) => (
                          <li key={index}>
                            <div
                              className={`flex items-center cursor-pointer rounded-md px-3 py-2 ${
                                selectedFolder === folder
                                  ? 'bg-primary-50 text-primary-700'
                                  : 'hover:bg-gray-50'
                              }`}
                              onClick={() => handleFolderClick(folder)}
                            >
                              <FiFolder className="mr-2 text-gray-500" />
                              <span className="truncate">{folder}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Main content */}
            <div className="md:col-span-3">
              <div className="bg-white rounded-xl shadow-soft p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-display font-semibold text-dark-900">
                    {selectedTag ? (
                      <div className="flex items-center">
                        <TagBadge tag={selectedTag} />
                        <span className="ml-2">URLs</span>
                      </div>
                    ) : selectedFolder ? (
                      <div className="flex items-center">
                        <FiFolder className="mr-2 text-gray-500" />
                        <span>{selectedFolder}</span>
                      </div>
                    ) : (
                      'All URLs'
                    )}
                  </h2>
                  
                  {(selectedTag || selectedFolder) && (
                    <button
                      onClick={() => {
                        setSelectedTag(null);
                        setSelectedFolder(null);
                        fetchData();
                      }}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      Clear filter
                    </button>
                  )}
                </div>
                
                {urls.length === 0 ? (
                  <div className="text-center py-10">
                    <FiLink className="mx-auto h-12 w-12 text-dark-300" />
                    <h3 className="mt-4 text-lg font-medium text-dark-900">No URLs found</h3>
                    <p className="mt-1 text-dark-500">
                      {selectedTag ? `No URLs with the tag "${selectedTag.name}"` : 
                       selectedFolder ? `No URLs in the folder "${selectedFolder}"` : 
                       'Create your first shortened URL using the button above.'}
                    </p>
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
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {urls.map((url) => (
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
                              <div className="flex space-x-3">
                                <Link to={`/analytics/${url.id}`} className="text-dark-400 hover:text-primary-600" title="View analytics">
                                  <FiBarChart2 />
                                </Link>
                                <Link to={`/dashboard?edit=${url.id}`} className="text-dark-400 hover:text-primary-600" title="Edit URL">
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
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Tag Management Modal */}
      <TagManagementModal 
        isOpen={showTagManagementModal} 
        onClose={() => {
          setShowTagManagementModal(false);
          fetchData(); // Refresh data after managing tags
        }}
      />
      
      {/* Folder Management Modal */}
      <FolderManagementModal 
        isOpen={showFolderManagementModal} 
        onClose={() => {
          setShowFolderManagementModal(false);
          fetchData(); // Refresh data after managing folders
        }}
      />
    </div>
  );
};

export default OrganizePage; 