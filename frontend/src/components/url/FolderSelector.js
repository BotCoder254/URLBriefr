import React, { useState, useEffect } from 'react';
import { FiFolder, FiFolderPlus, FiChevronDown, FiCheck } from 'react-icons/fi';
import urlService from '../../services/urlService';

const FolderSelector = ({ selectedFolder, onChange }) => {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  
  useEffect(() => {
    fetchFolders();
  }, []);
  
  // Refresh folders when the dropdown is opened
  useEffect(() => {
    if (isOpen) {
      fetchFolders();
    }
  }, [isOpen]);
  
  const fetchFolders = async () => {
    try {
      setLoading(true);
      const data = await urlService.getFolders();
      setFolders(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching folders:', err);
      setError('Failed to load folders. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectFolder = (folder) => {
    onChange(folder);
    setIsOpen(false);
  };
  
  const handleCreateFolder = (e) => {
    e.preventDefault();
    
    if (!newFolderName.trim()) {
      return;
    }
    
    const newFolder = newFolderName.trim();
    
    // Add to folders list
    if (!folders.includes(newFolder)) {
      setFolders([...folders, newFolder]);
    }
    
    // Select the new folder
    onChange(newFolder);
    
    // Register the folder in the backend (this happens asynchronously)
    // Use a simplified payload for folder creation
    const folderPayload = {
      original_url: 'https://example.com',
      title: 'Temporary URL for folder creation',
      folder: newFolder,
      is_active: false
    };
    
    urlService.createUrl(folderPayload).then(response => {
      // Delete the temporary URL if creation was successful
      if (response && response.id) {
        urlService.deleteUrl(response.id).catch(err => {
          console.error('Error deleting temporary URL:', err);
        });
      }
    }).catch(err => {
      console.error('Error registering folder:', err);
      // Non-critical error, don't show to user
    });
    
    // Reset state
    setNewFolderName('');
    setShowNewFolderInput(false);
    setIsOpen(false);
  };
  
  return (
    <div className="relative">
      <div 
        className="flex items-center justify-between border border-gray-300 rounded-md px-3 py-2 cursor-pointer hover:border-gray-400 text-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <FiFolder className="mr-2 text-gray-500" />
          <span className={selectedFolder ? 'text-dark-800' : 'text-gray-500'}>
            {selectedFolder || 'Select Folder'}
          </span>
        </div>
        <FiChevronDown className={`transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-auto">
          <div className="p-1">
            <div 
              className={`flex items-center px-3 py-2 rounded-md cursor-pointer ${!selectedFolder ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-100'}`}
              onClick={() => handleSelectFolder('')}
            >
              <span className="flex-grow">None</span>
              {!selectedFolder && <FiCheck className="text-primary-600" />}
            </div>
            
            {folders.map((folder, index) => (
              <div 
                key={index}
                className={`flex items-center px-3 py-2 rounded-md cursor-pointer ${selectedFolder === folder ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-100'}`}
                onClick={() => handleSelectFolder(folder)}
              >
                <FiFolder className="mr-2 text-gray-500" />
                <span className="flex-grow">{folder}</span>
                {selectedFolder === folder && <FiCheck className="text-primary-600" />}
              </div>
            ))}
            
            {showNewFolderInput ? (
              <form onSubmit={handleCreateFolder} className="mt-1 p-2 border-t border-gray-100">
                <div className="flex items-center">
                  <FiFolder className="mr-2 text-gray-500" />
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="New folder name"
                    className="flex-grow border-none focus:ring-0 p-1 text-sm"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end mt-2 space-x-2">
                  <button
                    type="button"
                    className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                    onClick={() => setShowNewFolderInput(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700"
                  >
                    Create
                  </button>
                </div>
              </form>
            ) : (
              <div 
                className="flex items-center px-3 py-2 rounded-md cursor-pointer text-primary-600 hover:bg-primary-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNewFolderInput(true);
                }}
              >
                <FiFolderPlus className="mr-2" />
                <span>Create New Folder</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderSelector; 