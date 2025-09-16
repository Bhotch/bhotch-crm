import React from 'react';
import { AlertCircle } from 'lucide-react';

export function ConfigErrorDisplay({ error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-lg">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Application Configuration Error</h2>
        <p className="text-gray-600 mb-4">The application could not start because a required configuration variable is missing or invalid.</p>
        <div className="bg-red-100 text-red-700 text-left p-3 rounded-md text-sm">
          <strong>Details:</strong> {error}
        </div>
        <p className="text-gray-500 mt-4 text-sm">Please ensure all `REACT_APP_*` variables are set correctly in your Vercel project settings and redeploy.</p>
      </div>
    </div>
  );
}