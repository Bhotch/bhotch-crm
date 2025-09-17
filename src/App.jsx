import React, { useState, useMemo } from 'react';
import { Home, ClipboardList, Map, Calendar, Calculator, XCircle, DollarSign, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';

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

function CrmApplication({ onLogout }) {
  const { notifications, addNotification } = useNotifications();
  const { leads, loading, refreshLeads, addLead, updateLead, deleteLead } = useLeads(addNotification);
  const { jobCounts, loading: jobCountsLoading, refreshJobCounts, addJobCount, updateJobCount, deleteJobCount } = useJobCounts(addNotification);
  
  const [currentView, setCurrentView] = useState('dashboard');
  const [editingLead, setEditingLead] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDetailLead, setSelectedDetailLead] = useState(null);
  const [mapSearchAddress, setMapSearchAddress] = useState('');

  // Job Count state
  const [editingJobCount, setEditingJobCount] = useState(null);
  const [showAddJobCountForm, setShowAddJobCountForm] = useState(false);
  const [selectedDetailJobCount, setSelectedDetailJobCount] = useState(null);

  const dashboardStats = useMemo(() => ({
    totalLeads: leads.length,
    hotLeads: leads.filter(l => l.quality === 'Hot').length,
    quotedLeads: leads.filter(l => l.disposition === 'Quoted').length,
    totalQuoteValue: leads.reduce((sum, lead) => sum + (parseFloat(String(lead.dabellaQuote).replace(/[$,]/g, '')) || 0), 0)
  }), [leads]);

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
  };

  if (loading || jobCountsLoading) return (<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-blue-600"/></div>);

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
                    <button onClick={() => setCurrentView('dashboard')} className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${currentView === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}><Home className="w-4 h-4 mr-1" /><span className="hidden sm:inline">Dashboard</span></button>
                    <button onClick={() => setCurrentView('leads')} className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${currentView === 'leads' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}><ClipboardList className="w-4 h-4 mr-1" /><span className="hidden sm:inline">Leads</span></button>
                    <button onClick={() => setCurrentView('jobcount')} className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${currentView === 'jobcount' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}><Calculator className="w-4 h-4 mr-1" /><span className="hidden sm:inline">Job Count</span></button>
                    <button onClick={() => setCurrentView('map')} className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${currentView === 'map' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}><Map className="w-4 h-4 mr-1" /><span className="hidden sm:inline">Map</span></button>
                    <button onClick={() => setCurrentView('calendar')} className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${currentView === 'calendar' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}><Calendar className="w-4 h-4 mr-1" /><span className="hidden sm:inline">Calendar</span></button>
                    <button onClick={onLogout} className="p-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"><XCircle className="w-5 h-5"/></button>
                </nav>
            </div>
        </div>
      </header>

      {/* Notification Panel */}
      <div className="fixed top-20 right-5 w-80 z-50">
        {notifications.map(n => (
          <div key={n.id} className={`p-3 rounded-md mb-2 shadow-lg animate-fade-in-right flex items-start ${n.type==='success'?'bg-green-100 text-green-800':n.type==='error'?'bg-red-100 text-red-800':'bg-blue-100 text-blue-800'}`}>
            {n.type==='success' && <CheckCircle className="w-5 h-5 mr-2 mt-0.5 shrink-0"/>}
            {n.type==='error' && <AlertCircle className="w-5 h-5 mr-2 mt-0.5 shrink-0"/>}
            {n.type==='info' && <Clock className="w-5 h-5 mr-2 mt-0.5 shrink-0"/>}
            <span className="text-sm">{n.message}</span>
          </div>
        ))}
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'dashboard' && <><ConnectionStatus /><DashboardView stats={dashboardStats} leads={leads} /></>}
        {currentView === 'leads' && <LeadsView leads={leads} onAddLead={()=>setShowAddForm(true)} onEditLead={setEditingLead} onDeleteLead={deleteLead} onRefreshLeads={refreshLeads} onSelectLead={setSelectedDetailLead} />}
        {currentView === 'jobcount' && <JobCountView jobCounts={jobCounts} onAddJobCount={()=>setShowAddJobCountForm(true)} onEditJobCount={setEditingJobCount} onDeleteJobCount={deleteJobCount} onRefreshJobCounts={refreshJobCounts} onSelectJobCount={setSelectedDetailJobCount} />}
        {currentView === 'map' && <MapView leads={leads} onLeadClick={setSelectedDetailLead} searchAddress={mapSearchAddress} onSearchComplete={() => setMapSearchAddress('')} />}
        {currentView === 'calendar' && <CalendarView />}
      </main>

      {/* Lead Modals */}
      {showAddForm && <LeadFormModal onSubmit={handleAddSubmit} onCancel={()=>setShowAddForm(false)}/>}
      {editingLead && <LeadFormModal initialData={editingLead} onSubmit={handleUpdateSubmit} onCancel={()=>setEditingLead(null)} isEdit={true}/>}
      {selectedDetailLead && <LeadDetailModal lead={selectedDetailLead} onClose={()=>setSelectedDetailLead(null)} onEdit={()=>{setEditingLead(selectedDetailLead);setSelectedDetailLead(null);}} onDelete={()=>{deleteLead(selectedDetailLead.id);setSelectedDetailLead(null);}} onNavigateToTab={handleNavigateToTab} />}

      {/* Job Count Modals */}
      {showAddJobCountForm && <JobCountFormModal onSubmit={handleAddJobCountSubmit} onCancel={()=>setShowAddJobCountForm(false)}/>}
      {editingJobCount && <JobCountFormModal initialData={editingJobCount} onSubmit={handleUpdateJobCountSubmit} onCancel={()=>setEditingJobCount(null)} isEdit={true}/>}
      {selectedDetailJobCount && <JobCountDetailModal jobCount={selectedDetailJobCount} onClose={()=>setSelectedDetailJobCount(null)} onEdit={()=>{setEditingJobCount(selectedDetailJobCount);setSelectedDetailJobCount(null);}} onDelete={()=>{deleteJobCount(selectedDetailJobCount.id);setSelectedDetailJobCount(null);}} />}
    </div>
  );
}

// --- Main App Component ---
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
    return <LoginForm onLogin={() => setIsAuthenticated(true)} />;
  }

  return <CrmApplication onLogout={() => { sessionStorage.removeItem('isAuthenticated'); setIsAuthenticated(false); }} />;
}