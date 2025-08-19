import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      console.warn('Component Error Caught:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="alert alert-warning m-3">
          <h5>⚠️ Component Temporarily Unavailable</h5>
          <p>This feature is currently experiencing issues. Please try refreshing the page or contact support if the problem persists.</p>
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;