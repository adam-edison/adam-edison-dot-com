import React, { ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';
import { SentryReporter } from '@/shared/observability/SentryReporter';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    SentryReporter.captureException(error, { errorInfo, source: 'unhandled application error' });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onGoHome={() => (window.location.href = '/')} />;
    }

    return this.props.children;
  }
}
