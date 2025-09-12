import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MapPin, Calendar, Plus, Edit2, Trash2, DollarSign, ClipboardList, AlertCircle, CheckCircle, Clock, Home, Phone, Mail, RefreshCw, X, User, Tag, Briefcase, Search, TrendingUp, MessageSquare, Eye, XCircle, ShieldCheck, Navigation, Users, BarChart3, Activity, Loader2, Map, Filter } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCa63Fy9PF-NV8C_z_5Qp7VWse5nRxRRJ8",
  authDomain: "crmbackend-470221.firebaseapp.com",
  projectId: "crmbackend-470221",
  storageBucket: "crmbackend-470221.firebasestorage.app",
  messagingSenderId: "874590395925",
  appId: "1:874590395925:web:41fff249ed9a7b349af81c",
  measurementId: "G-4BG7SZMK6K"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Google Maps API Key - IMPORTANT: Replace with your actual key
const GOOGLE_MAPS_API_KEY = 'AIzaSyCYOh4HFEZNMvFbWpYgVHGcOj2rpVHPp2Y'; // Replace this!

// Google Sheets Service
class GoogleSheetsService {
  constructor() { 
    this.baseURL = 'https://script.google.com/macros/s/AKfycbw8r0tVUeFptoP0hdEQONuP8RR5NdYxBjPZwiXPZCLJLwduWAm28K23aVjqwzr4joejtA/exec';
  }
  
  async makeRequest(action, payload) { 
    try { 
      const response = await fetch(this.baseURL, { 
        method: 'POST', 
        mode: 'cors',
        credentials: 'omit',
        headers: { 
          'Content-Type': 'text/plain;charset=utf-8',
          'Accept': 'application/json'
        }, 
        body: JSON.stringify({ action, ...payload }) 
      }); 
      
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        console.warn('Could not parse response:', text);
        return { success: false, message: 'Invalid response format' };
      }
    } catch (error) { 
      console.error('Request error:', error);
      return { success: false, message: error.message }; 
    } 
  }
  
  async fetchLeads() { 
    try { 
      const url = `${this.baseURL}?action=getLeads&cacheBust=${Date.now()}`;
      
      const response = await fetch(url, { 
        method: 'GET', 
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'application/json'
        }
      }); 
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      const data = JSON.parse(text);
      
      if (data.success === false) {
        throw new Error(data.message || 'Failed to fetch leads');
      }
      
      return data.leads || []; 
    } catch (error) { 
      console.error('Could not fetch leads:', error);
      throw error;
    }
  }
  
  async addLead(lead) {
    return this.makeRequest('addLead', { lead });
  }
  
  async updateLead(lead) {
    return this.makeRequest('updateLead', { lead });
  }
  
  async deleteLead(leadId) {
    return this.makeRequest('deleteLead', { leadId });
  }
  
  async geocodeAddress(address) {
    return this.makeRequest('geocodeLead', { address });
  }
}

const googleSheetsService = new GoogleSheetsService();

