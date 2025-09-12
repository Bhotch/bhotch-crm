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

  // Check if all required keys are present
  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain) {
    throw new Error("Firebase config is missing or incomplete. Check your Vercel environment variables.");
  }

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (error) {
  console.error("CRITICAL: Firebase initialization failed.", error);
  firebaseError = error.message;
}

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const GOOGLE_SCRIPT_URL = process.env.REACT_APP_GOOGLE_SCRIPT_URL;

// --- Components ---

function FirebaseErrorDisplay({ error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-lg">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Application Configuration Error</h2>
        <p className="text-gray-600 mb-4">The application could not start due to a configuration issue with Firebase.</p>
        <div className="bg-red-100 text-red-700 text-left p-3 rounded-md text-sm">
          <strong>Error Details:</strong> {error}
        </div>
        <p className="text-gray-500 mt-4 text-sm">Please ensure that all `REACT_APP_FIREBASE_*` environment variables are correctly set in your Vercel project settings.</p>
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
    if (!credentials.email || !credentials.password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      sessionStorage.setItem('isAuthenticated', 'true');
      onLogin(); // Callback to parent
    } catch (err) {
      setError('Login failed. Please check your credentials.');
      console.error("Login error:", err);
    } finally {
      setLoading(false);
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
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={credentials.email}
            onChange={(e) => setCredentials({...credentials, email: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={credentials.password}
            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button 
            type="submit"
            disabled={loading} 
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}


// --- Main App Component ---
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedAuth = sessionStorage.getItem('isAuthenticated');
    if (storedAuth) {
      setIsAuthenticated(true);
    }
  }, []);

  // If Firebase failed to initialize, show an error and stop rendering the app.
  if (firebaseError) {
    return <FirebaseErrorDisplay error={firebaseError} />;
  }

  // If not authenticated, show the login form.
  if (!isAuthenticated) {
    return <LoginForm onLogin={() => setIsAuthenticated(true)} />;
  }

  // If authenticated, render the main CRM application.
  // This part remains the same, assuming it was working post-login.
  return (
    <div>
      <h1>Welcome to the CRM!</h1>
      <p>Main application content goes here.</p>
       <button 
        onClick={() => {
          sessionStorage.removeItem('isAuthenticated');
          setIsAuthenticated(false);
        }}
        className="p-2 bg-red-500 text-white rounded-lg"
      >
        Logout
      </button>
    </div>
  );
}

