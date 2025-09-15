import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MapPin, Calendar, Plus, Edit2, Trash2, DollarSign, AlertCircle, CheckCircle, Home, RefreshCw, X, XCircle, Users, BarChart3, Activity, Loader2, ClipboardList, Clock, Phone, Mail, User, Tag, Briefcase, Search, TrendingUp, MessageSquare, Eye, ShieldCheck, Map } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// --- Environment Variables & Firebase Initialization ---
let app;
let auth;
let firebaseError = null;

try {
  const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
  };

  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain) {
    throw new Error("Firebase config is missing. Check your Vercel environment variables.");
  }

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (error) {
  console.error("CRITICAL: Firebase initialization failed.", error);
  firebaseError = error.message;
}

const GOOGLE_SCRIPT_URL = process.env.REACT_APP_GAS_WEB_APP_URL;
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

// --- API Service ---
class GoogleSheetsService {
  constructor(baseURL) { this.baseURL = baseURL; }
  
  async makeRequest(action, payload) {
    if (!this.baseURL) {
      return { success: false, message: 'API endpoint is not configured.' };
    }
    
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        redirect: 'follow', // Important for Google Apps Script redirects
        headers: { 
          'Content-Type': 'text/plain;charset=utf-8' // Use text/plain to avoid CORS preflight
        },
        body: JSON.stringify({ action, ...payload })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      
      try { 
        const result = JSON.parse(text);
        // Handle both success/error patterns
        if (result.success === false && result.error) {
          return { success: false, message: result.error };
        }
        return result;
      } catch (parseError) { 
        console.error('Failed to parse response:', text);
        return { success: false, message: 'Invalid server response.', rawResponse: text }; 
      }
    } catch (error) {
      console.error('Network error:', error);
      return { success: false, message: `Network error: ${error.message}` };
    }
  }
  
  fetchLeads() { return this.makeRequest('getLeads', {}); }
  addLead(lead) { return this.makeRequest('addLead', { lead }); }
  updateLead(lead) { return this.makeRequest('updateLead', { lead }); }
  deleteLead(leadId) { return this.makeRequest('deleteLead', { leadId }); }
  testConnection() { return this.makeRequest('testConnection', {}); }
  geocodeAddress(address) { return this.makeRequest('geocodeAddress', { address }); }
}

const googleSheetsService = new GoogleSheetsService(GOOGLE_SCRIPT_URL);

// --- Google Maps Integration ---
let googleMapsLoaded = false;

const loadGoogleMaps = () => {
  return new Promise((resolve, reject) => {
    if (googleMapsLoaded) {
      resolve(window.google);
      return;
    }

    if (window.google && window.google.maps) {
      googleMapsLoaded = true;
      resolve(window.google);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry,places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      googleMapsLoaded = true;
      resolve(window.google);
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Google Maps'));
    };
    
    document.head.appendChild(script);
  });
};

// --- UI Components ---

function FirebaseErrorDisplay({ error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-lg">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Application Error</h2>
        <p className="text-gray-600 mb-4">Could not start due to a configuration issue.</p>
        <div className="bg-red-100 text-red-700 text-left p-3 rounded-md text-sm"><strong>Details:</strong> {error}</div>
        <p className="text-gray-500 mt-4 text-sm">Ensure `REACT_APP_FIREBASE_*` variables are set in Vercel.</p>
      </div>
    </div>
  );
}

