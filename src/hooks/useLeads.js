import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Calendar, Filter, Plus, Edit2, Trash2, Save, Navigation, DollarSign, ClipboardList, AlertCircle, CheckCircle, Clock, Home } from 'lucide-react';

// --- Service Class for Google Sheets ---
// This is integrated directly into the App file to resolve the module error.
class GoogleSheetsService {
  constructor() {
    // IMPORTANT: Replace the placeholder URL below with your actual Google Apps Script Web App URL.
    // The 'process.env' variable is not available in this environment, so you must paste the URL directly.
    this.baseURL = 'https://script.google.com/macros/s/AKfycbw8r0tVUeFptoP0hdEQONuP8RR5NdYxBjPZwiXPZCLJLwduWAm28K23aVjqwzr4joejtA/exec';

    if (!this.baseURL || this.baseURL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
      console.warn('DEMO MODE: Google Sheets integration is disabled. To save data, replace the placeholder URL in the src/App.jsx file.');
    } else {
      console.log('Google Sheets Service initialized.');
    }
  }

  async makeRequest(data) {
    if (!this.baseURL || this.baseURL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
        console.warn("DEMO MODE: Request not sent. Configure your Google Apps Script URL to save data.");
        return { success: true, message: "Demo mode, data not sent." };
    }
    try {
      // Use 'no-cors' mode is critical for sending data to Google Apps Script from a browser
      await fetch(this.baseURL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      return { success: true, message: 'Data sent to Google Sheets' };
    } catch (error) {
      console.error('Error communicating with Google Sheets:', error);
      throw error;
    }
  }

  addLead(lead) {
    console.log('Service: Adding lead:', lead.customerName);
    return this.makeRequest({
      action: 'addLead',
      lead: lead
    });
  }

  updateLead(lead) {
    console.log('Service: Updating lead:', lead.customerName);
    return this.makeRequest({
      action: 'updateLead',
      lead: lead
    });
  }

  deleteLead(leadId) {
    console.log('Service: Deleting lead:', leadId);
    return this.makeRequest({
      action: 'deleteLead',
      leadId: leadId
    });
  }
}

// Create an instance of the service to be used by the app
const googleSheetsService = new GoogleSheetsService();

// --- Main CRM Application for Roofing Sales ---
function App() {
  // State management for the entire application
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedLead, setSelectedLead] = useState(null);
  const [filterCriteria, setFilterCriteria] = useState({
    disposition: 'all',
    leadSource: 'all',
    quality: 'all'
  });
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Load initial sample data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = () => {
    // In a real app, you can't read from Google Sheets with 'no-cors'.
    // So, we'll start with sample data to ensure the UI is functional.
    setTimeout(() => {
      const sampleLeads = [
        {
          id: '1',
          customerName: 'John Smith (Sample)',
          address: '123 Oak Street, Denver, CO 80201',
          phoneNumber: '(303) 555-0123',
          dabellaQuote: '$12,500',
          quality: 'Hot',
          notes: 'Storm damage on north side, insurance claim approved',
          disposition: 'Quoted',
          leadSource: 'Door Knock',
          email: 'john.smith@email.com',
          lastContact: '2024-01-15',
          appointmentDate: '2024-01-20',
          inspectionStatus: 'Completed',
          roofAge: '15 years',
          roofType: 'Asphalt Shingle'
        },
        {
          id: '2',
          customerName: 'Sarah Johnson (Sample)',
          address: '456 Pine Avenue, Aurora, CO 80012',
          phoneNumber: '(720) 555-0456',
          dabellaQuote: '$8,900',
          quality: 'Warm',
          notes: 'Interested in full replacement, comparing quotes',
          disposition: 'Follow Up',
          leadSource: 'Referral',
          email: 'sarah.j@email.com',
          lastContact: '2024-01-14',
          appointmentDate: '2024-01-18',
          inspectionStatus: 'Scheduled',
          roofAge: '20 years',
          roofType: 'Tile'
        },
      ];

      setLeads(sampleLeads);
      
      setAppointments([
        { id: '1', leadId: '1', date: '2024-01-20', time: '10:00 AM', type: 'Final Inspection' },
        { id: '2', leadId: '2', date: '2024-01-18', time: '2:00 PM', type: 'Initial Assessment' }
      ]);

      setNotifications([
        { id: '1', message: 'Follow up with Sarah Johnson today', type: 'reminder' },
        { id: '2', message: 'John Smith inspection completed', type: 'success' }
      ]);

      setLoading(false);
    }, 1000);
  };

