// ===== DEBUG MAP COMPONENT =====
// Use this component to test your implementation step by step
// Place this in src/components/DebugMap.jsx

import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

const DebugMap = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [testStep, setTestStep] = useState(0);

  // Sample test data for offline testing
  const sampleCustomers = [
    {
      id: 1,
      name: "John Smith",
      company: "ABC Roofing",
      email: "john@abcroofing.com",
      phone: "(555) 123-4567",
      address: "123 Main St",
      city: "New York",
      state: "NY",
      zip: "10001",
      latitude: 40.7589,
      longitude: -73.9851,
      status: "Active"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      company: "XYZ Construction",
      email: "sarah@xyzconstruction.com", 
      phone: "(555) 987-6543",
      address: "456 Oak Ave",
      city: "Brooklyn",
      state: "NY", 
      zip: "11201",
      latitude: 40.6892,
      longitude: -73.9442,
      status: "Pending"
    }
  ];

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE'
  });

  const addDebugLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, { 
      time: timestamp, 
      message, 
      type,
      step: testStep 
    }]);
    console.log(`[${timestamp}] ${message}`);
  };

  // Test Google Apps Script endpoint
  const testEndpoint = async () => {
    addDebugLog('🔍 Testing Google Apps Script endpoint...', 'info');
    setLoading(true);
    setError(null);

    try {
      const url = process.env.REACT_APP_GAS_WEB_APP_URL || 'https://script.google.com/macros/s/AKfycbw8r0tVUeFptoP0hdEQONuP8RR5NdYxBjPZwiXPZCLJLwduWAm28K23aVjqwzr4joejtA/exec';
      addDebugLog(`📡 Fetching from: ${url}`);
      
      const response = await fetch(url);
      addDebugLog(`📊 Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      addDebugLog(`📦 Received data: ${JSON.stringify(data, null, 2)}`);
      
      if (data.success && data.data) {
        addDebugLog(`✅ Found ${data.data.length} total records`);
        
        // Validate coordinates
        const validCustomers = data.data.filter(customer => 
          customer.latitude && 
          customer.longitude && 
          !isNaN(parseFloat(customer.latitude)) && 
          !isNaN(parseFloat(customer.longitude))
        ).map(customer => ({
          ...customer,
          latitude: parseFloat(customer.latitude),
          longitude: parseFloat(customer.longitude)
        }));

        addDebugLog(`📍 Records with valid coordinates: ${validCustomers.length}`);
        setCustomers(validCustomers);
        
        if (validCustomers.length > 0) {
          addDebugLog(`🗺️ Sample coordinates: lat=${validCustomers[0].latitude}, lng=${validCustomers[0].longitude}`);
        }

      } else {
        throw new Error('Invalid response format or unsuccessful response');
      }
      
    } catch (err) {
      addDebugLog(`❌ Error: ${err.message}`, 'error');
      setError(err.message);
      
      // Fall back to sample data for testing
      addDebugLog('🔄 Using sample data for testing...', 'warning');
      setCustomers(sampleCustomers);
    } finally {
      setLoading(false);
    }
  };

  // Test API key
  const testApiKey = () => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      addDebugLog('❌ Google Maps API key not configured', 'error');
      return false;
    } else {
      addDebugLog('✅ Google Maps API key found', 'success');
      return true;
    }
  };

  // Run tests in sequence
  const runTests = async () => {
    setDebugInfo([]);
    setTestStep(1);
    
    addDebugLog('🚀 Starting CRM Map Debug Tests...', 'info');
    
    // Test 1: API Key
    addDebugLog('=== Test 1: API Key Configuration ===');
    setTestStep(1);
    const hasApiKey = testApiKey();
    
    // Test 2: Google Apps Script
    addDebugLog('=== Test 2: Google Apps Script Endpoint ===');
    setTestStep(2);
    await testEndpoint();
    
    // Test 3: Map Loading
    addDebugLog('=== Test 3: Google Maps Loading ===');
    setTestStep(3);
    if (isLoaded) {
      addDebugLog('✅ Google Maps API loaded successfully', 'success');
    } else if (loadError) {
      addDebugLog(`❌ Google Maps API failed to load: ${loadError.message}`, 'error');
    } else {
      addDebugLog('⏳ Google Maps API still loading...', 'warning');
    }
    
    addDebugLog('🏁 Debug tests completed!', 'success');
  };

  const mapContainerStyle = {
    width: '100%',
    height: '400px'
  };

  const defaultCenter = { lat: 40.7128, lng: -74.0060 }; // NYC

  const redPinIcon = {
    url: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="32" height="32">
        <path fill="#EA4335" d="M12 0C7.03 0 3 4.03 3 9c0 7.12 9 18 9 18s9-10.88 9-18c0-4.97-4.03-9-9-9z"/>
        <circle fill="#FFFFFF" cx="12" cy="9" r="3"/>
      </svg>
    `),
    scaledSize: { width: 32, height: 32 },
    anchor: { x: 16, y: 32 }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔧 CRM Map Debug Console</h1>
      
      {/* Control Panel */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Control Panel</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={runTests} style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
            Run All Tests
          </button>
          <button onClick={testEndpoint} style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>
            Test Data Fetch
          </button>
          <button onClick={() => setCustomers(sampleCustomers)} style={{ padding: '10px 20px', background: '#ffc107', color: 'black', border: 'none', borderRadius: '4px' }}>
            Load Sample Data
          </button>
          <button onClick={() => setDebugInfo([])} style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}>
            Clear Logs
          </button>
        </div>
      </div>

      {/* Status Display */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Status</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <div>
            <strong>API Key:</strong> {process.env.REACT_APP_GOOGLE_MAPS_API_KEY ? '✅ Configured' : '❌ Missing'}
          </div>
          <div>
            <strong>Google Maps:</strong> {isLoaded ? '✅ Loaded' : loadError ? '❌ Error' : '⏳ Loading'}
          </div>
          <div>
            <strong>Customers:</strong> {customers.length} records
          </div>
          <div>
            <strong>Valid Coordinates:</strong> {customers.filter(c => c.latitude && c.longitude).length}
          </div>
        </div>
      </div>

      {/* Debug Console */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Debug Console</h3>
        <div style={{ 
          height: '200px', 
          overflow: 'auto', 
          background: '#f8f9fa', 
          border: '1px solid #ddd', 
          borderRadius: '4px', 
          padding: '10px',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          {debugInfo.length === 0 ? (
            <div style={{ color: '#666' }}>Click "Run All Tests" to start debugging...</div>
          ) : (
            debugInfo.map((log, index) => (
              <div key={index} style={{ 
                marginBottom: '5px',
                color: log.type === 'error' ? '#dc3545' : log.type === 'success' ? '#28a745' : log.type === 'warning' ? '#ffc107' : '#333'
              }}>
                <span style={{ color: '#666' }}>[{log.time}]</span> {log.message}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Map Display */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Map Test ({customers.length} customers)</h3>
        {loadError ? (
          <div style={{ color: 'red', padding: '20px', border: '1px solid red', borderRadius: '4px' }}>
            <strong>Map Load Error:</strong> {loadError.message}
            <br />
            <small>Check your Google Maps API key and ensure the Maps JavaScript API is enabled.</small>
          </div>
        ) : !isLoaded ? (
          <div style={{ padding: '20px', textAlign: 'center', border: '1px solid #ddd', borderRadius: '4px' }}>
            Loading Google Maps...
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={customers.length > 0 ? 
              { lat: customers[0].latitude, lng: customers[0].longitude } : 
              defaultCenter
            }
            zoom={customers.length > 1 ? 10 : 13}
          >
            {customers.map((customer, index) => (
              <Marker
                key={customer.id || index}
                position={{ lat: customer.latitude, lng: customer.longitude }}
                onClick={() => setSelectedCustomer(customer)}
                icon={redPinIcon}
                title={`${customer.name} - ${customer.company || 'No Company'}`}
              />
            ))}
            
            {selectedCustomer && (
              <InfoWindow
                position={{ lat: selectedCustomer.latitude, lng: selectedCustomer.longitude }}
                onCloseClick={() => setSelectedCustomer(null)}
              >
                <div style={{ maxWidth: '250px' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>{selectedCustomer.name}</h4>
                  {selectedCustomer.company && <p style={{ margin: '0 0 5px 0' }}><strong>{selectedCustomer.company}</strong></p>}
                  <p style={{ margin: '0 0 5px 0' }}>📞 {selectedCustomer.phone || 'N/A'}</p>
                  <p style={{ margin: '0 0 5px 0' }}>📧 {selectedCustomer.email || 'N/A'}</p>
                  <p style={{ margin: '0 0 5px 0' }}>📍 {selectedCustomer.address || 'N/A'}</p>
                  {selectedCustomer.status && (
                    <p style={{ margin: '0', padding: '3px 8px', background: '#e7f3ff', borderRadius: '12px', fontSize: '12px', display: 'inline-block' }}>
                      {selectedCustomer.status}
                    </p>
                  )}
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        )}
      </div>

      {/* Data Preview */}
      <div>
        <h3>Customer Data Preview</h3>
        <div style={{ maxHeight: '300px', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Name</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Company</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Phone</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Latitude</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Longitude</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.slice(0, 10).map((customer, index) => (
                <tr key={customer.id || index}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{customer.name || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{customer.company || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{customer.phone || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{customer.latitude || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{customer.longitude || 'N/A'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{customer.status || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {customers.length > 10 && (
            <p style={{ textAlign: 'center', color: '#666', margin: '10px 0' }}>
              Showing first 10 of {customers.length} customers
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebugMap;