import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTag, FiPlus, FiX, FiEdit, FiCheck, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import urlService from '../../services/urlService';

const TagManagementModal = ({ isOpen, onClose }) => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [editingTag, setEditingTag] = useState(null);
  
  // Predefined colors for tags
  const tagColors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // yellow
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#6366F1', // indigo
    '#F97316', // orange
    '#14B8A6', // teal
    '#6B7280', // gray
  ];
  
  useEffect(() => {
    if (isOpen) {
      fetchTags();
    }
  }, [isOpen]);
  
  const fetchTags = async () => {
    try {
      setLoading(true);
      const data = await urlService.getTags();
      setTags(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching tags:', err);
      setError('Failed to load tags. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateTag = async (e) => {
    e.preventDefault();
    
    if (!newTagName.trim()) {
      return;
    }
    
    try {
      const newTag = await urlService.createTag({
        name: newTagName.trim(),
        color: newTagColor
      });
      
      setTags([...tags, newTag]);
      setNewTagName('');
      setNewTagColor('#3B82F6');
    } catch (err) {
      console.error('Error creating tag:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to create tag. Please try again.');
      }
    }
  };
  
  const handleUpdateTag = async (e) => {
    e.preventDefault();
    
    if (!editingTag || !editingTag.name.trim()) {
      return;
    }
    
    try {
      const updatedTag = await urlService.updateTag(editingTag.id, {
        name: editingTag.name.trim(),
        color: editingTag.color
      });
      
      setTags(tags.map(tag => tag.id === updatedTag.id ? updatedTag : tag));
      setEditingTag(null);
    } catch (err) {
      console.error('Error updating tag:', err);
      setError('Failed to update tag. Please try again.');
    }
  };
  
  const handleDeleteTag = async (tagId) => {
    try {
      await urlService.deleteTag(tagId);
      setTags(tags.filter(tag => tag.id !== tagId));
    } catch (err) {
      console.error('Error deleting tag:', err);
      setError('Failed to delete tag. Please try again.');
    }
  };
  
  const startEditing = (tag) => {
    setEditingTag({
      ...tag
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
          <h2 className="text-xl font-display font-semibold text-dark-900">Manage Tags</h2>
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
          <h3 className="text-md font-medium text-dark-800 mb-2">Create New Tag</h3>
          <form onSubmit={handleCreateTag} className="flex items-center space-x-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tag name"
              className="input py-2 px-3 text-sm flex-grow"
              autoFocus
            />
            
            <div className="relative">
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-8 h-8 cursor-pointer rounded-full overflow-hidden"
              />
            </div>
            
            <div className="flex space-x-1">
              {tagColors.map(color => (
                <div
                  key={color}
                  onClick={() => setNewTagColor(color)}
                  className={`w-6 h-6 rounded-full cursor-pointer ${
                    newTagColor === color ? 'ring-2 ring-offset-1 ring-gray-400' : ''
                  }`}
                  style={{ backgroundColor: color }}
                ></div>
              ))}
            </div>
            
            <button
              type="submit"
              className="btn btn-sm btn-primary"
            >
              <FiPlus className="mr-1" /> Add
            </button>
          </form>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-md font-medium text-dark-800 mb-2">Your Tags</h3>
          
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-dark-500">Loading tags...</p>
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-4 text-dark-500">
              <FiTag className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p>No tags yet</p>
              <p className="text-sm">Create your first tag above</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {tags.map(tag => (
                <div key={tag.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                  {editingTag && editingTag.id === tag.id ? (
                    <form onSubmit={handleUpdateTag} className="flex items-center space-x-2 w-full">
                      <input
                        type="text"
                        value={editingTag.name}
                        onChange={(e) => setEditingTag({...editingTag, name: e.target.value})}
                        className="input py-1 px-2 text-sm flex-grow"
                        autoFocus
                      />
                      
                      <div className="relative">
                        <input
                          type="color"
                          value={editingTag.color}
                          onChange={(e) => setEditingTag({...editingTag, color: e.target.value})}
                          className="w-6 h-6 cursor-pointer rounded-full overflow-hidden"
                        />
                      </div>
                      
                      <div className="flex space-x-1">
                        {tagColors.map(color => (
                          <div
                            key={color}
                            onClick={() => setEditingTag({...editingTag, color})}
                            className={`w-4 h-4 rounded-full cursor-pointer ${
                              editingTag.color === color ? 'ring-2 ring-offset-1 ring-gray-400' : ''
                            }`}
                            style={{ backgroundColor: color }}
                          ></div>
                        ))}
                      </div>
                      
                      <button
                        type="submit"
                        className="p-1 text-green-600 hover:text-green-800"
                      >
                        <FiCheck />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTag(null)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <FiX />
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-full mr-2"
                          style={{ backgroundColor: tag.color }}
                        ></div>
                        <span className="font-medium">{tag.name}</span>
                        <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                          {tag.url_count} URLs
                        </span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEditing(tag)}
                          className="p-1 text-gray-500 hover:text-primary-600"
                          title="Edit tag"
                        >
                          <FiEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete the tag "${tag.name}"?`)) {
                              handleDeleteTag(tag.id);
                            }
                          }}
                          className="p-1 text-gray-500 hover:text-red-600 flex items-center"
                          title="Delete tag"
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

export default TagManagementModal; 