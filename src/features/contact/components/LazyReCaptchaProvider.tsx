import { ReactNode, useEffect, useState, createContext, useContext } from 'react';
import { recaptchaLoader } from '../utils/recaptcha-loader';
import { logger } from '@/shared/Logger';

interface ReCaptchaContextValue {
  isLoaded: boolean;
  executeRecaptcha: (action: string) => Promise<string | null>;
}

const ReCaptchaContext = createContext<ReCaptchaContextValue>({
  isLoaded: false,
  executeRecaptcha: async () => null
});

export const useReCaptcha = () => useContext(ReCaptchaContext);

interface LazyReCaptchaProviderProps {
  siteKey: string;
  children: ReactNode;
}

export function LazyReCaptchaProvider({ siteKey, children }: LazyReCaptchaProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadAttempted, setLoadAttempted] = useState(false);

  useEffect(() => {
    // Only attempt to load once
    if (loadAttempted) return;

    setLoadAttempted(true);

    // Check if already loaded
    if (recaptchaLoader.isScriptLoaded()) {
      setIsLoaded(true);
      return;
    }

    // Load reCAPTCHA script
    recaptchaLoader
      .load(siteKey)
      .then(() => {
        logger.info('reCAPTCHA script loaded successfully');
        setIsLoaded(true);
      })
      .catch((error) => {
        logger.error('Failed to load reCAPTCHA:', error);
      });
  }, [siteKey, loadAttempted]);

  const executeRecaptcha = async (action: string): Promise<string | null> => {
    if (!isLoaded || !window.grecaptcha) {
      logger.error('reCAPTCHA not loaded');
      return null;
    }

    try {
      const token = await window.grecaptcha.execute(siteKey, { action });
      return token;
    } catch (error) {
      logger.error('Failed to execute reCAPTCHA:', error);
      return null;
    }
  };

  return <ReCaptchaContext.Provider value={{ isLoaded, executeRecaptcha }}>{children}</ReCaptchaContext.Provider>;
}
