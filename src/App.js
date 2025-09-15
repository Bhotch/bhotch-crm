import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MapPin, Calendar, Plus, Edit2, Trash2, DollarSign, AlertCircle, CheckCircle, Home, RefreshCw, X, XCircle, Users, BarChart3, Activity, Loader2, ClipboardList, Clock, Phone, Mail, User, Tag, Briefcase, Search, Eye, ShieldCheck, Map } from 'lucide-react';
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
  if (!firebaseConfig.apiKey) {
    throw new Error("Firebase config is missing. Check Vercel environment variables.");
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
    if (!this.baseURL) return { success: false, message: 'API endpoint is not configured.' };
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST', mode: 'cors', credentials: 'omit',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, ...payload })
      });
      const text = await response.text();
      try { return JSON.parse(text); }
      catch { return { success: false, message: 'Invalid server response. Check Apps Script logs.', rawResponse: text }; }
    } catch (error) {
      return { success: false, message: 'Network error. Could not connect to the server.' };
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

// --- Google Maps Loader ---
const loadGoogleMaps = () => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) return resolve(window.google);
    if (document.getElementById('google-maps-script')) return; // Avoid adding script twice

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry,places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Failed to load Google Maps script.'));
    document.head.appendChild(script);
  });
};

// --- UI Components ---
const Loader = ({ text }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="text-center">
      <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4"/>
      <p className="text-gray-600">{text}</p>
    </div>
  </div>
);

function FirebaseErrorDisplay({ error }) { /* ... same as before ... */ }
function LoginForm({ onLogin }) { /* ... same as before ... */ }
const StatCard = ({ title, value, icon, color }) => { /* ... same as before ... */ };
const DetailItem = ({ icon, label, value }) => { /* ... same as before ... */ };
const FormSection = ({ title, children }) => { /* ... same as before ... */ };
const FormField = ({ label, children, fullWidth = false }) => { /* ... same as before ... */ };
const TextInput = (props) => { /* ... same as before ... */ };
const SelectInput = ({ children, ...props }) => { /* ... same as before ... */ };
const TextareaInput = (props) => { /* ... same as before ... */ };

// --- Main View Components ---
function DashboardView({ stats, leads }) { /* ... same as before ... */ }
function CalendarView() { /* ... same as before ... */ }

