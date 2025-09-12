import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MapPin, Calendar, Plus, Edit2, Trash2, DollarSign, AlertCircle, CheckCircle, Home, RefreshCw, X, XCircle, Users, BarChart3, Activity, Loader2 } from 'lucide-react';
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

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const GOOGLE_SCRIPT_URL = process.env.REACT_APP_GOOGLE_SCRIPT_URL;

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
      catch { return { success: false, message: 'Invalid server response.' }; }
    } catch (error) {
      return { success: false, message: 'Network error. Could not connect to the server.' };
    }
  }
  fetchLeads() { return this.makeRequest('getLeads', {}); }
  addLead(lead) { return this.makeRequest('addLead', { lead }); }
  updateLead(lead) { return this.makeRequest('updateLead', { lead }); }
  deleteLead(leadId) { return this.makeRequest('deleteLead', { leadId }); }
}
const googleSheetsService = new GoogleSheetsService(GOOGLE_SCRIPT_URL);

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

// Placeholder for the full CRM application component
function CrmApplication({ onLogout }) {
  const [leads, setLeads] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  
  // NOTE: This is a placeholder for the real data fetching and state management
  useEffect(() => {
     const fetchLeads = async () => {
        const response = await googleSheetsService.fetchLeads();
        if (response.success) {
            setLeads(response.leads);
        } else {
            // Handle error
            console.error("Failed to fetch leads:", response.message);
        }
    };
    fetchLeads();
  }, []);

  return (
     <div>
      <header className="bg-white shadow-sm border-b sticky top-0 z-40 p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Bhotch CRM</h1>
        <nav className="flex items-center space-x-2">
            <button onClick={() => setCurrentView('dashboard')} className={`px-3 py-1 rounded ${currentView === 'dashboard' ? 'bg-blue-100 text-blue-700' : ''}`}>Dashboard</button>
            <button onClick={() => setCurrentView('leads')} className={`px-3 py-1 rounded ${currentView === 'leads' ? 'bg-blue-100 text-blue-700' : ''}`}>Leads</button>
            <button onClick={onLogout} className="p-2 bg-red-500 text-white rounded-lg">Logout</button>
        </nav>
      </header>

      <main className="p-6">
        {currentView === 'dashboard' && <div>Dashboard View: {leads.length} leads loaded.</div>}
        {currentView === 'leads' && (
            <div>
                <h2 className="text-xl font-bold mb-4">Leads</h2>
                <ul>
                    {leads.map(lead => <li key={lead.id}>{lead.customerName || 'No Name'} - {lead.address || 'No Address'}</li>)}
                </ul>
            </div>
        )}
      </main>
    </div>
  );
}


// --- Main App Component ---
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // On initial load, check if the user is already logged in via session storage
    const storedAuth = sessionStorage.getItem('isAuthenticated');
    if (storedAuth) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };
  
  if (firebaseError) {
    return <FirebaseErrorDisplay error={firebaseError} />;
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={() => setIsAuthenticated(true)} />;
  }

  return <CrmApplication onLogout={handleLogout} />;
}

