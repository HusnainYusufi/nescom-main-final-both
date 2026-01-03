// src/components/ErrorBoundary.js
import React from 'react'

/**
 * Lightweight error boundary to keep the UI responsive even if
 * a lazily-loaded page (e.g. Project Timeline) throws during render.
 * The fallback copy is intentionally simple so it works without
 * any external assets or network access.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unexpected error' }
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error('UI error captured by ErrorBoundary', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: '' })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-body-tertiary p-4">
          <div className="text-center" style={{ maxWidth: 520 }}>
            <h2 className="fw-bold mb-2">Something went wrong</h2>
            <p className="text-body-secondary mb-4">
              We were unable to load the requested screen. This fallback keeps the
              app usable even when a module fails to load in an offline or
              restricted network environment.
            </p>
            <div className="small text-body-secondary mb-3">
              <strong>Details:</strong> {this.state.message}
            </div>
            <button type="button" className="btn btn-primary" onClick={this.handleRetry}>
              Retry
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
