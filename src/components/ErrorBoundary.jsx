import { Component } from 'react';
import { Link } from 'react-router-dom';

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
        <div className="min-h-screen bg-black flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-[#C5A059] uppercase tracking-[0.5em] text-[10px] mb-4">
              Something went wrong
            </p>
            <h1 className="text-white text-4xl md:text-5xl font-serif italic mb-6">
              Unexpected Error
            </h1>
            <p className="text-gray-400 text-sm mb-10 max-w-md mx-auto leading-loose">
              We apologize for the inconvenience. Please try refreshing the page.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-[#C5A059] text-black text-[10px] tracking-[0.3em] uppercase hover:bg-[#d4af6a] transition-all duration-500"
              >
                Refresh Page
              </button>
              <a
                href="/"
                className="px-8 py-3 border border-white/20 text-white text-[10px] tracking-[0.3em] uppercase hover:bg-white hover:text-black transition-all duration-500"
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
