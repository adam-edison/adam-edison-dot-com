import React, { ReactNode } from 'react';
import { ContactFormErrorFallback } from './ContactFormErrorFallback';
import { SentryReporter } from '@/shared/observability/SentryReporter';

interface ContactFormErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ContactFormErrorBoundaryProps {
  children: ReactNode;
}

export class ContactFormErrorBoundary extends React.Component<
  ContactFormErrorBoundaryProps,
  ContactFormErrorBoundaryState
> {
  constructor(props: ContactFormErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ContactFormErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    SentryReporter.captureException(error, { errorInfo, source: 'contact form error boundary' });
  }

  render() {
    if (this.state.hasError) {
      return <ContactFormErrorFallback onRefresh={() => window.location.reload()} />;
    }

    return this.props.children;
  }
}
