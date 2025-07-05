interface StatusCardProps {
  type: 'error' | 'success' | 'warning';
  message: string;
  className?: string;
}

export function StatusCard({ type, message, className = '' }: StatusCardProps) {
  const getStatusStyles = () => {
    switch (type) {
      case 'error':
        return 'bg-red-950 border-red-800 text-red-300';
      case 'success':
        return 'bg-green-950 border-green-800 text-green-300';
      case 'warning':
        return 'bg-yellow-950 border-yellow-800 text-yellow-300';
      default:
        return 'bg-gray-950 border-gray-800 text-gray-300';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`${getStatusStyles()} border rounded-lg p-4 ${className}`}>
      <div className="flex items-center">
        <div className="mr-3 flex-shrink-0">{getIcon()}</div>
        <div className="text-sm font-medium">{message}</div>
      </div>
    </div>
  );
}