function GoogleMapComponent({ leads, onLeadClick }) {
  const mapRef = useRef(null);
  const infoWindowRef = useRef(null);
  const markersRef = useRef([]);
  const [map, setMap] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadGoogleMaps()
      .then(google => {
        if (!mapRef.current) return;
        const newMap = new google.maps.Map(mapRef.current, { center: { lat: 39.7392, lng: -104.9903 }, zoom: 10 });
        infoWindowRef.current = new google.maps.InfoWindow();
        setMap(newMap);
      })
      .catch(err => setError(err.message));
  }, []);

  useEffect(() => {
    if (!map || !window.google) return;
    
    // Clear previous markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    const leadsWithCoords = leads.filter(l => l.latitude && l.longitude && !isNaN(parseFloat(l.latitude)) && !isNaN(parseFloat(l.longitude)));
    
    leadsWithCoords.forEach(lead => {
      const position = { lat: parseFloat(lead.latitude), lng: parseFloat(lead.longitude) };
      const marker = new window.google.maps.Marker({ position, map, title: lead.customerName });
      
      marker.addListener('click', () => {
        onLeadClick(lead); // Use the passed-in function to open the modal
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    if (leadsWithCoords.length > 0) map.fitBounds(bounds);

  }, [map, leads, onLeadClick]);

  if (error) return <div className="h-96 bg-red-50 rounded-lg flex items-center justify-center p-4 text-center"><AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" /><p className="text-red-600 font-medium">Failed to load map: {error}</p></div>;
  
  return <div ref={mapRef} className="w-full h-96 rounded-lg border" />;
}

function MapView({ leads, onLeadClick }) { /* ... same as before ... */ }
function ProfessionalLeadsView({ leads, onAddLead, onEditLead, onDeleteLead, onRefreshLeads }) { /* ... same as before ... */ }
function LeadDetailModal({ lead, onClose, onEdit, onDelete }) { /* ... same as before ... */ }
function LeadFormModal({ initialData = { customerName: '', address: '', phoneNumber: '', email: '', dabellaQuote: '', quality: 'Cold', notes: '', disposition: 'New', leadSource: 'Door Knock' }, onSubmit, onCancel, isEdit = false }) { /* ... same as before ... */ }
function ConnectionStatus() { /* ... same as before ... */ }

// --- Full CRM Application ---
function CrmApplication({ onLogout }) {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [editingLead, setEditingLead] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [detailViewLead, setDetailViewLead] = useState(null);

  const addNotification = useCallback((message, type = 'info') => {
    const newNotification = { id: Date.now(), message, type };
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== newNotification.id)), 5000);
  }, []);

  const loadLeadsData = useCallback(async (isManualRefresh = false) => {
    if (!isManualRefresh) setLoading(true);
    const response = await googleSheetsService.fetchLeads();
    if (response.success) {
      const processed = (response.leads || []).map(l => ({ ...l, customerName: l.customerName || `${l.firstName || ''} ${l.lastName || ''}`.trim() || 'Unknown' }));
      setLeads(processed);
      if (isManualRefresh) addNotification('Leads refreshed.', 'success');
    } else {
      addNotification(response.message, 'error');
    }
    if (!isManualRefresh) setLoading(false);
  }, [addNotification]);

  useEffect(() => { loadLeadsData(); }, [loadLeadsData]);

  const handleAddLead = async (leadData) => {
    const response = await googleSheetsService.addLead(leadData);
    if (response.success && response.lead) {
      setLeads(prev => [response.lead, ...prev]);
      addNotification(`Lead added: ${leadData.customerName}`, 'success');
      setShowAddForm(false);
    } else {
      addNotification(response.message, 'error');
    }
  };

  const handleUpdateLead = async (updatedLead) => {
    const response = await googleSheetsService.updateLead(updatedLead);
    if (response.success && response.lead) {
      setLeads(prev => prev.map(l => (l.id === response.lead.id ? response.lead : l)));
      addNotification(`Lead updated: ${updatedLead.customerName}`, 'success');
      setEditingLead(null);
    } else {
      addNotification(response.message, 'error');
    }
  };

  const handleDeleteLead = async (leadId) => {
    const leadToDelete = leads.find(l => l.id === leadId);
    if (window.confirm(`Delete ${leadToDelete?.customerName}?`)) {
      const response = await googleSheetsService.deleteLead(leadId);
      if (response.success) {
        setLeads(prev => prev.filter(l => l.id !== leadId));
        addNotification('Lead deleted.', 'warning');
      } else {
        addNotification(response.message, 'error');
      }
    }
  };

  const stats = useMemo(() => ({
    totalLeads: leads.length,
    hotLeads: leads.filter(l => l.quality === 'Hot').length,
    quotedLeads: leads.filter(l => l.disposition === 'Quoted').length,
    totalQuoteValue: leads.reduce((sum, l) => sum + (parseFloat(String(l.dabellaQuote).replace(/[$,]/g, '')) || 0), 0),
  }), [leads]);

  if (loading) return <Loader text="Loading CRM..." />;

  return (
    <div className="min-h-screen bg-gray-50">
      <header> {/* ... same header JSX ... */} </header>
      <div className="fixed top-20 right-5 w-80 z-50 space-y-2">{notifications.map(n => <Notification key={n.id} {...n} />)}</div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'dashboard' && <><ConnectionStatus /><DashboardView stats={stats} leads={leads} /></>}
        {currentView === 'leads' && <ProfessionalLeadsView leads={leads} onAddLead={() => setShowAddForm(true)} onEditLead={setEditingLead} onDeleteLead={handleDeleteLead} onRefreshLeads={() => loadLeadsData(true)} />}
        {currentView === 'map' && <MapView leads={leads} onLeadClick={setDetailViewLead} />}
        {currentView === 'calendar' && <CalendarView />}
      </main>

      {showAddForm && <LeadFormModal onSubmit={handleAddLead} onCancel={() => setShowAddForm(false)} />}
      {editingLead && <LeadFormModal initialData={editingLead} onSubmit={handleUpdateLead} onCancel={() => setEditingLead(null)} isEdit={true} />}
      {detailViewLead && <LeadDetailModal lead={detailViewLead} onClose={() => setDetailViewLead(null)} onEdit={() => { setEditingLead(detailViewLead); setDetailViewLead(null); }} onDelete={() => { handleDeleteLead(detailViewLead.id); setDetailViewLead(null); }} />}
    </div>
  );
}

const Notification = ({ message, type }) => { /* ... same as before ... */ };

// --- App Entry Point ---
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  
  useEffect(() => {
    const storedAuth = sessionStorage.getItem('isAuthenticated');
    if (storedAuth) setIsAuthenticated(true);
    setAuthChecked(true);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };
  
  if (firebaseError) return <FirebaseErrorDisplay error={firebaseError} />;
  if (!authChecked) return <Loader text="Initializing..." />;
  if (!isAuthenticated) return <LoginForm onLogin={() => setIsAuthenticated(true)} />;
  
  return <CrmApplication onLogout={handleLogout} />;
}

