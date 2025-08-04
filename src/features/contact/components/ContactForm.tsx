import { ContactFormInner } from './ContactFormInner';
import { ContactFormErrorBoundary } from './ContactFormErrorBoundary';

interface ContactFormProps {
  className?: string;
}

export function ContactForm({ className }: ContactFormProps) {
  return (
    <ContactFormErrorBoundary>
      <ContactFormInner className={className} />
    </ContactFormErrorBoundary>
  );
}
