interface StatusCardProps {
  variant: 'error' | 'success' | 'info';
  children: React.ReactNode;
  className?: string;
}

export function StatusCard({ variant, children, className = '' }: StatusCardProps) {
  const variantClasses = {
    error: 'bg-red-950 border border-red-800 text-red-300',
    success: 'bg-green-950 border border-green-800 text-green-400',
    info: 'bg-gray-950 border border-gray-800 text-gray-300'
  };

  return <div className={`${variantClasses[variant]} rounded-lg p-4 ${className}`}>{children}</div>;
}
