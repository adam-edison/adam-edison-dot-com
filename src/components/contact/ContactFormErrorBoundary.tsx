import React from 'react';
import { StatusCard } from '@/components/ui/StatusCard';

interface ContactFormErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ContactFormErrorBoundaryProps {
  children: React.ReactNode;
}

export class ContactFormErrorBoundary extends React.Component<
  ContactFormErrorBoundaryProps,
  ContactFormErrorBoundaryState
> {
  constructor(props: ContactFormErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ContactFormErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Contact form error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto p-8">
          <StatusCard
            variant="error"
            message="Something went wrong with the contact form. Please refresh the page and try again."
            showIcon
            className="mb-4"
          />
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
