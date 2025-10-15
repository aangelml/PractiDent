import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const Alert = ({ 
  type = 'info', 
  title,
  children,
  onClose,
  className = ''
}) => {
  const types = {
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600',
      Icon: Info
    },
    success: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600',
      Icon: CheckCircle
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600',
      Icon: AlertTriangle
    },
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600',
      Icon: AlertCircle
    }
  };

  const { bgColor, borderColor, textColor, iconColor, Icon } = types[type];

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${textColor}`}>
              {title}
            </h3>
          )}
          <div className={`${title ? 'mt-2' : ''} text-sm ${textColor}`}>
            {children}
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className={`ml-3 flex-shrink-0 ${textColor} hover:opacity-75 transition-opacity`}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;