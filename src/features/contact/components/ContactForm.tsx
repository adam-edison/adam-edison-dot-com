import { useState, useEffect } from 'react';
import { ContactFormInner } from './ContactFormInner';
import { ContactFormErrorBoundary } from './ContactFormErrorBoundary';
import { logger } from '@/shared/Logger';

interface ContactFormProps {
  className?: string;
}

export function ContactForm({ className }: ContactFormProps) {
  const [configStatus, setConfigStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    checkServerConfig();
  }, []);

  const checkServerConfig = async () => {
    try {
      const response = await fetch('/api/email-service-check');

      if (response.ok) {
        setConfigStatus('ready');
      } else {
        setConfigStatus('error');
      }
    } catch (error) {
      logger.error('Failed to check server configuration:', error);
      setConfigStatus('error');
    }
  };

  if (configStatus === 'loading') {
    return (
      <div className={`${className} bg-gray-900 border border-gray-700 rounded-lg p-8 text-center`}>
        <p className="text-gray-300">Loading contact form...</p>
      </div>
    );
  }

  if (configStatus === 'error') {
    return (
      <div className={`${className} bg-red-950 border border-red-800 rounded-lg p-8 text-center`}>
        <p className="text-red-300">Contact form is not available.</p>
      </div>
    );
  }

  return (
    <ContactFormErrorBoundary>
      <ContactFormInner className={className} />
    </ContactFormErrorBoundary>
  );
}
