// Replace your entire src/App.js with this working version:

import React from 'react';
import './App.css';

// Simple debug component to test before adding the full Google Maps
const SimpleDebug = () => {
  const testApiKey = () => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return '❌ Missing - Add to .env file';
    }
    return `✅ Found: ${apiKey.substring(0, 10)}...`;
  };

  const testDataEndpoint = async () => {
    try {
      const url = process.env.REACT_APP_GAS_WEB_APP_URL || 'https://script.google.com/macros/s/AKfycbw8r0tVUeFptoP0hdEQONuP8RR5NdYxBjPZwiXPZCLJLwduWAm28K23aVjqwzr4joejtA/exec';
      
      console.log('Testing endpoint:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Response:', data);
      return data;
    } catch (error) {
      console.error('Error:', error);
      return { error: error.message };
    }
  };

  const handleTestData = () => {
    testDataEndpoint();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔧 CRM Debug - Step by Step</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Step 1: Environment Variables</h3>
        <p><strong>Google Maps API Key:</strong> {testApiKey()}</p>
        <p><strong>Data Endpoint:</strong> {process.env.REACT_APP_GAS_WEB_APP_URL ? '✅ Configured' : '❌ Missing'}</p>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Step 2: Test Data Connection</h3>
        <button 
          onClick={handleTestData}
          style={{ 
            padding: '10px 20px', 
            background: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Data Fetch (Check Console)
        </button>
        <p><small>Click button and check browser console (F12) for results</small></p>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Step 3: Next Steps</h3>
        <ol>
          <li>Fix any issues shown above</li>
          <li>Install Google Maps: <code>npm install @react-google-maps/api</code></li>
          <li>Add the full interactive map component</li>
        </ol>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
        <h4>🚨 Common Issues:</h4>
        <ul>
          <li><strong>Missing API Key:</strong> Add <code>REACT_APP_GOOGLE_MAPS_API_KEY=your_key</code> to .env file</li>
          <li><strong>CORS Error:</strong> Update your Google Apps Script with CORS headers</li>
          <li><strong>No Data:</strong> Check your Google Sheets has data and is publicly accessible</li>
        </ul>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <SimpleDebug />
    </div>
  );
}

export default App;
