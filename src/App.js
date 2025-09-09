import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Filter, Plus, Edit2, Trash2, Save, Navigation, DollarSign, ClipboardList, AlertCircle, CheckCircle, Clock, Home, Phone, Mail, RefreshCw } from 'lucide-react';

// --- Google Sheets Service Class ---
class GoogleSheetsService {
  constructor() {
    // Your Google Apps Script Web App URL - replace this with your actual URL
    this.baseURL = 'https://script.google.com/macros/s/AKfycbw8r0tVUeFptoP0hdEQONuP8RR5NdYxBjPZwiXPZCLJLwduWAm28K23aVjqwzr4joejtA/exec';

    if (!this.baseURL || this.baseURL.includes('YOUR_GOOGLE_APPS_SCRIPT')) {
      console.warn('Google Sheets integration needs configuration. Update the baseURL with your Google Apps Script URL.');
    }
  }

  // Generic request handler
  async makeRequest(action, payload) {
    try {
      const url = new URL(this.baseURL);
      
      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors', // IMPORTANT: Changed from 'no-cors' to handle responses
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // Apps Script quirk
        },
        body: JSON.stringify({ action, ...payload }) // Combine action and payload
      });
      
      // Since Apps Script can redirect, we need to handle the response carefully
      if (response.type === 'opaque' || response.redirected) {
         // This can happen with CORS redirects, assume success but log it.
         console.warn('Received an opaque or redirected response. Assuming success.');
         return { success: true, message: 'Request sent, but response could not be read directly.' };
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error(`Error with action '${action}':`, error);
      // Return a standard error format
      return { success: false, message: error.message };
    }
  }

  // Fetch leads from Google Sheets
  async fetchLeads() {
    try {
        const url = new URL(this.baseURL);
        url.searchParams.append('action', 'getLeads');
      
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.leads || [];

    } catch (error) {
      console.warn('Could not fetch leads from Google Sheets, using local data.', error);
      return []; // Return empty array on failure
    }
  }

  addLead(lead) {
    return this.makeRequest('addLead', { lead });
  }

  updateLead(lead) {
    return this.makeRequest('updateLead', { lead });
  }

  deleteLead(leadId) {
    return this.makeRequest('deleteLead', { leadId });
  }
}

const googleSheetsService = new GoogleSheetsService();

