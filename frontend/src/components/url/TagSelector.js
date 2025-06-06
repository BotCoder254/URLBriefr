import React, { useState, useEffect } from 'react';
import { FiTag, FiPlus, FiX, FiEdit, FiCheck } from 'react-icons/fi';
import urlService from '../../services/urlService';

const TagSelector = ({ selectedTags = [], onChange, allowCreate = true, allowEdit = true }) => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTagInput, setShowTagInput] = useState(false);
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
    fetchTags();
  }, []);
  
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
  
  const handleTagClick = (tag) => {
    const isSelected = selectedTags.some(t => t.id === tag.id);
    let newSelectedTags;
    
    if (isSelected) {
      newSelectedTags = selectedTags.filter(t => t.id !== tag.id);
    } else {
      newSelectedTags = [...selectedTags, tag];
    }
    
    onChange(newSelectedTags);
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
      setShowTagInput(false);
      
      // Auto-select the newly created tag
      onChange([...selectedTags, newTag]);
    } catch (err) {
      console.error('Error creating tag:', err);
      setError('Failed to create tag. Please try again.');
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
      
      // Update selected tags if the edited tag was selected
      const tagIndex = selectedTags.findIndex(t => t.id === updatedTag.id);
      if (tagIndex !== -1) {
        const newSelectedTags = [...selectedTags];
        newSelectedTags[tagIndex] = updatedTag;
        onChange(newSelectedTags);
      }
      
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
      
      // Remove from selected tags if present
      if (selectedTags.some(t => t.id === tagId)) {
        onChange(selectedTags.filter(t => t.id !== tagId));
      }
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
  
  if (loading) {
    return <div className="text-center py-2">Loading tags...</div>;
  }
  
  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 text-red-700 p-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <div key={tag.id} className="flex">
            {editingTag && editingTag.id === tag.id ? (
              <form onSubmit={handleUpdateTag} className="flex items-center space-x-1">
                <input
                  type="text"
                  value={editingTag.name}
                  onChange={(e) => setEditingTag({...editingTag, name: e.target.value})}
                  className="input py-2 px-3 text-sm w-40"
                  autoFocus
                />
                <div className="relative">
                  <input
                    type="color"
                    value={editingTag.color}
                    onChange={(e) => setEditingTag({...editingTag, color: e.target.value})}
                    className="w-8 h-8 cursor-pointer rounded-full overflow-hidden"
                  />
                </div>
                <button
                  type="submit"
                  className="p-2 text-green-600 hover:text-green-800"
                >
                  <FiCheck />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTag(null)}
                  className="p-2 text-red-600 hover:text-red-800"
                >
                  <FiX />
                </button>
              </form>
            ) : (
              <div
                className={`flex items-center rounded-full px-3 py-2 text-sm ${
                  selectedTags.some(t => t.id === tag.id)
                    ? 'bg-opacity-100 text-white'
                    : 'bg-opacity-20 hover:bg-opacity-30'
                }`}
                style={{ 
                  backgroundColor: selectedTags.some(t => t.id === tag.id)
                    ? tag.color
                    : tag.color + '33',  // Add transparency
                  color: selectedTags.some(t => t.id === tag.id)
                    ? 'white'
                    : tag.color
                }}
              >
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={() => handleTagClick(tag)}
                >
                  <FiTag className="mr-2" />
                  <span>{tag.name}</span>
                  {tag.url_count > 0 && (
                    <span className="ml-1 bg-white bg-opacity-30 rounded-full px-2">
                      {tag.url_count}
                    </span>
                  )}
                </div>
                
                {allowEdit && (
                  <div className="flex ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(tag);
                      }}
                      className="p-1 text-white text-opacity-80 hover:text-opacity-100"
                    >
                      <FiEdit />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete tag "${tag.name}"?`)) {
                          handleDeleteTag(tag.id);
                        }
                      }}
                      className="p-1 text-white text-opacity-80 hover:text-opacity-100"
                    >
                      <FiX />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        
        {allowCreate && !showTagInput && (
          <button
            onClick={() => setShowTagInput(true)}
            className="flex items-center rounded-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            <FiPlus className="mr-2" />
            <span>New Tag</span>
          </button>
        )}
      </div>
      
      {showTagInput && (
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
            Add
          </button>
          
          <button
            type="button"
            onClick={() => {
              setShowTagInput(false);
              setNewTagName('');
            }}
            className="btn btn-sm btn-outline"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
};

export default TagSelector; 