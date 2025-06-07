import React from 'react';
import { FiEye, FiExternalLink, FiCalendar } from 'react-icons/fi';

const UrlPreviewContent = ({ 
  url, 
  previewData, 
  onUpdatePreview,
  isUpdating = false
}) => {
  const hasPreviewData = previewData && (previewData.image || previewData.title || previewData.description);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-display font-medium text-dark-900">
          <FiEye className="inline mr-2" /> Destination Preview
        </h3>
        
        {onUpdatePreview && (
          <button
            onClick={onUpdatePreview}
            disabled={isUpdating}
            className="btn btn-sm btn-outline flex items-center"
          >
            {isUpdating ? 'Updating...' : 'Update Preview'}
          </button>
        )}
      </div>
      
      {hasPreviewData ? (
        <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
          {previewData.image && (
            <div className="relative h-64 bg-gray-100">
              <img 
                src={previewData.image} 
                alt={previewData.title || "Preview"} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-4">
            {previewData.title && (
              <h3 className="font-medium text-lg mb-2 text-dark-900">
                {previewData.title}
              </h3>
            )}
            
            {previewData.description && (
              <p className="text-dark-600 text-sm mb-4">
                {previewData.description}
              </p>
            )}
            
            {previewData.updated_at && (
              <div className="text-sm text-dark-500 flex items-center">
                <FiCalendar className="mr-1" />
                <span>Updated: {new Date(previewData.updated_at).toLocaleString()}</span>
              </div>
            )}
          </div>
          
          <div className="p-3 bg-gray-50 border-t border-gray-200">
            <a 
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline flex items-center justify-center"
            >
              Visit website <FiExternalLink className="ml-1" />
            </a>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <FiEye className="mx-auto text-gray-400 text-4xl mb-3" />
          <p className="text-dark-500">No preview available for this URL.</p>
          <p className="text-sm text-dark-400 mt-2">
            {onUpdatePreview 
              ? "Click 'Update Preview' to fetch content from the destination URL." 
              : "Preview will be generated when the URL is configured with preview enabled."}
          </p>
        </div>
      )}
    </div>
  );
};

export default UrlPreviewContent; 