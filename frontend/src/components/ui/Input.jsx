import { forwardRef } from 'react';

const Input = forwardRef(({ 
  label,
  error,
  helper,
  type = 'text',
  placeholder,
  disabled = false,
  required = false,
  fullWidth = true,
  icon,
  className = '',
  containerClassName = '',
  ...props 
}, ref) => {
  const inputClasses = `
    block w-full px-4 py-2.5 text-gray-900 bg-white border rounded-lg
    focus:ring-2 focus:ring-primary focus:border-transparent
    disabled:bg-gray-100 disabled:cursor-not-allowed
    transition-colors duration-200
    ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
    ${icon ? 'pl-10' : ''}
    ${className}
  `;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
          {...props}
        />
      </div>

      {helper && !error && (
        <p className="mt-1.5 text-sm text-gray-500">{helper}</p>
      )}

      {error && (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;