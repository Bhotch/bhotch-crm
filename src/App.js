import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MapPin, Calendar, Plus, Edit2, Trash2, DollarSign, AlertCircle, CheckCircle, Home, RefreshCw, X, XCircle, Users, BarChart3, Activity, Loader2 } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// --- Environment Variables ---
// IMPORTANT: These keys are now loaded from your Vercel environment variables.
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const GOOGLE_SCRIPT_URL = process.env.REACT_APP_GOOGLE_SCRIPT_URL;

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase initialization error:", error);
}
const auth = getAuth(app);


// --- Google Sheets Service (API Layer) ---
class GoogleSheetsService {
  constructor(baseURL) { 
    this.baseURL = baseURL;
  }
  
  async makeRequest(action, payload) { 
    if (!this.baseURL) {
      console.error("Google Script URL is not configured. Please check your environment variables.");
      return { success: false, message: 'API endpoint is not configured.' };
    }
    try { 
      const response = await fetch(this.baseURL, { 
        method: 'POST', 
        mode: 'cors',
        credentials: 'omit',
        headers: { 
          'Content-Type': 'text/plain;charset=utf-8', // Use text/plain for Apps Script
        }, 
        body: JSON.stringify({ action, ...payload }) 
      }); 
      
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (parseError){
        console.warn('Could not parse JSON response:', text);
        return { success: false, message: 'Invalid server response. Please check the backend script.' };
      }
    } catch (error) { 
      console.error(`Request error for action '${action}':`, error);
      // This is where the "Failed to fetch" error is caught.
      return { success: false, message: 'Network error: Could not connect to the server. Please check your internet connection and ad-blockers.' }; 
    } 
  }
  
