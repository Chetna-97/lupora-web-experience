import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-accent uppercase tracking-[0.5em] text-[10px] mb-4">
              Something went wrong
            </p>
            <h1 className="text-foreground text-4xl md:text-5xl font-serif italic mb-6">
              Unexpected Error
            </h1>
            <p className="text-muted text-sm mb-10 max-w-md mx-auto leading-loose">
              We apologize for the inconvenience. Please try refreshing the page.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-accent text-black text-[10px] tracking-[0.3em] uppercase hover:bg-accent-hover transition-all duration-500"
              >
                Refresh Page
              </button>
              <a
                href="/"
                className="px-8 py-3 border border-foreground/20 text-foreground text-[10px] tracking-[0.3em] uppercase hover:bg-foreground hover:text-surface transition-all duration-500"
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
