import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Last-resort catch for render-time crashes so users never see a blank
 * screen. Data-fetch errors are already handled per-page with ErrorState;
 * this only catches unexpected component errors.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled render error:', error, info.componentStack);
  }

  handleReload = (): void => {
    this.setState({ hasError: false });
    window.location.assign('/');
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-surface)] px-4 text-center">
          <p className="font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink-900)]">
            Something went wrong
          </p>
          <p className="max-w-sm text-sm text-[var(--color-slate-500)]">
            An unexpected error occurred while rendering this page. Reloading usually fixes it.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="rounded-md bg-[var(--color-ink-900)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-ink-800)]"
          >
            Reload application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
