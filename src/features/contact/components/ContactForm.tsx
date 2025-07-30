import { useState, useEffect } from 'react';
import { ContactFormInner } from './ContactFormInner';
import { ContactFormErrorBoundary } from './ContactFormErrorBoundary';
import { logger } from '@/shared/Logger';
import { ContactFormService, defaultContactFormService } from '../ContactFormService';

interface ContactFormProps {
  className?: string;
  contactService?: ContactFormService;
}

export function ContactForm({ className, contactService = defaultContactFormService }: ContactFormProps) {
  const [configStatus, setConfigStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    const checkServerConfig = async () => {
      try {
        await contactService.checkServerConfig();
        setConfigStatus('ready');
      } catch (error) {
        logger.error('Failed to check server configuration:', error);
        setConfigStatus('error');
      }
    };

    checkServerConfig();
  }, [contactService]);

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
      <ContactFormInner className={className} contactService={contactService} />
    </ContactFormErrorBoundary>
  );
}
