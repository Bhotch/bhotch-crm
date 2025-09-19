import React, { useState, useMemo, useEffect } from 'react';
import { Home, ClipboardList, Map, Calendar, Calculator, XCircle, DollarSign, Loader2, CheckCircle, AlertCircle, Clock, Shield, Activity, Database } from 'lucide-react';

// Import hooks
import { useLeads } from './hooks/useLeads';
import { useJobCounts } from './hooks/useJobCounts';
import { useNotifications } from './hooks/useNotifications';

// Import features and components
import LoginForm from './features/auth/LoginForm';
import DashboardView from './features/dashboard/DashboardView';
import LeadsView from './features/leads/LeadsView';
import JobCountView from './features/jobcount/JobCountView';
import MapView from './features/map/MapView';
import CalendarView from './features/calendar/CalendarView';
import LeadFormModal from './features/leads/LeadFormModal';
import LeadDetailModal from './features/leads/LeadDetailModal';
import JobCountFormModal from './features/jobcount/JobCountFormModal';
import JobCountDetailModal from './features/jobcount/JobCountDetailModal';
import ConnectionStatus from './components/ConnectionStatus';
import ConfigErrorDisplay from './components/ConfigErrorDisplay';

// Import Ultimate Enterprise Components
import ErrorBoundary from './components/ErrorBoundary';
import VentCalculationWidget from './components/VentCalculationWidget';
import BatchVentCalculation from './components/BatchVentCalculation';
import SystemMonitoringDashboard from './components/SystemMonitoringDashboard';
import AdvancedAnalyticsDashboard from './components/AdvancedAnalyticsDashboard';

// Import Ultimate Enterprise Systems
import logger from './utils/enterpriseLogger';
import enterpriseMonitoring from './utils/enterpriseMonitoring';
import backupRecoverySystem from './utils/backupRecoverySystem';
import securityManager from './utils/securityManager';
import notificationSystem from './utils/notificationSystem';

