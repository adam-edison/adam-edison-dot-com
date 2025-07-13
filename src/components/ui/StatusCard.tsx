import { cn } from '@/lib/utils';

interface StatusCardProps {
  variant: 'error' | 'success' | 'info' | 'warning';
  children?: React.ReactNode;
  message?: string;
  showIcon?: boolean;
  className?: string;
}

export function StatusCard({ variant, children, message, showIcon = false, className }: StatusCardProps) {
  const variantClasses = {
    error: 'bg-red-950 border border-red-800 text-red-300',
    success: 'bg-green-950 border border-green-800 text-green-400',
    info: 'bg-gray-950 border border-gray-800 text-gray-300',
    warning: 'bg-yellow-950 border-yellow-800 text-yellow-300'
  };

  const getIcon = () => {
    if (!showIcon) return null;

    switch (variant) {
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
      case 'info':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const containerClasses = cn(variantClasses[variant], 'rounded-lg p-4', className);

  // If message is provided, render with icon and message
  if (message) {
    return (
      <div className={containerClasses}>
        <div className="flex items-center">
          {showIcon && <div className="mr-3 flex-shrink-0">{getIcon()}</div>}
          <div className="text-sm font-medium">{message}</div>
        </div>
      </div>
    );
  }

  // Otherwise render with children
  return <div className={containerClasses}>{children}</div>;
}
