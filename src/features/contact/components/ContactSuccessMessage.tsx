import { StatusCard } from '@/shared/components/ui/StatusCard';

interface ContactSuccessMessageProps {
  className?: string;
}

export function ContactSuccessMessage({ className }: ContactSuccessMessageProps) {
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
      <p className="text-green-300">Expect a reply within 48 hours.</p>
    </StatusCard>
  );
}
