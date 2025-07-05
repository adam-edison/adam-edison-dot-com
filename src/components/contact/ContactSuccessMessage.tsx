import { StatusCard } from '@/components/ui/StatusCard';

interface ContactSuccessMessageProps {
  className?: string;
  onSendAnother: () => void;
}

export function ContactSuccessMessage({ className, onSendAnother }: ContactSuccessMessageProps) {
  return (
    <StatusCard variant="success" className={`${className} p-8 text-center`}>
      <div className="text-green-400 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-green-400 mb-2">Message Sent!</h3>
      <p className="text-green-300 mb-6">Expect a reply within 48 hours.</p>
      <button onClick={onSendAnother} className="text-green-400 hover:text-green-300 transition-colors underline">
        Send another message
      </button>
    </StatusCard>
  );
}
