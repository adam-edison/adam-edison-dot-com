import { StatusCard } from '@/components/ui/StatusCard';

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return <StatusCard variant="error" message={message} showIcon />;
}
