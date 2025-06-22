import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import urlService from '../../services/urlService';
import { toast } from 'react-toastify';

/**
 * FavoriteButton component for toggling URL favorite status
 * 
 * @param {Object} props
 * @param {number} props.urlId - ID of the URL
 * @param {boolean} props.isFavorite - Initial favorite status
 * @param {Function} props.onToggle - Callback function when favorite status changes
 */
const FavoriteButton = ({ urlId, isFavorite, onToggle }) => {
  const [favorite, setFavorite] = useState(isFavorite);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleFavorite = async (e) => {
    e.stopPropagation(); // Prevent event bubbling
    
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await urlService.toggleFavorite(urlId);
      
      // Check if response exists and has the expected property
      if (response && typeof response.is_favorite !== 'undefined') {
        setFavorite(response.is_favorite);
        
        // Call the onToggle callback if provided
        if (onToggle) {
          onToggle(urlId, response.is_favorite);
        }
        
        // Show success message if available, otherwise generic message
        toast.success(response.message || 'Favorite status updated');
      } else {
        // Handle unexpected response format
        console.warn('Unexpected response format from toggleFavorite:', response);
        toast.info('Favorite status may have been updated');
      }
    } catch (error) {
      // Log detailed error information
      console.error('Error toggling favorite:', error);
      
      // Extract error message from response if available
      let errorMessage = 'Failed to update favorite status';
      
      if (error && error.response && error.response.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      }
      
      toast.error(errorMessage);
      
      // Keep the current state as is - don't update UI
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleFavorite}
      className={`p-1 rounded-full transition-colors duration-200 ${
        isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
      }`}
      disabled={isLoading}
      title={favorite ? 'Remove from favorites' : 'Add to favorites'}
      aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <FaStar
        className={`text-xl ${
          favorite ? 'text-yellow-400' : 'text-gray-400'
        }`}
      />
    </button>
  );
};

export default FavoriteButton; 