// --- Main CRM Application ---
function App() {
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
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadLeadsData();
  }, []);

  const addNotification = (message, type = 'info') => {
      const newNotification = { id: Date.now().toString(), message, type };
      setNotifications(prev => [newNotification, ...prev]);

      // Set a timer to automatically remove the notification after 5 seconds
      setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 5000);
  };

  const loadLeadsData = async () => {
    try {
      setLoading(true);
      const sheetsLeads = await googleSheetsService.fetchLeads();

      // Filter out leads with no ID and remove duplicates to prevent key errors
      const seenIds = new Set();
      const uniqueLeads = sheetsLeads.filter(lead => {
          if (!lead.id || seenIds.has(lead.id)) {
              console.warn('Filtered out lead with missing or duplicate ID:', lead);
              return false;
          }
          seenIds.add(lead.id);
          return true;
      });

      if (uniqueLeads.length > 0) {
        setLeads(uniqueLeads);
        addNotification(`Loaded ${uniqueLeads.length} leads from Google Sheets`, 'success');
      } else {
        setLeads([]);
        addNotification('No leads found. Add your first lead to get started!', 'info');
      }
      setAppointments([]);
    } catch (error) {
      console.error('Error loading leads:', error);
      setLeads([]);
      addNotification('Could not connect to Google Sheets.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  // Lead management functions
  const addLead = async (leadData) => {
    try {
      const newLead = {
        ...leadData,
        createdDate: new Date().toISOString().split('T')[0],
        lastContact: new Date().toISOString().split('T')[0],
        smsCount: 0,
        emailCount: 0
      };

      const response = await googleSheetsService.addLead(newLead);
      
      if (response.success) {
        // Add the new lead with the ID returned from the backend
        setLeads(prev => [...prev, { ...newLead, id: response.leadId }]);
        addNotification(`New lead added: ${leadData.customerName}`, 'success');
        setShowAddForm(false);
      } else {
         throw new Error(response.message || 'Failed to add lead in Google Sheets.');
      }
    } catch (error) {
      console.error('Failed to add lead:', error);
      addNotification(`Error adding lead: ${error.message}`, 'error');
    }
  };

  const updateLead = async (updatedLead) => {
    try {
      const response = await googleSheetsService.updateLead(updatedLead);
      if (response.success) {
          setLeads(leads.map(lead => lead.id === updatedLead.id ? updatedLead : lead));
          addNotification(`Lead updated: ${updatedLead.customerName}`, 'info');
          setSelectedLead(null); // Close the form
      } else {
          throw new Error(response.message || 'Failed to update lead in Google Sheets.');
      }
    } catch (error) {
      console.error('Failed to update lead:', error);
      addNotification(`Error updating lead: ${error.message}`, 'error');
    }
  };

  const deleteLead = async (leadId) => {
    try {
        const leadToDelete = leads.find(l => l.id === leadId);
        if (window.confirm(`Are you sure you want to delete ${leadToDelete?.customerName}?`)) {
            const response = await googleSheetsService.deleteLead(leadId);
            if (response.success) {
                setLeads(leads.filter(l => l.id !== leadId));
                addNotification(`Lead deleted: ${leadToDelete?.customerName}`, 'warning');
            } else {
                throw new Error(response.message || 'Failed to delete lead in Google Sheets.');
            }
        }
    } catch (error) {
      console.error('Failed to delete lead:', error);
      addNotification(`Error deleting lead: ${error.message}`, 'error');
    }
  };

  // Filter leads
  const getFilteredLeads = () => {
    return leads.filter(lead => {
      if (filterCriteria.disposition !== 'all' && lead.disposition !== filterCriteria.disposition) return false;
      if (filterCriteria.leadSource !== 'all' && lead.leadSource !== filterCriteria.leadSource) return false;
      if (filterCriteria.quality !== 'all' && lead.quality !== filterCriteria.quality) return false;
      return true;
    });
  };

  // Dashboard stats
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Bhotch CRM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Bhotch CRM</h1>
            </div>
            <nav className="flex space-x-4">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Home className="w-4 h-4 inline mr-2" />
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('leads')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'leads'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ClipboardList className="w-4 h-4 inline mr-2" />
                Leads
              </button>
              <button
                onClick={() => setCurrentView('calendar')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'calendar'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Calendar
              </button>
              <button
                onClick={() => setCurrentView('map')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'map'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MapPin className="w-4 h-4 inline mr-2" />
                Map
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Notifications */}
      <div className="fixed top-5 right-5 w-80 z-50">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-3 rounded-md mb-2 shadow-lg animate-fade-in-right ${
                notification.type === 'success' ? 'bg-green-100 text-green-800' :
                notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                notification.type === 'error' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}
            >
              <div className="flex items-start">
                {notification.type === 'success' && <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />}
                {notification.type === 'warning' && <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />}
                {notification.type === 'error' && <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />}
                {notification.type === 'info' && <Clock className="w-5 h-5 mr-2 flex-shrink-0" />}
                <span className="text-sm">{notification.message}</span>
              </div>
            </div>
          ))}
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'dashboard' && <DashboardView stats={getDashboardStats()} leads={leads} />}
        {currentView === 'leads' && (
          <LeadsView
            leads={getFilteredLeads()}
            onAddLead={() => setShowAddForm(true)}
            onEditLead={setSelectedLead}
            onDeleteLead={deleteLead}
            filterCriteria={filterCriteria}
            setFilterCriteria={setFilterCriteria}
            onRefreshLeads={loadLeadsData}
          />
        )}
        {currentView === 'calendar' && <CalendarView appointments={appointments} leads={leads} />}
        {currentView === 'map' && <MapView leads={leads} />}
      </main>

      {/* Add Lead Form Modal */}
      {showAddForm && (
        <AddLeadForm
          onSubmit={addLead}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Edit Lead Form Modal */}
      {selectedLead && (
        <EditLeadForm
          lead={selectedLead}
          onSubmit={updateLead}
          onCancel={() => setSelectedLead(null)}
        />
      )}
    </div>
  );
}

// Sub-components remain the same as they were well-structured.
// ... DashboardView, LeadsView, CalendarView, MapView, AddLeadForm, EditLeadForm, StatCard

