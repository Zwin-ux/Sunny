import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <h3 className="text-lg font-medium text-red-800">Something went wrong</h3>
          <p className="mt-1 text-sm text-red-700">
            We're sorry, but there was an error loading this chat. Please try refreshing the page.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-2 text-xs text-red-600">
              <summary>Error details</summary>
              <pre className="mt-1 p-2 bg-white rounded overflow-auto">
                {this.state.error.toString()}
                {this.state.error.stack && (
                  <code className="block mt-2 whitespace-pre">
                    {this.state.error.stack}
                  </code>
                )}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Helper component to wrap components with error boundary
export function withErrorBoundary<T>(
  Component: React.ComponentType<T>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  return function ErrorBoundaryWrapper(props: T) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props as any} />
      </ErrorBoundary>
    );
  };
}
