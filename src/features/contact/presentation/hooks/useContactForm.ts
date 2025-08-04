import { useState, useCallback, useRef } from 'react';
import { ContactFormData } from '../../ContactFormValidator';
import { ContactFormState } from '../../types';
import { ContactFormService } from '../../ContactFormService';
import { SecurityService } from '../../infrastructure/SecurityService';
import { logger } from '@/shared/Logger';

export function useContactForm(baseUrl: string = '') {
  const [formState, setFormState] = useState<ContactFormState>({
    isSubmitting: false,
    submitStatus: 'idle',
    errorMessage: '',
    isConfigLoading: true,
    serviceConfig: null
  });

  const serviceRef = useRef<ContactFormService | null>(null);
  const securityServiceRef = useRef<SecurityService | null>(null);

  const getService = useCallback(() => {
    if (!serviceRef.current) {
      serviceRef.current = ContactFormService.create(baseUrl);
    }
    return serviceRef.current;
  }, [baseUrl]);

  const getSecurityService = useCallback(() => {
    if (!securityServiceRef.current) {
      securityServiceRef.current = new SecurityService(baseUrl);
    }
    return securityServiceRef.current;
  }, [baseUrl]);

  const initializeConfig = useCallback(async () => {
    try {
      setFormState((prev) => ({
        ...prev,
        isConfigLoading: true,
        errorMessage: ''
      }));

      const service = getService();
      const configResult = await service.getConfig();

      if (!configResult.success) {
        setFormState((prev) => ({
          ...prev,
          isConfigLoading: false,
          errorMessage: configResult.error
        }));
        return;
      }

      setFormState((prev) => ({
        ...prev,
        isConfigLoading: false,
        serviceConfig: configResult.data
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize contact form';
      logger.error('ContactForm initialization failed:', error);

      setFormState((prev) => ({
        ...prev,
        isConfigLoading: false,
        errorMessage
      }));
    }
  }, [getService]);

  const initializeTurnstile = useCallback(
    async (container: HTMLElement) => {
      if (!formState.serviceConfig?.services.turnstile.enabled || !formState.serviceConfig.services.turnstile.siteKey) {
        return;
      }

      try {
        const securityService = getSecurityService();
        const result = await securityService.initializeTurnstile(
          container,
          formState.serviceConfig.services.turnstile.siteKey
        );

        if (!result.success) {
          setFormState((prev) => ({
            ...prev,
            submitStatus: 'error',
            errorMessage: result.error
          }));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize security verification';
        logger.error('Turnstile initialization failed:', error);

        setFormState((prev) => ({
          ...prev,
          submitStatus: 'error',
          errorMessage
        }));
      }
    },
    [formState.serviceConfig, getSecurityService]
  );

  const validateTurnstileToken = useCallback(async () => {
    const securityService = getSecurityService();
    const tokensResult = await securityService.getTokens();

    if (!tokensResult.success || tokensResult.data.turnstileToken) {
      return { success: true };
    }

    setFormState((prev) => ({
      ...prev,
      submitStatus: 'error',
      errorMessage: 'Please complete the security verification'
    }));

    return { success: false, error: 'Please complete the security verification' };
  }, [getSecurityService]);

  const performSubmission = useCallback(
    async (formData: ContactFormData) => {
      const service = getService();
      const result = await service.submit(formData);

      if (!result.success) {
        setFormState((prev) => ({
          ...prev,
          isSubmitting: false,
          submitStatus: 'error',
          errorMessage: result.error
        }));

        return { success: false, error: result.error };
      }

      setFormState((prev) => ({
        ...prev,
        isSubmitting: false,
        submitStatus: 'success',
        errorMessage: ''
      }));

      return { success: true };
    },
    [getService]
  );

  const handleSubmissionError = useCallback((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';

    logger.error('Contact form submission error:', error);

    setFormState((prev) => ({
      ...prev,
      isSubmitting: false,
      submitStatus: 'error',
      errorMessage
    }));

    return { success: false, error: errorMessage };
  }, []);

  const submitForm = useCallback(
    async (formData: ContactFormData) => {
      const turnstileRequired = formState.serviceConfig?.services.turnstile.enabled;

      // Guard clause: Validate turnstile token if required
      if (turnstileRequired) {
        const validationResult = await validateTurnstileToken();

        if (!validationResult.success) {
          return validationResult;
        }
      }

      setFormState((prev) => ({
        ...prev,
        isSubmitting: true,
        submitStatus: 'idle',
        errorMessage: ''
      }));

      try {
        return await performSubmission(formData);
      } catch (error) {
        return handleSubmissionError(error);
      }
    },
    [formState.serviceConfig, validateTurnstileToken, performSubmission, handleSubmissionError]
  );

  const resetSubmissionState = useCallback(() => {
    setFormState((prev) => ({
      ...prev,
      submitStatus: 'idle',
      errorMessage: ''
    }));
  }, []);

  const cleanup = useCallback(() => {
    if (securityServiceRef.current) {
      securityServiceRef.current.cleanup();
      securityServiceRef.current = null;
    }
    serviceRef.current = null;
  }, []);

  return {
    formState,
    submitForm,
    initializeConfig,
    initializeTurnstile,
    resetSubmissionState,
    cleanup
  };
}