function CrmApplication({ onLogout }) {
  const { notifications, addNotification } = useNotifications();
  const { leads, loading: leadsLoading, refreshLeads, addLead, updateLead, deleteLead } = useLeads(addNotification);
  const { jobCounts, loading: jobCountsLoading, refreshJobCounts, addJobCount, updateJobCount, deleteJobCount } = useJobCounts(addNotification);

  const [currentView, setCurrentView] = useState('dashboard');
  const [systemHealth, setSystemHealth] = useState('healthy');
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Initialize Ultimate Enterprise Systems
  useEffect(() => {
    const initializeEnterpriseSystems = async () => {
      try {
        // Initialize security session
        const userId = sessionStorage.getItem('userId') || 'user_' + Date.now();
        sessionStorage.setItem('userId', userId);

        const sessionToken = securityManager.generateSessionToken(userId);
        sessionStorage.setItem('sessionToken', sessionToken);

        // Log application startup
        logger.business('Application Startup', {
          userId,
          timestamp: new Date().toISOString(),
          version: process.env.REACT_APP_VERSION || '1.0.0'
        });

        // Initialize monitoring
        enterpriseMonitoring.recordMetric('app.startup', 1, {
          component: 'CrmApplication',
          version: process.env.REACT_APP_VERSION || '1.0.0'
        });

        // Show notification for enterprise features
        await notificationSystem.success('Ultimate CRM System Initialized', {
          category: 'system',
          metadata: {
            features: ['Advanced Caching', 'Monitoring', 'Security', 'Backup Recovery'],
            version: '1.0.0'
          }
        });

        // Check system health
        const health = await enterpriseMonitoring.getSystemReport();
        setSystemHealth(health.systemHealth || 'healthy');

      } catch (error) {
        logger.error('Failed to initialize enterprise systems', { error: error.message });
        addNotification('System initialization warning: Some enterprise features may be limited', 'error');
      }
    };

    initializeEnterpriseSystems();

    // PWA install prompt handler
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setShowInstallPrompt(true);
      window.deferredPrompt = e;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [addNotification]);

  // Handle PWA installation
  const handleInstallPWA = async () => {
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      const { outcome } = await window.deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        logger.user('PWA Installation Accepted');
        addNotification('App installed successfully!', 'success');
      }

      window.deferredPrompt = null;
      setShowInstallPrompt(false);
    }
  };

  // Lead state management
  const [editingLead, setEditingLead] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDetailLead, setSelectedDetailLead] = useState(null);
  const [mapSearchAddress, setMapSearchAddress] = useState('');

  // Job Count state management
  const [editingJobCount, setEditingJobCount] = useState(null);
  const [showAddJobCountForm, setShowAddJobCountForm] = useState(false);
  const [selectedDetailJobCount, setSelectedDetailJobCount] = useState(null);

  const dashboardStats = useMemo(() => ({
    totalLeads: leads.length,
    hotLeads: leads.filter(l => l.quality === 'Hot').length,
    quotedLeads: leads.filter(l => l.disposition === 'Quoted').length,
    totalQuoteValue: leads.reduce((sum, lead) => sum + (parseFloat(String(lead.dabellaQuote).replace(/[$,]/g, '')) || 0), 0),
    totalJobCounts: jobCounts.length,
    totalSqFt: jobCounts.reduce((sum, job) => sum + (parseFloat(job.sqFt) || 0), 0)
  }), [leads, jobCounts]);

  // Lead handlers
  const handleAddSubmit = async (leadData) => {
    await addLead(leadData);
    setShowAddForm(false);
  };

  const handleUpdateSubmit = async (leadData) => {
    await updateLead(leadData);
    setEditingLead(null);
  };

  // Job Count handlers
  const handleAddJobCountSubmit = async (jobCountData) => {
    await addJobCount(jobCountData);
    setShowAddJobCountForm(false);
  };

  const handleUpdateJobCountSubmit = async (jobCountData) => {
    await updateJobCount(jobCountData);
    setEditingJobCount(null);
  };

  const handleNavigateToTab = (tab, address = '') => {
    setCurrentView(tab);
    if (tab === 'map' && address) {
      setMapSearchAddress(address);
    }
    setSelectedDetailLead(null);
    setSelectedDetailJobCount(null);
  };

  if (leadsLoading || jobCountsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Bhotch CRM</h1>
            </div>
            <nav className="flex space-x-1 sm:space-x-2">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                  currentView === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Home className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button
                onClick={() => setCurrentView('leads')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                  currentView === 'leads' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <ClipboardList className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Leads</span>
              </button>
              <button
                onClick={() => setCurrentView('jobcount')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                  currentView === 'jobcount' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Calculator className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Job Count</span>
              </button>
              <button
                onClick={() => setCurrentView('analytics')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                  currentView === 'analytics' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Activity className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Analytics</span>
              </button>
              <button
                onClick={() => setCurrentView('monitoring')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                  currentView === 'monitoring' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Shield className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">System</span>
              </button>
              <button
                onClick={() => setCurrentView('map')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                  currentView === 'map' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Map className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Map</span>
              </button>
              <button
                onClick={() => setCurrentView('calendar')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                  currentView === 'calendar' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Calendar</span>
              </button>

              {/* System Health Indicator */}
              <div className={`px-2 py-2 rounded-md flex items-center ${
                systemHealth === 'healthy' ? 'bg-green-100 text-green-700' :
                systemHealth === 'degraded' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-1 ${
                  systemHealth === 'healthy' ? 'bg-green-500' :
                  systemHealth === 'degraded' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></div>
                <span className="text-xs hidden sm:inline">
                  {systemHealth === 'healthy' ? 'Optimal' :
                   systemHealth === 'degraded' ? 'Degraded' : 'Critical'}
                </span>
              </div>

              {/* PWA Install Button */}
              {showInstallPrompt && (
                <button
                  onClick={handleInstallPWA}
                  className="px-3 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors flex items-center"
                >
                  <Database className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Install</span>
                </button>
              )}

              <button
                onClick={onLogout}
                className="p-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Notification Panel */}
      <div className="fixed top-20 right-5 w-80 z-50">
        {notifications.map(n => (
          <div
            key={n.id}
            className={`p-3 rounded-md mb-2 shadow-lg animate-fade-in-right flex items-start ${
              n.type === 'success' ? 'bg-green-100 text-green-800' :
              n.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
            }`}
          >
            {n.type === 'success' && <CheckCircle className="w-5 h-5 mr-2 mt-0.5 shrink-0" />}
            {n.type === 'error' && <AlertCircle className="w-5 h-5 mr-2 mt-0.5 shrink-0" />}
            {n.type === 'info' && <Clock className="w-5 h-5 mr-2 mt-0.5 shrink-0" />}
            <span className="text-sm">{n.message}</span>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'dashboard' && (
          <>
            <ConnectionStatus />
            <DashboardView stats={dashboardStats} leads={leads} />
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VentCalculationWidget />
              <BatchVentCalculation jobCounts={jobCounts} onJobCountUpdate={refreshJobCounts} />
            </div>
          </>
        )}
        {currentView === 'leads' && (
          <LeadsView
            leads={leads}
            onAddLead={() => setShowAddForm(true)}
            onEditLead={setEditingLead}
            onDeleteLead={deleteLead}
            onRefreshLeads={refreshLeads}
            onSelectLead={setSelectedDetailLead}
          />
        )}
        {currentView === 'jobcount' && (
          <JobCountView
            jobCounts={jobCounts}
            onAddJobCount={() => setShowAddJobCountForm(true)}
            onEditJobCount={setEditingJobCount}
            onDeleteJobCount={deleteJobCount}
            onRefreshJobCounts={refreshJobCounts}
            onSelectJobCount={setSelectedDetailJobCount}
          />
        )}
        {currentView === 'analytics' && (
          <AdvancedAnalyticsDashboard
            leads={leads}
            jobCounts={jobCounts}
            onNavigateToTab={handleNavigateToTab}
          />
        )}
        {currentView === 'monitoring' && (
          <SystemMonitoringDashboard />
        )}
        {currentView === 'map' && (
          <MapView
            leads={leads}
            onLeadClick={setSelectedDetailLead}
            searchAddress={mapSearchAddress}
            onSearchComplete={() => setMapSearchAddress('')}
          />
        )}
        {currentView === 'calendar' && <CalendarView />}
      </main>

      {/* Lead Modals */}
      {showAddForm && (
        <LeadFormModal
          onSubmit={handleAddSubmit}
          onCancel={() => setShowAddForm(false)}
        />
      )}
      {editingLead && (
        <LeadFormModal
          initialData={editingLead}
          onSubmit={handleUpdateSubmit}
          onCancel={() => setEditingLead(null)}
          isEdit={true}
        />
      )}
      {selectedDetailLead && (
        <LeadDetailModal
          lead={selectedDetailLead}
          onClose={() => setSelectedDetailLead(null)}
          onEdit={() => {
            setEditingLead(selectedDetailLead);
            setSelectedDetailLead(null);
          }}
          onDelete={() => {
            deleteLead(selectedDetailLead.id);
            setSelectedDetailLead(null);
          }}
          onNavigateToTab={handleNavigateToTab}
        />
      )}

      {/* Job Count Modals */}
      {showAddJobCountForm && (
        <JobCountFormModal
          onSubmit={handleAddJobCountSubmit}
          onCancel={() => setShowAddJobCountForm(false)}
        />
      )}
      {editingJobCount && (
        <JobCountFormModal
          initialData={editingJobCount}
          onSubmit={handleUpdateJobCountSubmit}
          onCancel={() => setEditingJobCount(null)}
          isEdit={true}
        />
      )}
      {selectedDetailJobCount && (
        <JobCountDetailModal
          jobCount={selectedDetailJobCount}
          onClose={() => setSelectedDetailJobCount(null)}
          onEdit={() => {
            setEditingJobCount(selectedDetailJobCount);
            setSelectedDetailJobCount(null);
          }}
          onDelete={() => {
            deleteJobCount(selectedDetailJobCount.id);
            setSelectedDetailJobCount(null);
          }}
          onJobCountUpdate={(updatedJobCount) => {
            setSelectedDetailJobCount(updatedJobCount);
            refreshJobCounts();
          }}
        />
      )}
    </div>
  );
}

// Main App Component with Ultimate Enterprise Features
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!sessionStorage.getItem('isAuthenticated'));

  // Enterprise system initialization
  useEffect(() => {
    // Initialize service worker for PWA
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .then(() => logger.info('Service Worker registered successfully'))
        .catch((error) => logger.error('Service Worker registration failed', { error: error.message }));
    }

    // Initialize enterprise monitoring
    enterpriseMonitoring.recordMetric('app.load', 1, {
      version: process.env.REACT_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });

    // Log system initialization
    logger.business('Ultimate CRM System Loaded', {
      version: process.env.REACT_APP_VERSION || '1.0.0',
      timestamp: new Date().toISOString(),
      features: [
        'Enterprise Security',
        'Advanced Caching',
        'Real-time Monitoring',
        'Backup & Recovery',
        'PWA Support',
        'Automated Deployment'
      ]
    });

    return () => {
      // Cleanup enterprise systems
      try {
        backupRecoverySystem.destroy();
        enterpriseMonitoring.destroy();
        logger.destroy();
      } catch (error) {
        console.warn('Cleanup error:', error);
      }
    };
  }, []);

  const configError = [
    process.env.REACT_APP_FIREBASE_API_KEY,
    process.env.REACT_APP_GAS_WEB_APP_URL,
    process.env.REACT_APP_GOOGLE_MAPS_API_KEY
  ].some(key => !key) ? "One or more critical environment variables (Firebase, GAS URL, Maps API) are not set." : null;

  if (configError) {
    return <ConfigErrorDisplay error={configError} />;
  }

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <LoginForm onLogin={() => setIsAuthenticated(true)} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <CrmApplication
        onLogout={() => {
          // Log logout event
          logger.user('User Logout', {
            timestamp: new Date().toISOString()
          });

          // Clear session data
          sessionStorage.removeItem('isAuthenticated');
          sessionStorage.removeItem('sessionToken');
          setIsAuthenticated(false);
        }}
      />
    </ErrorBoundary>
  );
}