function LoginForm({ onLogin }) {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      sessionStorage.setItem('isAuthenticated', 'true');
      onLogin();
    } catch (err) {
      setError('Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96">
        <div className="text-center mb-6">
          <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4"><Home className="h-10 w-10 text-blue-600" /></div>
          <h2 className="text-2xl font-bold text-gray-800">Bhotch CRM</h2>
          <p className="text-gray-500 text-sm mt-2">Sign in to manage your leads</p>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" value={credentials.email} onChange={(e) => setCredentials({ ...credentials, email: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          <input type="password" placeholder="Password" value={credentials.password} onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center">
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Reusable UI Components ---
const StatCard = ({ title, value, icon, color }) => {
    const colors = { blue: 'bg-blue-100 text-blue-800', red: 'bg-red-100 text-red-800', green: 'bg-green-100 text-green-800', purple: 'bg-purple-100 text-purple-800' };
    return <div className="bg-white rounded-lg shadow p-5"><div className="flex items-center"><div className={`p-3 rounded-full ${colors[color]}`}>{icon}</div><div className="ml-4"><p className="text-sm font-medium text-gray-500 truncate">{title}</p><p className="text-2xl font-semibold text-gray-900">{value}</p></div></div></div>
};

const DetailItem = ({ icon, label, value }) => (
    <div>
        <dt className="text-sm font-medium text-gray-500 flex items-center">{icon}{label}</dt>
        <dd className="mt-1 text-sm text-gray-900">{value || <span className="text-gray-400">Not provided</span>}</dd>
    </div>
);

const FormSection = ({ title, children }) => <div className="mb-6"><h4 className="text-md font-semibold text-gray-800 border-b pb-2 mb-4">{title}</h4><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div></div>;
const FormField = ({ label, children, fullWidth = false }) => <div className={fullWidth ? 'lg:col-span-3 md:col-span-2' : ''}><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>{children}</div>;
const TextInput = (props) => <input {...props} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />;
const SelectInput = ({ children, ...props }) => <select {...props} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500">{children}</select>;
const TextareaInput = (props) => <textarea {...props} rows={4} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />;

// --- Dashboard View Component ---
function DashboardView({ stats, leads }) {
  const recentLeads = leads.slice(-5).reverse();
  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Leads" value={stats.totalLeads} icon={<ClipboardList size={24} />} color="blue" />
            <StatCard title="Hot Leads" value={stats.hotLeads} icon={<AlertCircle size={24} />} color="red" />
            <StatCard title="Quoted Leads" value={stats.quotedLeads} icon={<DollarSign size={24} />} color="green" />
            <StatCard title="Total Quote Value" value={`$${stats.totalQuoteValue.toLocaleString()}`} icon={<Briefcase size={24} />} color="purple" />
        </div>
        <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200"><h3 className="text-lg font-medium text-gray-900">Recent Leads</h3></div>
            <div className="p-6">
                {recentLeads.length === 0 ? <p className="text-gray-500 text-center py-4">No recent leads.</p> :
                <div className="space-y-4">
                    {recentLeads.map(lead => (
                        <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                            <div>
                                <h4 className="font-medium text-gray-900">{lead.customerName}</h4>
                                <p className="text-sm text-gray-500">{lead.leadSource} - {lead.disposition}</p>
                                <p className="text-sm font-medium text-green-600">{lead.dabellaQuote || "No Quote"}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">{lead.phoneNumber}</p>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${lead.quality === 'Hot' ? 'bg-red-100 text-red-800' : lead.quality === 'Warm' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{lead.quality}</span>
                            </div>
                        </div>
                    ))}
                </div>}
            </div>
        </div>
    </div>
  );
}

// --- Google Maps Component ---
function GoogleMapComponent({ leads, onLeadClick }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeMap = async () => {
      try {
        if (!GOOGLE_MAPS_API_KEY) {
          throw new Error('Google Maps API key is not configured');
        }

        const google = await loadGoogleMaps();
        
        if (!mapRef.current) return;

        const mapOptions = {
          center: { lat: 39.7392, lng: -104.9903 }, // Denver, CO default
          zoom: 10,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        };

        const newMap = new google.maps.Map(mapRef.current, mapOptions);
        setMap(newMap);
        setLoading(false);
      } catch (err) {
        console.error('Failed to initialize Google Maps:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    initializeMap();
  }, []);

  useEffect(() => {
    if (!map || !window.google) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    
    const newMarkers = [];
    const bounds = new window.google.maps.LatLngBounds();

    // Filter leads that have coordinates
    const leadsWithCoords = leads.filter(lead => 
      lead.latitude && lead.longitude && 
      !isNaN(parseFloat(lead.latitude)) && !isNaN(parseFloat(lead.longitude))
    );

    leadsWithCoords.forEach(lead => {
      const position = {
        lat: parseFloat(lead.latitude),
        lng: parseFloat(lead.longitude)
      };

      const marker = new window.google.maps.Marker({
        position: position,
        map: map,
        title: lead.customerName,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#dc2626" stroke="#ffffff" stroke-width="2"/>
              <circle cx="16" cy="16" r="4" fill="#ffffff"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 16)
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="max-width: 250px; padding: 8px;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
              ${lead.customerName || 'Unknown Customer'}
            </h3>
            <div style="color: #6b7280; font-size: 14px; line-height: 1.4;">
              <p style="margin: 4px 0;"><strong>Phone:</strong> ${lead.phoneNumber || 'N/A'}</p>
              <p style="margin: 4px 0;"><strong>Address:</strong> ${lead.address || 'N/A'}</p>
              <p style="margin: 4px 0;"><strong>Status:</strong> ${lead.disposition || 'N/A'}</p>
              <p style="margin: 4px 0;"><strong>Quote:</strong> ${lead.dabellaQuote || 'No Quote'}</p>
              <p style="margin: 8px 0 4px 0;">
                <button onclick="window.viewLeadDetails('${lead.id}')" 
                        style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                  View Details
                </button>
              </p>
            </div>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      newMarkers.push(marker);
      bounds.extend(position);
    });

    setMarkers(newMarkers);

    // Fit map to show all markers
    if (leadsWithCoords.length > 0) {
      if (leadsWithCoords.length === 1) {
        map.setCenter(bounds.getCenter());
        map.setZoom(15);
      } else {
        map.fitBounds(bounds);
      }
    }

    // Global function for info window buttons
    window.viewLeadDetails = (leadId) => {
      const lead = leads.find(l => l.id === leadId);
      if (lead && onLeadClick) {
        onLeadClick(lead);
      }
    };

    return () => {
      window.viewLeadDetails = null;
    };
  }, [map, leads, onLeadClick, markers]);

  if (loading) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-96 bg-red-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
          <p className="text-red-600 font-medium">Failed to load map</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-300">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}

// --- Map View Component ---
function MapView({ leads, onLeadClick }) {
  const leadsWithCoords = leads.filter(lead => 
    lead.latitude && lead.longitude && 
    !isNaN(parseFloat(lead.latitude)) && !isNaN(parseFloat(lead.longitude))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Map className="w-8 h-8 mr-3 text-blue-600" />
          Customer Locations
        </h2>
        <div className="text-sm text-gray-600">
          Showing {leadsWithCoords.length} of {leads.length} customers with addresses
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <GoogleMapComponent leads={leads} onLeadClick={onLeadClick} />
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Map Legend</h3>
          <div className="flex items-center space-x-4 text-xs text-gray-600">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-600 rounded-full mr-2"></div>
              Customer Location
            </div>
            <div className="text-gray-500">
              Click on pins to view customer details
            </div>
          </div>
        </div>
      </div>

      {leadsWithCoords.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No locations to display</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add addresses to your leads to see them on the map
          </p>
        </div>
      )}
    </div>
  );
}

// --- Calendar View Component ---
function CalendarView() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Calendar className="w-8 h-8 mr-3 text-blue-600" />
          Appointment Calendar
        </h2>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your Schedule</h3>
          <p className="text-sm text-gray-600">
            Manage your appointments and schedule new ones with customers.
          </p>
        </div>
        
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <iframe 
            src="https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=America%2FDenver&showPrint=0&title=Bhotch%20Appointment&src=YnJhbmRvbkByaW1laHEubmV0&src=YnJhbmRvbi5ob3RjaGtpc3NAZ21haWwuY29t&color=%23addf00&color=%233f51b5" 
            style={{ border: 'none', width: '100%', height: '600px' }}
            frameBorder="0" 
            scrolling="no"
            title="Bhotch CRM Calendar"
          />
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Calendar Features</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Schedule appointments directly from lead details</li>
            <li>• Sync with your existing Google Calendar</li>
            <li>• Set reminders for follow-ups</li>
            <li>• Track appointment history</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// --- Professional Leads View Component ---
const ProfessionalLeadsView = ({ leads, onAddLead, onEditLead, onDeleteLead, onRefreshLeads }) => {
    const [selectedLead, setSelectedLead] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDisposition, setFilterDisposition] = useState('All');
    const [filterSource, setFilterSource] = useState('All');

    const getStatusBadge = (status) => {
        const badges = { 'New': { bg: 'bg-blue-100', text: 'text-blue-800', icon: Plus },'Scheduled': { bg: 'bg-cyan-100', text: 'text-cyan-800', icon: Calendar },'Insurance': { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: ShieldCheck },'Quoted': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: DollarSign }, 'Follow Up': { bg: 'bg-orange-100', text: 'text-orange-800', icon: Clock },'Closed Sold': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle }, 'Closed Lost': { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle } };
        const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle };
        const Icon = badge.icon;
        return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}><Icon className="w-3 h-3 mr-1" />{status}</span>;
    };

    const formatPhone = (phone) => {
        const phoneString = String(phone || '');
        if (!phoneString) return '';
        const cleaned = phoneString.replace(/\D/g, '');
        if (cleaned.length === 10) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        return phoneString;
    };

    const formatCurrency = (amount) => {
        const amountString = String(amount || '');
        if (!amountString || amountString === '-' || amountString === '0') return 'N/A';
        return amountString.includes('$') ? amountString : `$${amountString}`;
    };

    const filteredAndSortedLeads = useMemo(() => {
        let filtered = leads.filter(lead =>
            (lead.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || lead.phoneNumber?.toString().includes(searchTerm) || lead.address?.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (filterDisposition === 'All' || lead.disposition === filterDisposition) &&
            (filterSource === 'All' || lead.leadSource === filterSource)
        );
        return filtered.sort((a, b) => new Date(b.createdDate || 0) - new Date(a.createdDate || 0));
    }, [leads, searchTerm, filterDisposition, filterSource]);

    const dispositionOptions = ['New', 'Scheduled', 'Insurance', 'Quoted', 'Follow Up', 'Closed Sold', 'Closed Lost'];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Lead Management</h2>
                <div className="flex items-center space-x-3">
                    <button onClick={onRefreshLeads} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"><RefreshCw className="w-4 h-4 mr-2" /> Refresh</button>
                    <button onClick={onAddLead} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />Add Lead</button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative md:col-span-2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input type="text" placeholder="Search by name, phone, or address..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <select value={filterDisposition} onChange={(e) => setFilterDisposition(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="All">All Dispositions</option>
                        {dispositionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"><option value="All">All Sources</option><option>Door Knock</option><option>Rime</option><option>Adverta</option><option>Referral</option><option>Cold Call</option></select>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quote</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAndSortedLeads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setSelectedLead(lead)}>
                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{lead.customerName || 'N/A'}</div></td>
                                <td className="px-6 py-4 whitespace-nowrap"><a href={`tel:${lead.phoneNumber}`} onClick={(e) => e.stopPropagation()} className="hover:text-blue-600 text-sm text-gray-900">{formatPhone(lead.phoneNumber)}</a></td>
                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{formatCurrency(lead.dabellaQuote)}</div></td>
                                <td className="px-6 py-4 whitespace-nowrap">{lead.leadSource}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(lead.disposition)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center space-x-2">
                                        <button onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); }} className="text-blue-600 hover:text-blue-900 p-1 rounded" title="View Details"><Eye className="w-4 h-4" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); onEditLead(lead); }} className="text-orange-600 hover:text-orange-900 p-1 rounded" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredAndSortedLeads.length === 0 && ( <div className="text-center py-12"><AlertCircle className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-sm font-medium text-gray-900">No leads found</h3><p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p></div>)}
            </div>
            {selectedLead && <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} onEdit={() => { onEditLead(selectedLead); setSelectedLead(null); }} onDelete={() => { onDeleteLead(selectedLead.id); setSelectedLead(null); }}/>}
        </div>
    );
};

