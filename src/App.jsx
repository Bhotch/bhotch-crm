import React, { useState, useMemo } from 'react';
import { Home, ClipboardList, Map, Calendar, Calculator, XCircle, DollarSign, Loader2, CheckCircle, AlertCircle, Clock, MessageCircle, Eye, Target } from 'lucide-react';

// Import hooks
import { useLeads } from './hooks/useLeads';
import { useJobCounts } from './hooks/useJobCounts';
import { useNotifications } from './hooks/useNotifications';
import { useCommunications } from './hooks/useCommunications';

// Import features and components
import LoginForm from './features/auth/LoginForm';
import DashboardView from './features/dashboard/DashboardView';
import LeadsView from './features/leads/LeadsView';
import JobCountView from './features/jobcount/JobCountView';
import MapView from './features/map/MapView';
import CalendarView from './features/calendar/CalendarView';
import CommunicationsView from './features/communications/CommunicationsView';
import Visualization360 from './features/visualization360/Visualization360';
import CanvassingViewEnhanced from './features/canvassing/CanvassingViewEnhanced';
import LeadFormModal from './features/leads/LeadFormModal';
import LeadDetailModal from './features/leads/LeadDetailModal';
import JobCountFormModal from './features/jobcount/JobCountFormModal';
import JobCountDetailModal from './features/jobcount/JobCountDetailModal';
import ConnectionStatus from './components/ConnectionStatus';
import ConfigErrorDisplay from './components/ConfigErrorDisplay';
import ErrorBoundary from './components/ErrorBoundary';

function CrmApplication({ onLogout }) {
  const { notifications, addNotification } = useNotifications();
  const { leads, loading: leadsLoading, refreshLeads, addLead, updateLead, deleteLead } = useLeads(addNotification);
  const { jobCounts, loading: jobCountsLoading, refreshJobCounts, addJobCount, updateJobCount, deleteJobCount } = useJobCounts(addNotification);
  const { communications, addCommunication } = useCommunications(addNotification);

  const [currentView, setCurrentView] = useState('dashboard');

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
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center shrink-0">
              <DollarSign className="h-7 w-7 text-blue-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-900">Bhotch CRM</h1>
            </div>
            <nav className="flex items-center space-x-1 overflow-x-auto">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  currentView === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button
                onClick={() => setCurrentView('leads')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  currentView === 'leads' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span className="hidden sm:inline">Leads</span>
              </button>
              <button
                onClick={() => setCurrentView('jobcount')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  currentView === 'jobcount' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Calculator className="w-4 h-4" />
                <span className="hidden sm:inline">Job Count</span>
              </button>
              <button
                onClick={() => setCurrentView('map')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  currentView === 'map' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Map className="w-4 h-4" />
                <span className="hidden sm:inline">Map</span>
              </button>
              <button
                onClick={() => setCurrentView('calendar')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  currentView === 'calendar' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Calendar</span>
              </button>
              <button
                onClick={() => setCurrentView('communications')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  currentView === 'communications' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Comms</span>
              </button>
              <button
                onClick={() => setCurrentView('visualization')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  currentView === 'visualization' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">360° View</span>
              </button>
              <button
                onClick={() => setCurrentView('canvassing')}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  currentView === 'canvassing' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Canvassing</span>
              </button>

              <button
                onClick={onLogout}
                className="p-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors ml-1 shrink-0"
                title="Logout"
              >
                <XCircle className="w-4 h-4" />
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
            <DashboardView
              stats={dashboardStats}
              leads={leads}
              jobCounts={jobCounts}
              onNavigateToTab={handleNavigateToTab}
            />
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
            leads={leads}
            onAddJobCount={() => setShowAddJobCountForm(true)}
            onEditJobCount={setEditingJobCount}
            onDeleteJobCount={deleteJobCount}
            onRefreshJobCounts={refreshJobCounts}
            onSelectJobCount={setSelectedDetailJobCount}
          />
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
        {currentView === 'communications' && (
          <CommunicationsView
            leads={leads}
            jobCounts={jobCounts}
            communications={communications}
          />
        )}
        {currentView === 'visualization' && (
          <div style={{ height: 'calc(100vh - 120px)' }}>
            <Visualization360 />
          </div>
        )}
        {currentView === 'canvassing' && (
          <div style={{ height: 'calc(100vh - 120px)' }}>
            <CanvassingViewEnhanced leads={leads} />
          </div>
        )}
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
          onLogCommunication={addCommunication}
          onUpdateLead={updateLead}
        />
      )}

      {/* Job Count Modals */}
      {showAddJobCountForm && (
        <JobCountFormModal
          leads={leads}
          onSubmit={handleAddJobCountSubmit}
          onCancel={() => setShowAddJobCountForm(false)}
        />
      )}
      {editingJobCount && (
        <JobCountFormModal
          leads={leads}
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

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!sessionStorage.getItem('isAuthenticated'));

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
          sessionStorage.removeItem('isAuthenticated');
          setIsAuthenticated(false);
        }}
      />
    </ErrorBoundary>
  );
}