  // Lead management functions (NOW CONNECTED TO GOOGLE SHEETS)
  const addLead = async (leadData) => {
    try {
      const newLead = {
        ...leadData,
        id: 'LOCAL_' + Date.now().toString(), // Use a temporary local ID for the UI
        lastContact: new Date().toISOString().split('T')[0]
      };
      setLeads(prev => [...prev, newLead]);
      setNotifications(prev => [...prev, {
        id: Date.now().toString(),
        message: `New lead added: ${leadData.customerName}`,
        type: 'success'
      }]);
      
      // Asynchronously send to Google Sheets using the service
      await googleSheetsService.addLead(leadData);
      console.log("Lead successfully sent to Google Sheets.");

    } catch (error) {
      console.error("Failed to add lead to Google Sheets:", error);
      setNotifications(prev => [...prev, {
        id: Date.now().toString(),
        message: `Error saving lead: ${leadData.customerName}`,
        type: 'warning'
      }]);
    }
  };

  const updateLead = async (updatedLead) => {
    try {
      setLeads(leads.map(lead =>
        lead.id === updatedLead.id ? updatedLead : lead
      ));
      setNotifications(prev => [...prev, {
        id: Date.now().toString(),
        message: `Lead updated: ${updatedLead.customerName}`,
        type: 'info'
      }]);

      // Asynchronously send update to Google Sheets
      await googleSheetsService.updateLead(updatedLead);
      console.log("Lead update successfully sent to Google Sheets.");

    } catch (error) {
      console.error("Failed to update lead in Google Sheets:", error);
       setNotifications(prev => [...prev, {
        id: Date.now().toString(),
        message: `Error updating lead: ${updatedLead.customerName}`,
        type: 'warning'
      }]);
    }
  };

  const deleteLead = async (leadId) => {
    try {
      const leadToDelete = leads.find(l => l.id === leadId);
      setLeads(leads.filter(l => l.id !== leadId));
      setNotifications(prev => [...prev, {
        id: Date.now().toString(),
        message: `Lead deleted: ${leadToDelete.customerName}`,
        type: 'warning'
      }]);

      // Asynchronously send delete request to Google Sheets
      await googleSheetsService.deleteLead(leadId);
      console.log("Lead delete request successfully sent to Google Sheets.");

    } catch (error) {
      console.error("Failed to delete lead from Google Sheets:", error);
       setNotifications(prev => [...prev, {
        id: Date.now().toString(),
        message: `Error deleting lead.`,
        type: 'warning'
      }]);
    }
  };

  // Filter leads based on criteria
  const getFilteredLeads = () => {
    return leads.filter(lead => {
      if (filterCriteria.disposition !== 'all' && lead.disposition !== filterCriteria.disposition) return false;
      if (filterCriteria.leadSource !== 'all' && lead.leadSource !== filterCriteria.leadSource) return false;
      if (filterCriteria.quality !== 'all' && lead.quality !== filterCriteria.quality) return false;
      return true;
    });
  };

