import React from 'react';

const Input = ({
  label,
  name,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  className = '',
  labelClassName = '',
  inputClassName = '',
  helperText,
  ...props
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={name} className={`form-label mb-1 ${labelClassName}`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`form-input ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${disabled ? 'bg-gray-100 dark:bg-dark-600 cursor-not-allowed' : ''} ${inputClassName}`}
        {...props}
      />
      {helperText && !error && (
        <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">{helperText}</p>
      )}
      {error && (
        <p className="form-error">{error}</p>
      )}
    </div>
  );
};

export default Input; 