// --- Lead Detail Modal ---
function LeadDetailModal({ lead, onClose, onEdit, onDelete }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-40 animate-fade-in">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b flex justify-between items-center"><div><h3 className="text-xl font-semibold text-gray-900 flex items-center"><User className="mr-3 text-blue-600" />{lead.customerName}</h3><p className="text-sm text-gray-500">{lead.address}</p></div><button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button></div>
        <div className="p-6 overflow-y-auto"><div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b"><DetailItem icon={<Phone size={14} className="mr-2" />} label="Phone" value={<a href={`tel:${lead.phoneNumber}`} className="text-blue-600 hover:underline">{lead.phoneNumber}</a>} /><DetailItem icon={<Mail size={14} className="mr-2" />} label="Email" value={<a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">{lead.email}</a>} /><DetailItem icon={<DollarSign size={14} className="mr-2" />} label="Quote" value={<span className="font-bold text-green-700">{lead.dabellaQuote}</span>} /></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b"><DetailItem icon={<Tag size={14} className="mr-2" />} label="Quality" value={<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${lead.quality === 'Hot' ? 'bg-red-100 text-red-800' : lead.quality === 'Warm' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{lead.quality}</span>} /><DetailItem icon={<ClipboardList size={14} className="mr-2" />} label="Disposition" value={lead.disposition} /><DetailItem icon={<Briefcase size={14} className="mr-2" />} label="Lead Source" value={lead.leadSource} /></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b"><div className="bg-gray-50 p-4 rounded-lg text-center"><Calendar size={24} className="mx-auto text-gray-400 mb-2"/><h4 className="font-semibold text-sm">Appointments</h4><p className="text-xs text-gray-500">Click calendar tab to schedule</p></div><div className="bg-gray-50 p-4 rounded-lg text-center"><Mail size={24} className="mx-auto text-gray-400 mb-2"/><h4 className="font-semibold text-sm">Communications</h4><p className="text-xs text-gray-500">SMS/Email integration coming soon.</p></div><div className="bg-gray-50 p-4 rounded-lg text-center"><MapPin size={24} className="mx-auto text-gray-400 mb-2"/><h4 className="font-semibold text-sm">Location</h4><p className="text-xs text-gray-500">View on map tab</p></div></div><div><h4 className="text-md font-semibold text-gray-800 mb-2">Notes</h4><p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-md whitespace-pre-wrap">{lead.notes || "No notes for this lead."}</p></div></div>
        <div className="flex justify-end space-x-3 p-4 bg-gray-50 border-t"><button onClick={onDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"><Trash2 size={16} className="mr-2"/>Delete</button><button onClick={onEdit} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"><Edit2 size={16} className="mr-2"/>Edit Lead</button></div>
      </div>
    </div>
  );
}