function DashboardView({ stats, leads }) {
  const recentLeads = leads.slice(-5).reverse();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Leads" value={stats.totalLeads} icon={<ClipboardList />} color="blue" />
        <StatCard title="Hot Leads" value={stats.hotLeads} icon={<AlertCircle />} color="red" />
        <StatCard title="Quoted Leads" value={stats.quotedLeads} icon={<DollarSign />} color="green" />
        <StatCard title="Total Quote Value" value={`$${stats.totalQuoteValue.toLocaleString()}`} icon={<DollarSign />} color="purple" />
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Leads</h3>
        </div>
        <div className="p-6">
          {recentLeads.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No leads yet. Add your first lead to get started!</p>
          ) : (
            <div className="space-y-4">
              {recentLeads.map(lead => (
                <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{lead.customerName}</h4>
                    <p className="text-sm text-gray-500">{lead.leadSource} - {lead.disposition}</p>
                    <p className="text-sm font-medium text-green-600">{lead.dabellaQuote}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{lead.phoneNumber}</p>
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      lead.quality === 'Hot' ? 'bg-red-100 text-red-800' :
                      lead.quality === 'Warm' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {lead.quality}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LeadsView({ leads, onAddLead, onEditLead, onDeleteLead, filterCriteria, setFilterCriteria, onRefreshLeads }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Leads Management</h2>
        <div className="flex space-x-2">
            <button
              onClick={onRefreshLeads}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={onAddLead}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4">
          <select
            value={filterCriteria.disposition}
            onChange={(e) => setFilterCriteria({ ...filterCriteria, disposition: e.target.value })}
            className="rounded border-gray-300"
          >
            <option value="all">All Dispositions</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Quoted">Quoted</option>
            <option value="Follow Up">Follow Up</option>
            <option value="Closed Won">Closed Won</option>
            <option value="Closed Lost">Closed Lost</option>
          </select>

          <select
            value={filterCriteria.leadSource}
            onChange={(e) => setFilterCriteria({ ...filterCriteria, leadSource: e.target.value })}
            className="rounded border-gray-300"
          >
            <option value="all">All Sources</option>
            <option value="Door Knock">Door Knock</option>
            <option value="Referral">Referral</option>
            <option value="Online">Online</option>
            <option value="Advertisement">Advertisement</option>
            <option value="Cold Call">Cold Call</option>
          </select>

          <select
            value={filterCriteria.quality}
            onChange={(e) => setFilterCriteria({ ...filterCriteria, quality: e.target.value })}
            className="rounded border-gray-300"
          >
            <option value="all">All Qualities</option>
            <option value="Hot">Hot</option>
            <option value="Warm">Warm</option>
            <option value="Cold">Cold</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
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
            {leads.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No leads match the current filters.
                </td>
              </tr>
            ) : (
              leads.map(lead => (
                <tr key={lead.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{lead.customerName}</div>
                      <div className="text-sm text-gray-500">{lead.address}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{lead.phoneNumber}</div>
                      <div className="text-sm text-gray-500">{lead.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {lead.dabellaQuote}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      lead.quality === 'Hot' ? 'bg-red-100 text-red-800' :
                      lead.quality === 'Warm' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {lead.quality}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{lead.disposition}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onEditLead(lead)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteLead(lead.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CalendarView({ appointments, leads }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Appointments</h2>
      {appointments.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No appointments scheduled</p>
      ) : (
        <div className="space-y-4">
          {appointments.map(apt => {
            const lead = leads.find(l => l.id === apt.leadId);
            return (
              <div key={apt.id} className="border rounded-lg p-4">
                <h3 className="font-medium">{lead?.customerName}</h3>
                <p className="text-sm text-gray-500">{apt.date} at {apt.time}</p>
                <p className="text-sm">{apt.type}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MapView({ leads }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Lead Locations</h2>
      <div className="bg-gray-100 h-96 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Map functionality coming soon.</p>
        </div>
      </div>
    </div>
  );
}

function AddLeadForm({ onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        customerName: '', address: '', phoneNumber: '', email: '', dabellaQuote: '',
        quality: 'Cold', notes: '', disposition: 'New', leadSource: 'Door Knock',
        roofAge: '', roofType: 'Asphalt Shingle', inspectionStatus: 'Not Scheduled',
        appointmentDate: ''
    });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Lead</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer Name *</label>
                <input type="text" required value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                <input type="tel" required value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Quote Amount</label>
                <input type="text" placeholder="$12,500" value={formData.dabellaQuote} onChange={(e) => setFormData({ ...formData, dabellaQuote: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Add Lead</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function EditLeadForm({ lead, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(lead);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Lead</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                <input type="text" value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Disposition</label>
                <select value={formData.disposition} onChange={(e) => setFormData({ ...formData, disposition: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Quoted">Quoted</option>
                  <option value="Follow Up">Follow Up</option>
                  <option value="Closed Won">Closed Won</option>
                  <option value="Closed Lost">Closed Lost</option>
                </select>
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700">Quote Amount</label>
                <input type="text" value={formData.dabellaQuote} onChange={(e) => setFormData({...formData, dabellaQuote: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Lead Quality</label>
                <select value={formData.quality} onChange={(e) => setFormData({...formData, quality: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="Hot">Hot</option>
                  <option value="Warm">Warm</option>
                  <option value="Cold">Cold</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Update Lead</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    red: 'bg-red-100 text-red-800',
    green: 'bg-green-100 text-green-800',
    purple: 'bg-purple-100 text-purple-800'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-2 rounded-md ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default App;

