import { useState, useEffect } from 'react';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { ContactFormInner } from './ContactFormInner';
import { ContactFormErrorBoundary } from './ContactFormErrorBoundary';
import { logger } from '@/lib/logger';

interface ContactFormProps {
  className?: string;
}

export function ContactForm({ className }: ContactFormProps) {
  const [configStatus, setConfigStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    // Check frontend configuration first
    if (!siteKey) {
      setConfigStatus('error');
      return;
    }

    // Check backend configuration
    const checkServerConfig = async () => {
      try {
        const response = await fetch('/api/config-check');
        const data = await response.json();

        if (data.configured) {
          setConfigStatus('ready');
        } else {
          setConfigStatus('error');
        }
      } catch (error) {
        logger.error('Failed to check server configuration:', error);
        setConfigStatus('error');
      }
    };

    checkServerConfig();
  }, [siteKey]);

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
    <GoogleReCaptchaProvider
      reCaptchaKey={siteKey!}
      scriptProps={{
        async: true,
        defer: true
      }}
    >
      <ContactFormErrorBoundary>
        <ContactFormInner className={className} />
      </ContactFormErrorBoundary>
    </GoogleReCaptchaProvider>
  );
}
