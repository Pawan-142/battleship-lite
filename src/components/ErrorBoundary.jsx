import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          color: '#f8fafc',
          background: '#0a0b10'
        }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem', color: '#ef4444' }}>
            Arena Console Reloading
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: '460px', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            An unexpected error occurred while loading this view. Click below to refresh or return to the main arena overview.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.hash = '#booking';
                window.location.reload();
              }}
              style={{
                background: '#dc2626',
                color: '#fff',
                padding: '0.7rem 1.4rem',
                borderRadius: '10px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.hash = '#hero';
                window.location.reload();
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                padding: '0.7rem 1.4rem',
                borderRadius: '10px',
                fontWeight: 600,
                border: '1px solid rgba(255, 255, 255, 0.15)',
                cursor: 'pointer'
              }}
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
