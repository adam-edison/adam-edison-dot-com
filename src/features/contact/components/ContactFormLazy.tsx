import { useState, useEffect } from 'react';
import { ContactFormErrorBoundary } from './ContactFormErrorBoundary';
import { logger } from '@/shared/Logger';

interface ContactFormProps {
  className?: string;
}

export function ContactFormLazy({ className }: ContactFormProps) {
  const [ContactFormComponent, setContactFormComponent] = useState<React.ComponentType<ContactFormProps> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Dynamically import the heavy form dependencies only when contact page loads
    const loadComponent = async () => {
      try {
        const { ContactForm } = await import('./ContactForm');
        setContactFormComponent(() => ContactForm);
      } catch (error) {
        logger.error('Failed to load ContactForm component:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadComponent();
  }, []);

  if (isLoading) {
    return (
      <div className={`${className} bg-gray-900 border border-gray-700 rounded-lg p-8 text-center`}>
        <p className="text-gray-300">Loading contact form...</p>
      </div>
    );
  }

  if (!ContactFormComponent) {
    return (
      <div className={`${className} bg-red-950 border border-red-800 rounded-lg p-8 text-center`}>
        <p className="text-red-300">Contact form is not available.</p>
      </div>
    );
  }

  return (
    <ContactFormErrorBoundary>
      <ContactFormComponent className={className} />
    </ContactFormErrorBoundary>
  );
}
