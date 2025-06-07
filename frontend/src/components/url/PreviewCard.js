import React from 'react';
import { FiExternalLink, FiLink, FiCalendar, FiEye } from 'react-icons/fi';
import { motion } from 'framer-motion';

const PreviewCard = ({ previewData, shortURL }) => {
  const { title, description, image, updated_at } = previewData;
  const fallbackImage = 'https://via.placeholder.com/600x400?text=No+Preview+Available';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md overflow-hidden"
    >
      <div className="relative">
        <img 
          src={image || fallbackImage} 
          alt={title || 'Link preview'} 
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 right-2 bg-primary-600 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center">
          <FiEye className="mr-1" /> Preview
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-medium text-lg mb-2 text-dark-900 truncate">
          {title || 'No title available'}
        </h3>
        
        <p className="text-dark-600 text-sm mb-4 line-clamp-3">
          {description || 'No description available for this link.'}
        </p>
        
        <div className="flex justify-between items-center text-sm text-dark-500">
          <div className="flex items-center">
            <FiLink className="mr-1" />
            <span className="truncate max-w-[180px]">{shortURL}</span>
          </div>
          
          {updated_at && (
            <div className="flex items-center">
              <FiCalendar className="mr-1" />
              <span>{new Date(updated_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
      
      <a
        href={shortURL}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-3 text-center bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors border-t border-primary-100 font-medium"
      >
        Visit link <FiExternalLink className="inline ml-1" />
      </a>
    </motion.div>
  );
};

export default PreviewCard; 