// --- Lead Form Modal ---
const initialFormData = { customerName: '', address: '', phoneNumber: '', email: '', dabellaQuote: '', quality: 'Cold', notes: '', disposition: 'New', leadSource: 'Door Knock', roofAge: '', roofType: 'Asphalt Shingle', inspectionStatus: 'Not Scheduled', appointmentDate: '', date: '', followupDate: '', leadStatus: '' };

function LeadFormModal({ initialData = initialFormData, onSubmit, onCancel, isEdit = false }) {
    const [formData, setFormData] = useState(initialData);
    const [isGeocoding, setIsGeocoding] = useState(false);
    
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    
    const handleSubmit = async (e) => { 
        e.preventDefault(); 
        
        // Try to geocode address if it's provided and we don't have coordinates
        if (formData.address && (!formData.latitude || !formData.longitude)) {
            setIsGeocoding(true);
            try {
                const geocodeResult = await googleSheetsService.geocodeAddress(formData.address);
                if (geocodeResult.success) {
                    formData.latitude = geocodeResult.latitude;
                    formData.longitude = geocodeResult.longitude;
                }
            } catch (error) {
                console.warn('Geocoding failed:', error);
            } finally {
                setIsGeocoding(false);
            }
        }
        
        onSubmit(formData); 
    };
    
    const dispositionOptions = ['New', 'Scheduled', 'Insurance', 'Quoted', 'Follow Up', 'Closed Sold', 'Closed Lost'];

    return <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-40"><div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col"><div className="p-6 border-b flex justify-between items-center"><h3 className="text-lg font-medium text-gray-900">{isEdit ? "Edit Lead" : "Add New Lead"}</h3><button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={24}/></button></div><div className="p-6 overflow-y-auto"><form onSubmit={handleSubmit}>
        <FormSection title="Customer Information"><FormField label="Full Name *"><TextInput name="customerName" value={formData.customerName} onChange={handleChange} required /></FormField><FormField label="Phone Number *"><TextInput name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required /></FormField><FormField label="Email"><TextInput name="email" type="email" value={formData.email} onChange={handleChange} /></FormField><FormField label="Address" fullWidth><TextInput name="address" value={formData.address} onChange={handleChange} placeholder="Full address for map location" /></FormField></FormSection>
        <FormSection title="Lead Details">
            <FormField label="Lead Source"><SelectInput name="leadSource" value={formData.leadSource} onChange={handleChange}><option>Door Knock</option><option>Rime</option><option>Adverta</option><option>Referral</option><option>Cold Call</option></SelectInput></FormField>
            <FormField label="Quality"><SelectInput name="quality" value={formData.quality} onChange={handleChange}><option>Hot</option><option>Warm</option><option>Cold</option></SelectInput></FormField>
            <FormField label="Disposition"><SelectInput name="disposition" value={formData.disposition} onChange={handleChange}>{dispositionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</SelectInput></FormField>
        </FormSection>
        <FormSection title="Job & Quote Details"><FormField label="Roof Age"><TextInput name="roofAge" value={formData.roofAge} onChange={handleChange} /></FormField><FormField label="Roof Type"><SelectInput name="roofType" value={formData.roofType} onChange={handleChange}><option>Asphalt Shingle</option><option>Metal</option><option>Tile</option><option>TPO</option><option>Wood</option></SelectInput></FormField><FormField label="Quote Amount"><TextInput name="dabellaQuote" value={formData.dabellaQuote} onChange={handleChange} placeholder="$15,000" /></FormField></FormSection>
        <FormSection title="Notes"><FormField label="Notes" fullWidth><TextareaInput name="notes" value={formData.notes} onChange={handleChange} /></FormField></FormSection>
        <div className="flex justify-end space-x-3 pt-4 border-t mt-6"><button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button><button type="submit" disabled={isGeocoding} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">{isGeocoding ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />Saving...</> : (isEdit ? "Update Lead" : "Add Lead")}</button></div>
    </form></div></div></div>;
}

// --- Connection Status Component ---
function ConnectionStatus({ onTestConnection }) {
  const [status, setStatus] = useState(null);
  const [testing, setTesting] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    try {
      const result = await googleSheetsService.testConnection();
      setStatus(result);
    } catch (error) {
      setStatus({ success: false, message: 'Connection test failed' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-medium text-gray-900">Google Sheets Connection</h3>
          {status && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              status.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {status.success ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
              {status.success ? 'Connected' : 'Disconnected'}
            </span>
          )}
        </div>
        <button 
          onClick={testConnection}
          disabled={testing}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          {testing ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Test Connection
        </button>
      </div>
      {status && (
        <div className="mt-2 text-sm text-gray-600">
          {status.message}
          {status.success && status.lastRow && ` (${status.lastRow} rows)`}
        </div>
      )}
    </div>
  );
}

// --- Full CRM Application Component ---
function CrmApplication({ onLogout }) {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [editingLead, setEditingLead] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMapLead, setSelectedMapLead] = useState(null);

  const addNotification = useCallback((message, type = 'info') => {
    const newNotification = { id: Date.now().toString(), message, type };
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== newNotification.id)), 5000);
  }, []);

  const loadLeadsData = useCallback(async (isManualRefresh = false) => {
    try {
      if (!isManualRefresh) setLoading(true);
      const response = await googleSheetsService.fetchLeads();
      if(response.success) {
        // Process leads to ensure customerName is set
        const processedLeads = response.leads.map(lead => ({
          ...lead,
          customerName: lead.customerName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown Customer'
        }));
        setLeads(processedLeads);
         if (isManualRefresh) addNotification('Leads refreshed successfully.', 'success');
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      addNotification(`Error loading leads: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);
  
  useEffect(() => {
    loadLeadsData();
  }, [loadLeadsData]);

  const handleAddLead = async (leadData) => {
      try {
        const response = await googleSheetsService.addLead(leadData);
        if (response.success) {
          setLeads(prev => [response.lead, ...prev]);
          addNotification(`Lead added: ${leadData.customerName}`, 'success');
          setShowAddForm(false);
        } else {
          addNotification(`Error adding lead: ${response.message}`, 'error');
        }
      } catch (error) {
        addNotification(`Error adding lead: ${error.message}`, 'error');
      }
  };

  const handleUpdateLead = async (updatedLead) => {
      try {
        const response = await googleSheetsService.updateLead(updatedLead);
        if (response.success) {
          setLeads(leads.map(lead => (lead.id === updatedLead.id ? updatedLead : lead)));
          addNotification(`Lead updated: ${updatedLead.customerName}`, 'info');
          setEditingLead(null);
        } else {
          addNotification(`Error updating lead: ${response.message}`, 'error');
        }
      } catch (error) {
        addNotification(`Error updating lead: ${error.message}`, 'error');
      }
  };

  const handleDeleteLead = async (leadId) => {
    const leadToDelete = leads.find(l => l.id === leadId);
    if (window.confirm(`Are you sure you want to delete ${leadToDelete?.customerName}?`)) {
        try {
          const response = await googleSheetsService.deleteLead(leadId);
          if (response.success) {
            setLeads(leads.filter(l => l.id !== leadId));
            addNotification(`Lead deleted: ${leadToDelete?.customerName}`, 'warning');
          } else {
            addNotification(`Error deleting lead: ${response.message}`, 'error');
          }
        } catch (error) {
          addNotification(`Error deleting lead: ${error.message}`, 'error');
        }
    }
  };
  
  const getDashboardStats = () => ({
    totalLeads: leads.length,
    hotLeads: leads.filter(l => l.quality === 'Hot').length,
    quotedLeads: leads.filter(l => l.disposition === 'Quoted').length,
    totalQuoteValue: leads.reduce((sum, lead) => sum + (parseFloat(String(lead.dabellaQuote).replace(/[$,]/g, '')) || 0), 0)
  });

  const handleMapLeadClick = (lead) => {
    setSelectedMapLead(lead);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4"/>
        <p className="text-gray-600">Loading your CRM...</p>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Bhotch CRM</h1>
            </div>
            <nav className="flex space-x-1 sm:space-x-2">
              <button onClick={() => setCurrentView('dashboard')} className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${currentView === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}>
                <Home className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button onClick={() => setCurrentView('leads')} className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${currentView === 'leads' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}>
                <ClipboardList className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Leads</span>
              </button>
              <button onClick={() => setCurrentView('map')} className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${currentView === 'map' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}>
                <Map className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Map</span>
              </button>
              <button onClick={() => setCurrentView('calendar')} className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${currentView === 'calendar' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}>
                <Calendar className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Calendar</span>
              </button>
              <button onClick={onLogout} className="p-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200">
                <XCircle className="w-5 h-5"/>
              </button>
            </nav>
          </div>
        </div>
      </header>
      
      <div className="fixed top-5 right-5 w-80 z-50">
        {notifications.map(n => (
          <div key={n.id} className={`p-3 rounded-md mb-2 shadow-lg animate-fade-in-right flex items-start ${ 
            n.type === 'success' ? 'bg-green-100 text-green-800' : 
            n.type === 'warning' ? 'bg-yellow-100 text-yellow-800' : 
            n.type === 'error' ? 'bg-red-100 text-red-800' : 
            'bg-blue-100 text-blue-800' 
          }`}>
            {n.type === 'success' && <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />}
            {n.type === 'warning' && <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />}
            {n.type === 'error' && <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />}
            {n.type === 'info' && <Clock className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />}
            <span className="text-sm">{n.message}</span>
          </div>
        ))}
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'dashboard' && (
          <>
            <ConnectionStatus />
            <DashboardView stats={getDashboardStats()} leads={leads} />
          </>
        )}
        {currentView === 'leads' && (
          <ProfessionalLeadsView 
            leads={leads} 
            onAddLead={() => setShowAddForm(true)} 
            onEditLead={setEditingLead} 
            onDeleteLead={handleDeleteLead} 
            onRefreshLeads={() => loadLeadsData(true)} 
          />
        )}
        {currentView === 'map' && (
          <MapView 
            leads={leads} 
            onLeadClick={handleMapLeadClick}
          />
        )}
        {currentView === 'calendar' && <CalendarView />}
      </main>

      {showAddForm && (
        <LeadFormModal 
          onSubmit={handleAddLead} 
          onCancel={() => setShowAddForm(false)} 
        />
      )}
      
      {editingLead && (
        <LeadFormModal 
          initialData={editingLead} 
          onSubmit={handleUpdateLead} 
          onCancel={() => setEditingLead(null)} 
          isEdit={true} 
        />
      )}

      {selectedMapLead && (
        <LeadDetailModal 
          lead={selectedMapLead} 
          onClose={() => setSelectedMapLead(null)} 
          onEdit={() => { 
            setEditingLead(selectedMapLead); 
            setSelectedMapLead(null); 
          }} 
          onDelete={() => { 
            handleDeleteLead(selectedMapLead.id); 
            setSelectedMapLead(null); 
          }}
        />
      )}
    </div>
  );
}

// --- Main App Component ---
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const storedAuth = sessionStorage.getItem('isAuthenticated');
    if (storedAuth) setIsAuthenticated(true);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };
  
  if (firebaseError) return <FirebaseErrorDisplay error={firebaseError} />;
  if (!isAuthenticated) return <LoginForm onLogin={() => setIsAuthenticated(true)} />;
  return <CrmApplication onLogout={handleLogout} />;
}