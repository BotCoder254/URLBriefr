import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFolder, FiFolderPlus, FiX, FiEdit, FiCheck, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import urlService from '../../services/urlService';

const FolderManagementModal = ({ isOpen, onClose }) => {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState(null);
  const [folderCounts, setFolderCounts] = useState({});
  
  useEffect(() => {
    if (isOpen) {
      fetchFolders();
    }
  }, [isOpen]);
  
  const fetchFolders = async () => {
    try {
      setLoading(true);
      const data = await urlService.getFolders();
      console.log('Fetched folders in FolderManagementModal:', data);
      
      // Ensure folders is always an array
      const validFolders = Array.isArray(data) ? data.filter(Boolean) : [];
      console.log('Valid folders after filtering:', validFolders);
      setFolders(validFolders);
      
      // Get URL counts for each folder
      const urls = await urlService.getUserUrls();
      const counts = {};
      
      validFolders.forEach(folder => {
        counts[folder] = urls.filter(url => url.folder === folder).length;
      });
      
      setFolderCounts(counts);
      setError(null);
    } catch (err) {
      console.error('Error fetching folders:', err);
      setError('Failed to load folders. Please try again later.');
      setFolders([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    
    if (!newFolderName.trim()) {
      return;
    }
    
    const folderName = newFolderName.trim();
    console.log('Attempting to create folder:', folderName);
    
    // Check if folder already exists
    if (folders.includes(folderName)) {
      setError('A folder with this name already exists.');
      return;
    }
    
    try {
      // Use a simplified payload for folder creation
      const folderPayload = {
        original_url: 'https://example.com',
        title: 'Temporary URL for folder creation',
        folder: folderName,
        is_active: false
      };
      
      console.log('Creating folder with payload:', folderPayload);
      
      // Create a URL with the new folder name
      const response = await urlService.createUrl(folderPayload);
      console.log('Folder creation response:', response);
      
      // If successful, update the local state to include the new folder
      setFolders(prevFolders => {
        const updatedFolders = [...prevFolders, folderName];
        console.log('Updated folders list:', updatedFolders);
        return updatedFolders;
      });
      
      setFolderCounts(prevCounts => ({...prevCounts, [folderName]: 0}));
      setNewFolderName('');
      setError(null);
      
      // Delete the temporary URL since we just needed it to register the folder
      if (response && response.id) {
        try {
          await urlService.deleteUrl(response.id);
        } catch (deleteErr) {
          console.error('Error deleting temporary URL:', deleteErr);
          // Non-critical error, don't show to user
        }
      }
    } catch (err) {
      console.error('Error creating folder:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to create folder. Please try again.');
      }
    }
  };
  
  const handleUpdateFolder = async (e) => {
    e.preventDefault();
    
    if (!editingFolder || !editingFolder.newName.trim()) {
      return;
    }
    
    const oldName = editingFolder.name;
    const newName = editingFolder.newName.trim();
    
    if (oldName === newName) {
      setEditingFolder(null);
      return;
    }
    
    // Check if folder already exists
    if (folders.includes(newName)) {
      setError('A folder with this name already exists.');
      return;
    }
    
    try {
      // Get all URLs in the old folder
      const urls = await urlService.getUserUrls({ folder: oldName });
      
      // Update each URL to the new folder name
      let updatedCount = 0;
      for (const url of urls) {
        await urlService.updateUrl(url.id, { folder: newName });
        updatedCount++;
      }
      
      // Update local state
      setFolders(prevFolders => 
        prevFolders.map(folder => folder === oldName ? newName : folder)
      );
      
      // Update folder counts
      setFolderCounts(prevCounts => {
        const newCounts = { ...prevCounts };
        newCounts[newName] = prevCounts[oldName] || 0;
        delete newCounts[oldName];
        return newCounts;
      });
      
      setEditingFolder(null);
      setError(null);
    } catch (err) {
      console.error('Error updating folder:', err);
      setError('Failed to update folder. Please try again.');
    }
  };
  
  const handleDeleteFolder = async (folderName) => {
    try {
      // Get all URLs in the folder
      const urls = await urlService.getUserUrls({ folder: folderName });
      
      // Remove folder from each URL
      for (const url of urls) {
        await urlService.updateUrl(url.id, { folder: '' });
      }
      
      // Update local state
      setFolders(prevFolders => prevFolders.filter(folder => folder !== folderName));
      
      // Update folder counts
      setFolderCounts(prevCounts => {
        const newCounts = { ...prevCounts };
        delete newCounts[folderName];
        return newCounts;
      });
      
      setError(null);
    } catch (err) {
      console.error('Error deleting folder:', err);
      setError('Failed to delete folder. Please try again.');
    }
  };
  
  const startEditing = (folderName) => {
    setEditingFolder({
      name: folderName,
      newName: folderName
    });
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-dark-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-soft p-6 max-w-lg w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-display font-semibold text-dark-900">Manage Folders</h2>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-dark-600"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 flex items-start">
            <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <div className="mb-6">
          <h3 className="text-md font-medium text-dark-800 mb-2">Create New Folder</h3>
          <form onSubmit={handleCreateFolder} className="flex items-center space-x-2">
            <div className="flex items-center flex-grow border border-gray-300 rounded-md px-3 py-2">
              <FiFolder className="mr-2 text-gray-500" />
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="border-none focus:ring-0 p-0 text-sm flex-grow"
                autoFocus
              />
            </div>
            
            <button
              type="submit"
              className="btn btn-sm btn-primary"
            >
              <FiFolderPlus className="mr-1" /> Add
            </button>
          </form>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-md font-medium text-dark-800 mb-2">Your Folders</h3>
          
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-dark-500">Loading folders...</p>
            </div>
          ) : folders.length === 0 ? (
            <div className="text-center py-4 text-dark-500">
              <FiFolder className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p>No folders yet</p>
              <p className="text-sm">Create your first folder above</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {folders.map((folder, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                  {editingFolder && editingFolder.name === folder ? (
                    <form onSubmit={handleUpdateFolder} className="flex items-center space-x-2 w-full">
                      <div className="flex items-center flex-grow border border-gray-300 rounded-md px-2 py-1">
                        <FiFolder className="mr-2 text-gray-500" />
                        <input
                          type="text"
                          value={editingFolder.newName}
                          onChange={(e) => setEditingFolder({...editingFolder, newName: e.target.value})}
                          className="border-none focus:ring-0 p-0 text-sm flex-grow"
                          autoFocus
                        />
                      </div>
                      <button
                        type="submit"
                        className="p-1 text-green-600 hover:text-green-800"
                      >
                        <FiCheck />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingFolder(null)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <FiX />
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center">
                        <FiFolder className="mr-2 text-gray-500" />
                        <span className="font-medium">{folder}</span>
                        <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                          {folderCounts[folder] || 0} URLs
                        </span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEditing(folder)}
                          className="p-1 text-gray-500 hover:text-primary-600"
                          title="Edit folder"
                        >
                          <FiEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete the folder "${folder}"? This will not delete any URLs.`)) {
                              handleDeleteFolder(folder);
                            }
                          }}
                          className="p-1 text-gray-500 hover:text-red-600 flex items-center"
                          title="Delete folder"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="btn btn-primary"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default FolderManagementModal; 