  // Calculate dashboard statistics
  const getDashboardStats = () => {
    const totalLeads = leads.length;
    const hotLeads = leads.filter(l => l.quality === 'Hot').length;
    const quotedLeads = leads.filter(l => l.disposition === 'Quoted').length;
    const totalQuoteValue = leads.reduce((sum, lead) => {
      const value = lead.dabellaQuote ? String(lead.dabellaQuote).replace(/[$,]/g, '') : '0';
      return sum + (isNaN(parseFloat(value)) ? 0 : parseFloat(value));
    }, 0);

    return { totalLeads, hotLeads, quotedLeads, totalQuoteValue };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading your CRM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Home className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-800">Roofing CRM Pro</h1>
              <span className="text-sm text-gray-500 ml-2">Door-to-Door Sales Management</span>
            </div>
            <nav className="flex items-center space-x-2">
              <NavButton
                icon={<Home className="h-4 w-4" />}
                label="Dashboard"
                isActive={currentView === 'dashboard'}
                onClick={() => setCurrentView('dashboard')}
              />
              <NavButton
                icon={<ClipboardList className="h-4 w-4" />}
                label="Leads"
                isActive={currentView === 'leads'}
                onClick={() => setCurrentView('leads')}
              />
              <NavButton
                icon={<Calendar className="h-4 w-4" />}
                label="Schedule"
                isActive={currentView === 'schedule'}
                onClick={() => setCurrentView('schedule')}
              />
              <NavButton
                icon={<Navigation className="h-4 w-4" />}
                label="Routes"
                isActive={currentView === 'routes'}
                onClick={() => setCurrentView('routes')}
              />
              <button
                onClick={() => {
                  setSelectedLead(null);
                  setCurrentView('form');
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center space-x-2 transition duration-200"
              >
                <Plus className="h-4 w-4" />
                <span>New Lead</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Notification Bar */}
      {notifications.length > 0 && (
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4 overflow-x-auto">
              {notifications.slice(-3).map(notif => (
                <div key={notif.id} className="flex items-center space-x-2 text-sm">
                  {notif.type === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {notif.type === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                  {notif.type === 'info' && <AlertCircle className="h-4 w-4 text-blue-500" />}
                  {notif.type === 'reminder' && <Clock className="h-4 w-4 text-purple-500" />}
                  <span className="text-gray-600">{notif.message}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setNotifications([])}
              className="text-gray-400 hover:text-gray-600 text-xs"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && <Dashboard stats={getDashboardStats()} leads={leads} appointments={appointments} />}
        {currentView === 'leads' && (
          <LeadList
            leads={getFilteredLeads()}
            onEditLead={(lead) => {
              setSelectedLead(lead);
              setCurrentView('form');
            }}
            onDeleteLead={deleteLead}
            filterCriteria={filterCriteria}
            onFilterChange={setFilterCriteria}
          />
        )}
        {currentView === 'form' && (
          <LeadForm
            lead={selectedLead}
            onSave={(leadData) => {
              if (selectedLead) {
                updateLead({ ...selectedLead, ...leadData });
              } else {
                addLead(leadData);
              }
              setCurrentView('leads');
              setSelectedLead(null);
            }}
            onCancel={() => {
              setCurrentView('leads');
              setSelectedLead(null);
            }}
          />
        )}
        {currentView === 'schedule' && <ScheduleView appointments={appointments} leads={leads} />}
        {currentView === 'routes' && <RouteMapView leads={leads} />}
      </main>
    </div>
  );
}

// Dashboard Component - Shows key metrics and recent activity
const Dashboard = ({ stats, leads, appointments }) => {
  const todaysAppointments = appointments.filter(apt =>
    apt.date === new Date().toISOString().split('T')[0]
  );

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Dashboard Overview</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Leads"
          value={stats.totalLeads}
          icon={<ClipboardList className="h-6 w-6" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Hot Leads"
          value={stats.hotLeads}
          icon={<AlertCircle className="h-6 w-6" />}
          color="bg-red-500"
        />
        <StatCard
          title="Quoted"
          value={stats.quotedLeads}
          icon={<DollarSign className="h-6 w-6" />}
          color="bg-green-500"
        />
        <StatCard
          title="Pipeline Value"
          value={`$${stats.totalQuoteValue.toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
          color="bg-purple-500"
        />
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Today's Appointments</h3>
        {todaysAppointments.length > 0 ? (
          <div className="space-y-3">
            {todaysAppointments.map(apt => {
              const lead = leads.find(l => l.id === apt.leadId);
              return (
                <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-indigo-500" />
                    <div>
                      <p className="font-medium">{lead?.customerName}</p>
                      <p className="text-sm text-gray-600">{apt.time} - {apt.type}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{lead?.address}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500">No appointments scheduled for today</p>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Hot Leads</h3>
        <div className="space-y-3">
          {leads.filter(l => l.quality === 'Hot').slice(0, 5).map(lead => (
            <div key={lead.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="font-medium">{lead.customerName}</p>
                  <p className="text-sm text-gray-600">{lead.leadSource} - {lead.disposition}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">{lead.dabellaQuote}</p>
                <p className="text-sm text-gray-500">{lead.phoneNumber}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Lead List Component with filtering
const LeadList = ({ leads, onEditLead, onDeleteLead, filterCriteria, onFilterChange }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Lead Management</h2>
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <select
            name="dispositionFilter"
            id="dispositionFilter"
            value={filterCriteria.disposition}
            onChange={(e) => onFilterChange({ ...filterCriteria, disposition: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Dispositions</option>
            <option value="Initial Contact">Initial Contact</option>
            <option value="Follow Up">Follow Up</option>
            <option value="Quoted">Quoted</option>
            <option value="Closed Won">Closed Won</option>
            <option value="Closed Lost">Closed Lost</option>
          </select>
          <select
            name="leadSourceFilter"
            id="leadSourceFilter"
            value={filterCriteria.leadSource}
            onChange={(e) => onFilterChange({ ...filterCriteria, leadSource: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Sources</option>
            <option value="Door Knock">Door Knock</option>
            <option value="Referral">Referral</option>
            <option value="Website">Website</option>
            <option value="Social Media">Social Media</option>
          </select>
          <select
            name="qualityFilter"
            id="qualityFilter"
            value={filterCriteria.quality}
            onChange={(e) => onFilterChange({ ...filterCriteria, quality: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Quality</option>
            <option value="Hot">Hot</option>
            <option value="Warm">Warm</option>
            <option value="Cold">Cold</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quote</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{lead.customerName}</div>
                    <div className="text-sm text-gray-500">{lead.address}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{lead.phoneNumber}</div>
                  <div className="text-sm text-gray-500">{lead.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-green-600">{lead.dabellaQuote}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <QualityBadge quality={lead.quality} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {lead.disposition}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onEditLead(lead)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                    aria-label={`Edit ${lead.customerName}`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDeleteLead(lead.id)}
                    className="text-red-600 hover:text-red-900"
                    aria-label={`Delete ${lead.customerName}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Lead Form Component for adding/editing leads
const LeadForm = ({ lead, onSave, onCancel }) => {
  const [formData, setFormData] = useState(lead || {
    customerName: '',
    address: '',
    phoneNumber: '',
    email: '',
    dabellaQuote: '',
    quality: 'Warm',
    notes: '',
    disposition: 'Initial Contact',
    leadSource: 'Door Knock',
    roofAge: '',
    roofType: 'Asphalt Shingle',
    inspectionStatus: 'Not Scheduled',
    appointmentDate: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {lead ? 'Edit Lead' : 'Add New Lead'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  name="customerName"
                  id="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <input
                  type="text"
                  name="address"
                  id="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Street address, City, State, ZIP"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="leadSource" className="block text-sm font-medium text-gray-700 mb-1">Lead Source</label>
                <select
                  name="leadSource"
                  id="leadSource"
                  value={formData.leadSource}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Door Knock">Door Knock</option>
                  <option value="Referral">Referral</option>
                  <option value="Website">Website</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Cold Call">Cold Call</option>
                  <option value="Trade Show">Trade Show</option>
                </select>
              </div>
            </div>
          </div>

          {/* Roof Information */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Roof Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="roofType" className="block text-sm font-medium text-gray-700 mb-1">Roof Type</label>
                <select
                  name="roofType"
                  id="roofType"
                  value={formData.roofType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Asphalt Shingle">Asphalt Shingle</option>
                  <option value="Tile">Tile</option>
                  <option value="Metal">Metal</option>
                  <option value="Flat/TPO">Flat/TPO</option>
                  <option value="Wood Shake">Wood Shake</option>
                  <option value="Slate">Slate</option>
                </select>
              </div>
              <div>
                <label htmlFor="roofAge" className="block text-sm font-medium text-gray-700 mb-1">Roof Age</label>
                <input
                  type="text"
                  name="roofAge"
                  id="roofAge"
                  value={formData.roofAge}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., 10 years"
                />
              </div>
            </div>
          </div>

          {/* Sales Information */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Sales Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dabellaQuote" className="block text-sm font-medium text-gray-700 mb-1">DaBella Quote</label>
                <input
                  type="text"
                  name="dabellaQuote"
                  id="dabellaQuote"
                  value={formData.dabellaQuote}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., $12,500 or Pending"
                />
              </div>
              <div>
                <label htmlFor="quality" className="block text-sm font-medium text-gray-700 mb-1">Lead Quality</label>
                <select
                  name="quality"
                  id="quality"
                  value={formData.quality}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Hot">Hot - Ready to buy</option>
                  <option value="Warm">Warm - Interested</option>
                  <option value="Cold">Cold - Just looking</option>
                </select>
              </div>
              <div>
                <label htmlFor="disposition" className="block text-sm font-medium text-gray-700 mb-1">Disposition</label>
                <select
                  name="disposition"
                  id="disposition"
                  value={formData.disposition}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Initial Contact">Initial Contact</option>
                  <option value="Follow Up">Follow Up</option>
                  <option value="Quoted">Quoted</option>
                  <option value="Negotiating">Negotiating</option>
                  <option value="Closed Won">Closed Won</option>
                  <option value="Closed Lost">Closed Lost</option>
                </select>
              </div>
              <div>
                <label htmlFor="inspectionStatus" className="block text-sm font-medium text-gray-700 mb-1">Inspection Status</label>
                <select
                  name="inspectionStatus"
                  id="inspectionStatus"
                  value={formData.inspectionStatus}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Not Scheduled">Not Scheduled</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Needs Re-inspection">Needs Re-inspection</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes and Appointment */}
          <div className="pb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700 mb-1">Appointment Date</label>
                <input
                  type="date"
                  name="appointmentDate"
                  id="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  id="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Storm damage details, insurance info, special requirements..."
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{lead ? 'Update Lead' : 'Save Lead'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Other components remain unchanged...
// ... (ScheduleView, RouteMapView, NavButton, StatCard, QualityBadge)

// Schedule View Component
const ScheduleView = ({ appointments, leads }) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const calendarDays = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push(i);
    }
    
    return calendarDays;
  };
  
  const calendarDays = getDaysInMonth(currentDate);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Appointment Schedule</h2>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 p-2">
              {day}
            </div>
          ))}
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`border border-gray-200 p-2 h-24 overflow-hidden ${
                day === currentDate.getDate() ? 'bg-indigo-50 border-indigo-500' : ''
              } ${day ? 'hover:bg-gray-50' : 'bg-gray-50'}`}
            >
              {day && (
                <div>
                  <div className="font-semibold text-sm mb-1">{day}</div>
                  <div className="text-xs space-y-1">
                    {appointments
                      .filter(apt => {
                        const aptDate = new Date(apt.date);
                        // Adjust for timezone differences by comparing UTC dates
                        return aptDate.getUTCDate() === day && 
                               aptDate.getUTCMonth() === currentMonth &&
                               aptDate.getUTCFullYear() === currentYear;
                      })
                      .slice(0, 2)
                      .map(apt => {
                        const lead = leads.find(l => l.id === apt.leadId);
                        return (
                          <div key={apt.id} className="bg-indigo-100 text-indigo-700 px-1 rounded truncate">
                            {apt.time} - {lead?.customerName}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Route Map View Component
const RouteMapView = ({ leads }) => {
  const [selectedArea, setSelectedArea] = useState('all');
  
  const groupedLeads = leads.reduce((acc, lead) => {
    const city = lead.address.split(',')[1]?.trim() || 'Unknown';
    if (!acc[city]) acc[city] = [];
    acc[city].push(lead);
    return acc;
  }, {});

  const getFilteredLeadsForRoute = () => {
    if (selectedArea === 'all') return leads;
    return groupedLeads[selectedArea] || [];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Route Planning</h2>
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-gray-500" />
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Areas</option>
            {Object.keys(groupedLeads).map(city => (
              <option key={city} value={city}>{city} ({groupedLeads[city].length} leads)</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center mb-4">
          <div className="text-center">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Interactive Map View</p>
            <p className="text-sm text-gray-500">Google Maps integration will display here</p>
          </div>
        </div>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">Suggested Route</h3>
        <div className="space-y-3">
          {getFilteredLeadsForRoute().map((lead, index) => (
            <div key={lead.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                {index + 1}
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{lead.customerName}</p>
                    <p className="text-sm text-gray-600">{lead.address}</p>
                  </div>
                   <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-500">{lead.phoneNumber}</span>
                      <QualityBadge quality={lead.quality} size="small" />
                      <span className="text-xs text-gray-500">{lead.disposition}</span>
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper Components
const NavButton = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition duration-200 text-sm ${
      isActive
        ? 'bg-indigo-100 text-indigo-700'
        : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      <div className={`${color} text-white p-3 rounded-lg`}>
        {icon}
      </div>
    </div>
  </div>
);

const QualityBadge = ({ quality, size = 'normal' }) => {
  const colors = {
    Hot: 'bg-red-100 text-red-800 border-red-200',
    Warm: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Cold: 'bg-blue-100 text-blue-800 border-blue-200'
  };
  
  const sizeClasses = size === 'small' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1';
  
  return (
    <span className={`${sizeClasses} inline-flex font-semibold rounded-full border ${colors[quality] || 'bg-gray-100 text-gray-800'}`}>
      {quality}
    </span>
  );
};

export default App;

