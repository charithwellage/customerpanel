import React, { Component, ErrorInfo, ReactNode } from 'react';
import { getErrorAlertAttributes } from '@carchief/ui';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class CustomerErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Audit error cleanly without exposing sensitive user tokens or credentials
    // eslint-disable-next-line no-console
    console.error('CustomerErrorBoundary caught an error:', error.message, errorInfo.componentStack);
  }

  public handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const alertAttrs = getErrorAlertAttributes({ id: 'cust-shell-error-alert', message: this.state.error?.message || 'Unexpected error' });

      return (
        <div className="cc-cust-shell-error-surface" {...alertAttrs}>
          <div className="cc-cust-shell-error-card">
            <h2 className="cc-cust-shell-error-title">Portal Surface Error</h2>
            <div className="cc-cust-shell-error-body">
              <strong>We encountered an unexpected error loading this view.</strong>
              <p>{this.state.error?.message || 'Please try refreshing or returning to the dashboard.'}</p>
            </div>
            <div className="cc-cust-shell-error-actions">
              <button
                type="button"
                className="cc-cust-shell-btn cc-cust-shell-btn--primary"
                onClick={this.handleReset}
              >
                Try Again
              </button>
              <a href="/dashboard" className="cc-cust-shell-btn cc-cust-shell-btn--secondary">
                Return to Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
