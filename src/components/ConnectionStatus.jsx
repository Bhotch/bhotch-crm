import React, { useState } from 'react';
import { RefreshCw, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { googleSheetsService } from '../api/googleSheetsService';

function ConnectionStatus() {
  const [status, setStatus] = useState(null);
  const [testing, setTesting] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    setStatus(null);
    const result = await googleSheetsService.testConnection();
    setStatus(result);
    setTesting(false);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-medium text-gray-900">Google Sheets Connection</h3>
          {status && (<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{status.success ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}{status.success ? 'Connected' : 'Error'}</span>)}
        </div>
        <button onClick={testConnection} disabled={testing} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
          {testing ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}Test
        </button>
      </div>
      {status && (<div className="mt-2 text-sm text-gray-600">{status.message}{status.success && status.rowCount && ` (${status.rowCount} rows)`}</div>)}
      <div className="mt-2 text-xs text-gray-500">
        <div>URL: {process.env.REACT_APP_GAS_WEB_APP_URL || 'Not configured'}</div>
        <div>Environment: {process.env.NODE_ENV}</div>
      </div>
    </div>
  );
}

export default ConnectionStatus;