// Login Component
function LoginForm({ onLogin }) {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!credentials.email || !credentials.password) {
      setError('Please enter email and password');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      sessionStorage.setItem('isAuthenticated', 'true');
      onLogin(true);
    } catch (error) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96">
        <div className="text-center mb-6">
          <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Home className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Bhotch CRM</h2>
          <p className="text-gray-500 text-sm mt-2">Sign in to manage your leads</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={credentials.email}
            onChange={(e) => setCredentials({...credentials, email: e.target.value})}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="password"
            placeholder="Password"
            value={credentials.password}
            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button 
            onClick={handleSubmit} 
            disabled={loading} 
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Interactive Map Component
function InteractiveMapView({ leads }) {
  const [selectedLead, setSelectedLead] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  // Initialize Google Maps
  useEffect(() => {
    if (!window.google && !mapLoaded) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        setMapLoaded(true);
        initializeMap();
      };
      
      script.onerror = () => {
        setMapError('Failed to load Google Maps. Please check your API key.');
      };
      
      document.head.appendChild(script);
    } else if (window.google && !mapInstanceRef.current) {
      setMapLoaded(true);
      initializeMap();
    }
  }, []);

  // Update markers when leads change
  useEffect(() => {
    if (mapInstanceRef.current && leads.length > 0) {
      updateMarkers();
    }
  }, [leads, mapLoaded]);

  const initializeMap = () => {
    if (!window.google || !mapRef.current) return;

    const mapOptions = {
      zoom: 11,
      center: { lat: 39.7392, lng: -104.9903 }, // Denver, CO
      mapTypeId: 'roadmap',
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true
    };

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
    infoWindowRef.current = new window.google.maps.InfoWindow();
    
    updateMarkers();
  };

  const updateMarkers = () => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasValidMarkers = false;

    leads.forEach(lead => {
      if (lead.latitude && lead.longitude) {
        const lat = parseFloat(lead.latitude);
        const lng = parseFloat(lead.longitude);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          const position = { lat, lng };

          const marker = new window.google.maps.Marker({
            position,
            map: mapInstanceRef.current,
            title: lead.customerName,
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
              scaledSize: new window.google.maps.Size(40, 40)
            },
            animation: window.google.maps.Animation.DROP
          });

          // Info window content
          const contentString = `
            <div style="padding: 12px; max-width: 350px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
                ${lead.customerName}
              </h3>
              <div style="space-y: 6px;">
                <p style="margin: 4px 0; color: #4b5563; font-size: 14px;">
                  <strong>📍 Address:</strong> ${lead.address || 'N/A'}
                </p>
                <p style="margin: 4px 0; color: #4b5563; font-size: 14px;">
                  <strong>📞 Phone:</strong> ${lead.phoneNumber || 'N/A'}
                </p>
                <p style="margin: 4px 0; color: #4b5563; font-size: 14px;">
                  <strong>✉️ Email:</strong> ${lead.email || 'N/A'}
                </p>
                <p style="margin: 4px 0; color: #4b5563; font-size: 14px;">
                  <strong>🏷️ Status:</strong> 
                  <span style="padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background: ${
                    lead.quality === 'Hot' ? '#fee2e2' : 
                    lead.quality === 'Warm' ? '#fef3c7' : '#f3f4f6'
                  }; color: ${
                    lead.quality === 'Hot' ? '#dc2626' : 
                    lead.quality === 'Warm' ? '#d97706' : '#6b7280'
                  };">
                    ${lead.quality || 'Cold'}
                  </span>
                </p>
                ${lead.leadSource ? 
                  `<p style="margin: 4px 0; color: #4b5563; font-size: 14px;">
                    <strong>📌 Source:</strong> ${lead.leadSource}
                  </p>` : ''
                }
                ${lead.dabellaQuote ? 
                  `<p style="margin: 4px 0; color: #059669; font-size: 14px;">
                    <strong>💰 Quote:</strong> $${parseFloat(lead.dabellaQuote).toLocaleString()}
                  </p>` : ''
                }
                ${lead.notes ? 
                  `<p style="margin: 8px 0 0 0; padding-top: 8px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;">
                    <strong>Notes:</strong> ${lead.notes.substring(0, 100)}${lead.notes.length > 100 ? '...' : ''}
                  </p>` : ''
                }
              </div>
            </div>
          `;

          marker.addListener('click', () => {
            infoWindowRef.current.setContent(contentString);
            infoWindowRef.current.open(mapInstanceRef.current, marker);
            setSelectedLead(lead);
            
            // Zoom to marker
            mapInstanceRef.current.setZoom(15);
            mapInstanceRef.current.setCenter(marker.getPosition());
          });

          markersRef.current.push(marker);
          bounds.extend(position);
          hasValidMarkers = true;
        }
      }
    });

    // Fit map to show all markers
    if (hasValidMarkers) {
      mapInstanceRef.current.fitBounds(bounds);
      
      // Don't zoom in too much for single marker
      const listener = window.google.maps.event.addListener(mapInstanceRef.current, "idle", function() { 
        if (mapInstanceRef.current.getZoom() > 16) {
          mapInstanceRef.current.setZoom(16);
        }
        window.google.maps.event.removeListener(listener);
      });
    }
  };

  return (
    <div className="h-full flex bg-gray-50">
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full"></div>
        
        {!mapLoaded && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="text-center">
              <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading map...</p>
            </div>
          </div>
        )}
        
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="text-center max-w-md">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-800 font-semibold mb-2">Map Loading Error</p>
              <p className="text-gray-600 text-sm">{mapError}</p>
            </div>
          </div>
        )}
        
        {/* Map Stats Overlay */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{leads.filter(l => l.latitude && l.longitude).length}</p>
              <p className="text-xs text-gray-500">Mapped Leads</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{leads.filter(l => l.quality === 'Hot').length}</p>
              <p className="text-xs text-gray-500">Hot Leads</p>
            </div>
          </div>
        </div>
      </div>
      
      {selectedLead && (
        <div className="w-96 bg-white shadow-xl overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-800">{selectedLead.customerName}</h3>
              <button 
                onClick={() => setSelectedLead(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>📍 Address:</strong> {selectedLead.address}</p>
                  <p><strong>📞 Phone:</strong> {selectedLead.phoneNumber || 'N/A'}</p>
                  <p><strong>✉️ Email:</strong> {selectedLead.email || 'N/A'}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Lead Details</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Quality:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      selectedLead.quality === 'Hot' ? 'bg-red-100 text-red-800' : 
                      selectedLead.quality === 'Warm' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedLead.quality}
                    </span>
                  </p>
                  <p><strong>Source:</strong> {selectedLead.leadSource || 'N/A'}</p>
                  <p><strong>Status:</strong> {selectedLead.leadStatus || 'New'}</p>
                  {selectedLead.dabellaQuote && (
                    <p className="text-green-600 font-semibold">
                      <strong>Quote:</strong> ${parseFloat(selectedLead.dabellaQuote).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              
              {selectedLead.notes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Notes</h4>
                  <p className="text-sm text-gray-600">{selectedLead.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Calendar View Component
function CalendarView() {
  return (
    <div className="h-full bg-white">
      <div className="p-6 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Calendar</h2>
            <p className="text-sm text-gray-600 mt-1">View and manage your appointments</p>
          </div>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus size={20} className="inline mr-1" /> Add Event
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-6 h-[calc(100%-100px)]">
        <iframe 
          src="https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=America%2FDenver&showPrint=0&title=Bhotch%20Appointment&src=YnJhbmRvbkByaW1laHEubmV0&src=YnJhbmRvbi5ob3RjaGtpc3NAZ21haWwuY29t&color=%23addf00&color=%233f51b5" 
          style={{border: '1px solid #e5e7eb', borderRadius: '8px'}} 
          width="100%" 
          height="100%" 
          frameBorder="0" 
          scrolling="no"
          title="Google Calendar"
        ></iframe>
      </div>
    </div>
  );
}

// Dashboard Component
function Dashboard({ leads }) {
  const stats = useMemo(() => {
    const total = leads.length;
    const hot = leads.filter(l => l.quality === 'Hot').length;
    const warm = leads.filter(l => l.quality === 'Warm').length;
    const cold = leads.filter(l => l.quality === 'Cold').length;
    const quoted = leads.filter(l => l.dabellaQuote && parseFloat(l.dabellaQuote) > 0).length;
    const totalQuoteValue = leads.reduce((sum, l) => sum + (parseFloat(l.dabellaQuote) || 0), 0);
    const mapped = leads.filter(l => l.latitude && l.longitude).length;
    
    return { total, hot, warm, cold, quoted, totalQuoteValue, mapped };
  }, [leads]);

  const recentLeads = useMemo(() => {
    return [...leads]
      .sort((a, b) => new Date(b.createdDate || 0) - new Date(a.createdDate || 0))
      .slice(0, 5);
  }, [leads]);

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your lead overview.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Leads</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="h-7 w-7 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Hot Leads</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.hot}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <Activity className="h-7 w-7 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Quoted Leads</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.quoted}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <BarChart3 className="h-7 w-7 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Quote Value</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">${stats.totalQuoteValue.toLocaleString()}</p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-lg">
              <DollarSign className="h-7 w-7 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Lead Distribution</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Hot Leads</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{stats.hot}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Warm Leads</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{stats.warm}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-400 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Cold Leads</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{stats.cold}</span>
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 text-blue-600 mr-3" />
                <span className="text-sm font-medium text-gray-700">Mapped Leads</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{stats.mapped}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Recent Activity</h2>
          <div className="space-y-3">
            {recentLeads.map(lead => (
              <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{lead.customerName}</p>
                  <p className="text-sm text-gray-500 truncate">{lead.address}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  lead.quality === 'Hot' ? 'bg-red-100 text-red-800' : 
                  lead.quality === 'Warm' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {lead.quality || 'Cold'}
                </span>
              </div>
            ))}
            {recentLeads.length === 0 && (
              <p className="text-center text-gray-500 py-4">No recent leads</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Lead Form Component
function LeadForm({ lead, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    customerName: lead?.customerName || '',
    address: lead?.address || '',
    phoneNumber: lead?.phoneNumber || '',
    email: lead?.email || '',
    quality: lead?.quality || 'Cold',
    leadSource: lead?.leadSource || 'Door to Door',
    disposition: lead?.disposition || '',
    dabellaQuote: lead?.dabellaQuote || '',
    roofType: lead?.roofType || '',
    roofAge: lead?.roofAge || '',
    inspectionStatus: lead?.inspectionStatus || '',
    notes: lead?.notes || '',
    followupDate: lead?.followupDate || '',
    appointmentDate: lead?.appointmentDate || '',
    leadStatus: lead?.leadStatus || 'New'
  });

  const handleSubmit = () => {
    if (!formData.customerName || !formData.address) {
      alert('Please fill in required fields (Name and Address)');
      return;
    }
    onSubmit({ ...lead, ...formData });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">
              {lead ? 'Edit Lead' : 'Add New Lead'}
            </h2>
            <button 
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="123 Main St, Denver, CO"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="john@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lead Quality</label>
              <select
                value={formData.quality}
                onChange={(e) => setFormData({...formData, quality: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Cold">Cold</option>
                <option value="Warm">Warm</option>
                <option value="Hot">Hot</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lead Source</label>
              <select
                value={formData.leadSource}
                onChange={(e) => setFormData({...formData, leadSource: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Door to Door">Door to Door</option>
                <option value="Referral">Referral</option>
                <option value="Online">Online</option>
                <option value="Phone">Phone</option>
                <option value="Social Media">Social Media</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quote Amount</label>
              <input
                type="number"
                value={formData.dabellaQuote}
                onChange={(e) => setFormData({...formData, dabellaQuote: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="15000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lead Status</label>
              <select
                value={formData.leadStatus}
                onChange={(e) => setFormData({...formData, leadStatus: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Quoted">Quoted</option>
                <option value="Closed Won">Closed Won</option>
                <option value="Closed Lost">Closed Lost</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Roof Type</label>
              <input
                type="text"
                value={formData.roofType}
                onChange={(e) => setFormData({...formData, roofType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Asphalt Shingle"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Roof Age</label>
              <input
                type="text"
                value={formData.roofAge}
                onChange={(e) => setFormData({...formData, roofAge: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10 years"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Status</label>
              <select
                value={formData.inspectionStatus}
                onChange={(e) => setFormData({...formData, inspectionStatus: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Not Scheduled</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
              <input
                type="date"
                value={formData.followupDate}
                onChange={(e) => setFormData({...formData, followupDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Add any additional notes about this lead..."
            ></textarea>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={onCancel} 
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit} 
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {lead ? 'Update' : 'Add'} Lead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main App Component
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [editingLead, setEditingLead] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterQuality, setFilterQuality] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const addNotification = useCallback((message, type = 'info') => {
    const newNotification = { 
      id: Date.now().toString(), 
      message, 
      type 
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  }, []);

  const loadLeadsData = useCallback(async (isManualRefresh = false) => {
    try {
      if (!isManualRefresh) setLoading(true);
      else setRefreshing(true);
      
      const sheetsLeads = await googleSheetsService.fetchLeads();
      
      // Remove duplicates
      const seenIds = new Set();
      const uniqueLeads = sheetsLeads.filter(lead => {
        if (!lead.id || seenIds.has(lead.id)) return false;
        seenIds.add(lead.id);
        return true;
      });

      setLeads(uniqueLeads);
      
      if (isManualRefresh) {
        addNotification('Leads refreshed successfully', 'success');
      } else if (uniqueLeads.length > 0) {
        addNotification(`Loaded ${uniqueLeads.length} leads`, 'success');
      }
    } catch (error) {
      console.error('Error loading leads:', error);
      addNotification(`Error: ${error.message}`, 'error');
      setLeads([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addNotification]);

  useEffect(() => {
    const storedAuth = sessionStorage.getItem('isAuthenticated');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadLeadsData();
    }
  }, [isAuthenticated, loadLeadsData]);

  const handleAddLead = async (leadData) => {
    try {
      const response = await googleSheetsService.addLead(leadData);
      if (response.success) {
        await loadLeadsData(true);
        addNotification(`Lead added: ${leadData.customerName}`, 'success');
        setShowAddForm(false);
      } else {
        throw new Error(response.message || 'Failed to add lead');
      }
    } catch (error) {
      addNotification(`Error: ${error.message}`, 'error');
    }
  };

  const handleUpdateLead = async (leadData) => {
    try {
      const response = await googleSheetsService.updateLead(leadData);
      if (response.success) {
        await loadLeadsData(true);
        addNotification(`Lead updated: ${leadData.customerName}`, 'success');
        setEditingLead(null);
      } else {
        throw new Error(response.message || 'Failed to update lead');
      }
    } catch (error) {
      addNotification(`Error: ${error.message}`, 'error');
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    
    try {
      const response = await googleSheetsService.deleteLead(leadId);
      if (response.success) {
        await loadLeadsData(true);
        addNotification('Lead deleted successfully', 'success');
      } else {
        throw new Error(response.message || 'Failed to delete lead');
      }
    } catch (error) {
      addNotification(`Error: ${error.message}`, 'error');
    }
  };

  const filteredLeads = useMemo(() => {
    let filtered = [...leads];
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(lead => 
        lead.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phoneNumber?.includes(searchTerm) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by quality
    if (filterQuality !== 'all') {
      filtered = filtered.filter(lead => lead.quality === filterQuality);
    }
    
    return filtered;
  }, [leads, searchTerm, filterQuality]);

  const handleLogout = () => {
    sessionStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    setLeads([]);
  };

  if (!isAuthenticated) {
    return <LoginForm onLogin={setIsAuthenticated} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading CRM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <div className="bg-blue-600 rounded-lg p-2 mr-3">
                  <Home className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Bhotch CRM</h1>
              </div>
              
              <nav className="flex space-x-1">
                <button 
                  onClick={() => setCurrentView('dashboard')} 
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === 'dashboard' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 size={20} className="inline mr-2" />
                  Dashboard
                </button>
                <button 
                  onClick={() => setCurrentView('leads')} 
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === 'leads' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Users size={20} className="inline mr-2" />
                  Leads
                </button>
                <button 
                  onClick={() => setCurrentView('map')} 
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === 'map' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <MapPin size={20} className="inline mr-2" />
                  Map
                </button>
                <button 
                  onClick={() => setCurrentView('calendar')} 
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === 'calendar' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Calendar size={20} className="inline mr-2" />
                  Calendar
                </button>
              </nav>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => loadLeadsData(true)} 
                disabled={refreshing}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
              </button>
              <button 
                onClick={() => setShowAddForm(true)} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus size={20} className="inline mr-1" />
                Add Lead
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
              >
                <XCircle size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {notifications.map(notif => (
          <div 
            key={notif.id} 
            className={`p-4 rounded-lg shadow-lg transition-all transform animate-slide-in-right ${
              notif.type === 'success' ? 'bg-green-500 text-white' :
              notif.type === 'error' ? 'bg-red-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            <div className="flex items-center">
              {notif.type === 'success' && <CheckCircle className="mr-2" size={20} />}
              {notif.type === 'error' && <AlertCircle className="mr-2" size={20} />}
              <span className="font-medium">{notif.message}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <main className="h-[calc(100vh-73px)]">
        {currentView === 'dashboard' && <Dashboard leads={filteredLeads} />}
        
        {currentView === 'leads' && (
          <div className="p-6 bg-gray-50 min-h-full">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">All Leads</h2>
                <p className="text-gray-600 mt-1">{filteredLeads.length} total leads</p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg flex-1 sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={filterQuality}
                  onChange={(e) => setFilterQuality(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Quality</option>
                  <option value="Hot">Hot</option>
                  <option value="Warm">Warm</option>
                  <option value="Cold">Cold</option>
                </select>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Address</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Quality</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Quote</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredLeads.map(lead => (
                      <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{lead.customerName}</div>
                          <div className="text-sm text-gray-500">{lead.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{lead.address}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {lead.phoneNumber || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            lead.quality === 'Hot' ? 'bg-red-100 text-red-800' :
                            lead.quality === 'Warm' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {lead.quality}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {lead.leadStatus || 'New'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-green-600">
                            {lead.dabellaQuote ? `$${parseFloat(lead.dabellaQuote).toLocaleString()}` : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => setEditingLead(lead)} 
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeleteLead(lead.id)} 
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredLeads.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No leads found</p>
                    <p className="text-gray-400 text-sm mt-1">Try adjusting your search filters</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {currentView === 'map' && <InteractiveMapView leads={filteredLeads} />}
        {currentView === 'calendar' && <CalendarView />}
      </main>

      {/* Forms */}
      {showAddForm && (
        <LeadForm onSubmit={handleAddLead} onCancel={() => setShowAddForm(false)} />
      )}
      
      {editingLead && (
        <LeadForm lead={editingLead} onSubmit={handleUpdateLead} onCancel={() => setEditingLead(null)} />
      )}
      
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}