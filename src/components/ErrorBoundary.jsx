import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RefreshCw, Bug, Shield } from 'lucide-react';

const ErrorFallback = ({ error, resetErrorBoundary, componentStack }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isReporting, setIsReporting] = React.useState(false);

  const reportError = async () => {
    setIsReporting(true);
    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        userId: localStorage.getItem('userId') || 'anonymous'
      };

      console.error('Error Report:', errorReport);

      setTimeout(() => setIsReporting(false), 1000);
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
      setIsReporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl border border-red-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">System Error Detected</h1>
              <p className="text-red-100">The Ultimate CRM encountered an unexpected error</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Summary */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 mb-1">Error Details</h3>
                <p className="text-red-700 text-sm font-mono bg-red-100 p-2 rounded">
                  {error.message}
                </p>
              </div>
            </div>
          </div>

          {/* Troubleshooting Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-3">Troubleshooting Steps</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-700 text-sm">
              <li>Try refreshing the page to reload the application</li>
              <li>Clear your browser cache and cookies</li>
              <li>Check your internet connection</li>
              <li>Disable browser extensions temporarily</li>
              <li>Contact support if the problem persists</li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={resetErrorBoundary}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>

            <button
              onClick={reportError}
              disabled={isReporting}
              className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <Bug className="w-4 h-4" />
              <span>{isReporting ? 'Reporting...' : 'Report Error'}</span>
            </button>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Page</span>
            </button>
          </div>

          {/* Technical Details */}
          <div className="border-t pt-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              {isExpanded ? 'Hide' : 'Show'} Technical Details
            </button>

            {isExpanded && (
              <div className="mt-3 space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Stack Trace</h4>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto text-gray-700 font-mono">
                    {error.stack}
                  </pre>
                </div>

                {componentStack && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Component Stack</h4>
                    <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto text-gray-700 font-mono">
                      {componentStack}
                    </pre>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Environment</h4>
                  <div className="text-xs bg-gray-100 p-3 rounded text-gray-700 space-y-1">
                    <div><strong>URL:</strong> {window.location.href}</div>
                    <div><strong>User Agent:</strong> {navigator.userAgent}</div>
                    <div><strong>Timestamp:</strong> {new Date().toISOString()}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 rounded-b-xl border-t text-center">
          <p className="text-xs text-gray-500">
            Ultimate Lomanco CRM Automation System - Error ID: {Date.now().toString(36)}
          </p>
        </div>
      </div>
    </div>
  );
};

const logError = (error, errorInfo) => {
  console.group('🚨 Error Boundary Triggered');
  console.error('Error:', error);
  console.error('Error Info:', errorInfo);
  console.error('Component Stack:', errorInfo.componentStack);
  console.error('Error Stack:', error.stack);
  console.groupEnd();

  const errorData = {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent
  };

  try {
    const existingErrors = JSON.parse(localStorage.getItem('errorLogs') || '[]');
    existingErrors.push(errorData);

    if (existingErrors.length > 10) {
      existingErrors.splice(0, existingErrors.length - 10);
    }

    localStorage.setItem('errorLogs', JSON.stringify(existingErrors));
  } catch (storageError) {
    console.warn('Failed to store error log:', storageError);
  }
};

const ErrorBoundary = ({ children, fallback: CustomFallback }) => {
  return (
    <ReactErrorBoundary
      FallbackComponent={CustomFallback || ErrorFallback}
      onError={logError}
      onReset={() => {
        window.location.hash = '';
        window.location.reload();
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
};

const withErrorBoundary = (Component, errorBoundaryConfig = {}) => {
  const WrappedComponent = (props) => {
    return (
      <ErrorBoundary {...errorBoundaryConfig}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

const useErrorHandler = () => {
  const [error, setError] = React.useState(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error, errorInfo = {}) => {
    console.error('Manual error capture:', error);
    logError(error, errorInfo);
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};

const AsyncErrorBoundary = ({ children, fallback }) => {
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled Promise Rejection:', event.reason);
      setError(new Error(`Async Error: ${event.reason}`));
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (error) {
    const resetError = () => setError(null);
    return fallback ? fallback(error, resetError) : <ErrorFallback error={error} resetErrorBoundary={resetError} />;
  }

  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;
export { withErrorBoundary, useErrorHandler, AsyncErrorBoundary, ErrorFallback };