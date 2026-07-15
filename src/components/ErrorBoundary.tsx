import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Rendered instead of the default full-screen error UI. Pass null to hide failed decorative content. */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Unhandled render error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background font-mono text-foreground">
          <p className="text-2xl text-accentRed">Something went wrong.</p>
          <p className="text-xs text-muted">
            Reload the page to keep browsing ammunition.
          </p>
          <button
            type="button"
            className="border border-border px-3 py-1 text-xs text-foreground transition-colors hover:bg-muted/20 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
