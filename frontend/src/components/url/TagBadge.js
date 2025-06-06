import React from 'react';
import { FiTag } from 'react-icons/fi';

const TagBadge = ({ tag, onClick, showIcon = true, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };
  
  return (
    <div
      className={`inline-flex items-center rounded-full ${sizeClasses[size]} ${onClick ? 'cursor-pointer' : ''}`}
      style={{ backgroundColor: tag.color, color: 'white' }}
      onClick={onClick ? () => onClick(tag) : undefined}
    >
      {showIcon && <FiTag className={size === 'sm' ? 'mr-0.5' : 'mr-1'} />}
      <span>{tag.name}</span>
    </div>
  );
};

export default TagBadge; 