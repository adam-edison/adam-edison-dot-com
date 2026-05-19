import { StatusCard } from '@/shared/components/ui/StatusCard';

interface ContactFormErrorFallbackProps {
  onRefresh: () => void;
}

export function ContactFormErrorFallback({ onRefresh }: ContactFormErrorFallbackProps) {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <StatusCard
        variant="error"
        message="Something went wrong with the contact form. Please refresh the page and try again."
        showIcon
        className="mb-4"
      />
      <button
        onClick={onRefresh}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        Refresh Page
      </button>
    </div>
  );
}
