import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  padding = 'p-6',
  hover = false,
  onClick = null,
  ...props 
}) => {
  const baseClasses = 'bg-white dark:bg-dark-800 rounded-xl shadow-md transition-all duration-200';
  const hoverClasses = hover ? 'hover:shadow-lg dark:shadow-dark-900/20 dark:hover:shadow-dark-900/30 cursor-pointer' : '';
  const paddingClass = padding;
  
  return (
    <div 
      className={`${baseClasses} ${paddingClass} ${hoverClasses} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card; 