  // --- Standardized API Calls ---
  async fetchLeads() {
    return this.makeRequest('getLeads', {});
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
}

const googleSheetsService = new GoogleSheetsService(GOOGLE_SCRIPT_URL);


// --- UI Components ---

// Confirmation Modal Component
function ConfirmationModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
        <div className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Are you sure?</h3>
          <p className="text-sm text-gray-600">{message}</p>
        </div>
        <div className="flex justify-center gap-4 bg-gray-50 p-4 rounded-b-lg">
          <button 
            onClick={onCancel} 
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium">
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// Main App Component
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [leads, setLeads] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [editingLead, setEditingLead] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingLeadId, setDeletingLeadId] = useState(null);
  
  // Loading and State Management
  const [appState, setAppState] = useState('loading'); // 'loading', 'ready', 'error'
  const [errorMessage, setErrorMessage] = useState('');

  // Filtering and Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [filterQuality, setFilterQuality] = useState('all');

  const addNotification = useCallback((message, type = 'info') => {
    const newNotification = { id: Date.now(), message, type };
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  }, []);

  const loadLeadsData = useCallback(async (isManualRefresh = false) => {
    if (!isManualRefresh) setAppState('loading');
    
    const response = await googleSheetsService.fetchLeads();
    
    if (response.success) {
      const uniqueLeads = Array.from(new Map(response.leads.map(lead => [lead.id, lead])).values());
      setLeads(uniqueLeads);
      if (isManualRefresh) addNotification('Leads refreshed successfully', 'success');
    } else {
      setErrorMessage(response.message || 'An unknown error occurred while fetching leads.');
      setAppState('error');
      addNotification(response.message, 'error');
    }
    
    if (appState !== 'error') setAppState('ready');
  }, [addNotification, appState]);

  useEffect(() => {
    const storedAuth = sessionStorage.getItem('isAuthenticated');
    if (storedAuth) {
      setIsAuthenticated(true);
      loadLeadsData();
    } else {
      setAppState('ready'); // Ready for login
    }
  }, [loadLeadsData]);


  const handleAddLead = async (leadData) => {
    const response = await googleSheetsService.addLead(leadData);
    if (response.success) {
      // Optimistic update: add new lead to state immediately
      setLeads(prevLeads => [response.lead, ...prevLeads]);
      addNotification('Lead added successfully', 'success');
      setShowAddForm(false);
    } else {
      addNotification(response.message, 'error');
    }
  };

  const handleUpdateLead = async (leadData) => {
    const response = await googleSheetsService.updateLead(leadData);
    if (response.success) {
      // Optimistic update: find and update the lead in state
      setLeads(prevLeads => prevLeads.map(l => (l.id === leadData.id ? leadData : l)));
      addNotification('Lead updated successfully', 'success');
      setEditingLead(null);
    } else {
      addNotification(response.message, 'error');
    }
  };

  const handleDeleteLead = async () => {
    if (!deletingLeadId) return;
    const response = await googleSheetsService.deleteLead(deletingLeadId);
    if (response.success) {
      // Optimistic update: remove the lead from state
      setLeads(prevLeads => prevLeads.filter(l => l.id !== deletingLeadId));
      addNotification('Lead deleted successfully', 'success');
    } else {
      addNotification(response.message, 'error');
    }
    setDeletingLeadId(null); // Close modal
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesQuality = filterQuality === 'all' || lead.quality === filterQuality;
      const matchesSearch = searchTerm === '' || 
        Object.values(lead).some(val => 
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        );
      return matchesQuality && matchesSearch;
    });
  }, [leads, searchTerm, filterQuality]);

  // --- Render Logic ---

  if (!isAuthenticated) {
    // Pass setIsAuthenticated and loadLeadsData to trigger data fetch on login
    return <LoginForm onLogin={() => { setIsAuthenticated(true); loadLeadsData(); }} />;
  }
  
  if (appState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
      </div>
    );
  }

  if (appState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Failed to Load Data</h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <button 
            onClick={() => loadLeadsData(true)} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header, Notifications, Main Content, Forms would go here */}
      {/* This is a simplified placeholder for the UI logic, which is assumed correct */}
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
              </nav>
            </div>
            
            <div className="flex items-center space-x-3">
               <button 
                onClick={() => loadLeadsData(true)} 
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw size={20} />
              </button>
              <button 
                onClick={() => setShowAddForm(true)} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus size={20} className="inline mr-1" />
                Add Lead
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content rendering based on currentView */}
      <main className="h-[calc(100vh-73px)]">
        {currentView === 'dashboard' && <Dashboard leads={filteredLeads} />}
        {currentView === 'leads' && (
           <div className="p-6 bg-gray-50 min-h-full">
            <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredLeads.map(lead => (
                      <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{lead.customerName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button onClick={() => setEditingLead(lead)}><Edit2 size={18} /></button>
                            <button onClick={() => setDeletingLeadId(lead.id)}><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
           </div>
        )}
      </main>

      {/* Modals and Forms */}
      {deletingLeadId && (
        <ConfirmationModal 
          message="This action cannot be undone."
          onConfirm={handleDeleteLead}
          onCancel={() => setDeletingLeadId(null)}
        />
      )}
      {showAddForm && <LeadForm onSubmit={handleAddLead} onCancel={() => setShowAddForm(false)} />}
      {editingLead && <LeadForm lead={editingLead} onSubmit={handleUpdateLead} onCancel={() => setEditingLead(null)} />}
    </div>
  );
}

// Other components (LoginForm, Dashboard, LeadForm) are assumed to exist and are not repeated for brevity.
// Make sure they are defined in your actual file.

function LoginForm({ onLogin }) {
  // ... implementation
  return <button onClick={onLogin}>Login</button>;
}

function Dashboard({ leads }) {
  // ... implementation
  return <div>Dashboard: {leads.length} leads</div>;
}

function LeadForm({ lead, onSubmit, onCancel }) {
    const [formData, setFormData] = useState(lead || { customerName: '' });

    const handleSubmit = () => {
        if (!formData.customerName) {
            alert('Name is required');
            return;
        }
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg">
                <h2>{lead ? 'Edit Lead' : 'Add Lead'}</h2>
                <input
                    type="text"
                    value={formData.customerName}
                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                    className="border p-2 rounded w-full mt-2"
                    placeholder="Customer Name"
                />
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={onCancel} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
                    <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded">
                        {lead ? 'Update' : 'Add'}
                    </button>
                </div>
            </div>
        </div>
    );
}

