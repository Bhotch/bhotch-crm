import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Filter, Plus, Edit2, Trash2, Save, Navigation, DollarSign, ClipboardList, AlertCircle, CheckCircle, Clock, Home, Phone, Mail, RefreshCw, X, User, Tag, Building, Briefcase } from 'lucide-react';

// --- Google Sheets Service Class ---
class GoogleSheetsService {
  constructor() {
    this.baseURL = 'https://script.google.com/macros/s/AKfycbw8r0tVUeFptoP0hdEQONuP8RR5NdYxBjPZwiXPZCLJLwduWAm28K23aVjqwzr4joejtA/exec';
    if (!this.baseURL || this.baseURL.includes('YOUR_GOOGLE_APPS_SCRIPT')) {
      console.warn('Google Sheets integration needs configuration. Update the baseURL with your Google Apps Script URL.');
    }
  }

  async makeRequest(action, payload) {
    try {
      const url = new URL(this.baseURL);
      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, ...payload })
      });
      if (response.type === 'opaque' || response.redirected) {
        console.warn('Received an opaque or redirected response. Assuming success.');
        return { success: true, message: 'Request sent, but response could not be read directly.' };
      }
      return await response.json();
    } catch (error) {
      console.error(`Error with action '${action}':`, error);
      return { success: false, message: error.message };
    }
  }

  async fetchLeads() {
    try {
      const url = new URL(this.baseURL);
      url.searchParams.append('action', 'getLeads');
      url.searchParams.append('cacheBust', new Date().getTime());
      const response = await fetch(url, { method: 'GET', mode: 'cors' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.success === false) throw new Error(data.message);
      return data.leads || [];
    } catch (error) {
      console.warn('Could not fetch leads from Google Sheets.', error);
      return [];
    }
  }

  addLead(lead) { return this.makeRequest('addLead', { lead }); }
  updateLead(lead) { return this.makeRequest('updateLead', { lead }); }
  deleteLead(leadId) { return this.makeRequest('deleteLead', { leadId }); }
}

const googleSheetsService = new GoogleSheetsService();

// --- Main CRM Application ---
function App() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedLead, setSelectedLead] = useState(null); // For viewing details
  const [editingLead, setEditingLead] = useState(null); // For editing form
  const [filterCriteria, setFilterCriteria] = useState({ disposition: 'all', leadSource: 'all', quality: 'all' });
  const [notifications, setNotifications] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => { loadLeadsData(); }, []);

  const addNotification = (message, type = 'info') => {
    const newNotification = { id: Date.now().toString(), message, type };
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== newNotification.id)), 5000);
  };

  const loadLeadsData = async (isManualRefresh = false) => {
    try {
      if (!isManualRefresh) setLoading(true);
      const sheetsLeads = await googleSheetsService.fetchLeads();
      const seenIds = new Set();
      const uniqueLeads = sheetsLeads.filter(lead => {
        if (!lead.id || seenIds.has(lead.id)) return false;
        seenIds.add(lead.id);
        return true;
      });

      if (isManualRefresh) {
        if (leads.length !== uniqueLeads.length || !leads.every(l => uniqueLeads.some(ul => ul.id === l.id))) {
          addNotification('Leads have been updated.', 'success');
        } else {
          addNotification('No new leads found.', 'info');
        }
      } else if (uniqueLeads.length > 0) {
        addNotification(`Loaded ${uniqueLeads.length} leads from Google Sheets`, 'success');
      } else {
        addNotification('No leads found. Add your first lead!', 'info');
      }
      setLeads(uniqueLeads);
    } catch (error) {
      addNotification(`Could not connect to Google Sheets: ${error.message}`, 'warning');
    } finally {
      if (!isManualRefresh) setLoading(false);
    }
  };

  const handleAddLead = async (leadData) => {
    try {
      const response = await googleSheetsService.addLead(leadData);
      if (response.success && response.leadId) {
        setLeads(prev => [...prev, { ...leadData, id: response.leadId }]);
        addNotification(`New lead added: ${leadData.customerName}`, 'success');
        setShowAddForm(false);
      } else {
        throw new Error(response.message || 'Failed to add lead in Google Sheets.');
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
        setSelectedLead(updatedLead); // Update the detail view
      } else {
        throw new Error(response.message || 'Failed to update lead.');
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
          setSelectedLead(null); // Close detail view
        } else {
          throw new Error(response.message || 'Failed to delete lead.');
        }
      } catch (error) {
        addNotification(`Error deleting lead: ${error.message}`, 'error');
      }
    }
  };

  const getFilteredLeads = () => leads.filter(lead =>
    (filterCriteria.disposition === 'all' || lead.disposition === filterCriteria.disposition) &&
    (filterCriteria.leadSource === 'all' || lead.leadSource === filterCriteria.leadSource) &&
    (filterCriteria.quality === 'all' || lead.quality === filterCriteria.quality)
  );
  
  const getDashboardStats = () => ({
    totalLeads: leads.length,
    hotLeads: leads.filter(l => l.quality === 'Hot').length,
    quotedLeads: leads.filter(l => l.disposition === 'Quoted').length,
    totalQuoteValue: leads.reduce((sum, lead) => sum + (parseFloat(String(lead.dabellaQuote).replace(/[$,]/g, '')) || 0), 0)
  });

  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div><p className="text-gray-600">Loading Bhotch CRM...</p></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-30"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex justify-between items-center py-4"><div className="flex items-center"><DollarSign className="h-8 w-8 text-blue-600 mr-3" /><h1 className="text-2xl font-bold text-gray-900">Bhotch CRM</h1></div><nav className="flex space-x-1 sm:space-x-4">
        <button onClick={() => setCurrentView('dashboard')} className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${currentView === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}><Home className="w-4 h-4 mr-2" />Dashboard</button>
        <button onClick={() => setCurrentView('leads')} className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${currentView === 'leads' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}><ClipboardList className="w-4 h-4 mr-2" />Leads</button>
      </nav></div></div></header>
      
      <div className="fixed top-5 right-5 w-80 z-50">{notifications.map(n => <div key={n.id} className={`p-3 rounded-md mb-2 shadow-lg animate-fade-in-right flex items-start ${ n.type === 'success' ? 'bg-green-100 text-green-800' : n.type === 'warning' ? 'bg-yellow-100 text-yellow-800' : n.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800' }`}>
          {n.type === 'success' && <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />}
          {n.type === 'warning' && <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />}
          {n.type === 'error' && <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />}
          {n.type === 'info' && <Clock className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />}
          <span className="text-sm">{n.message}</span>
      </div>)}</div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'dashboard' && <DashboardView stats={getDashboardStats()} leads={leads} />}
        {currentView === 'leads' && <LeadsView leads={getFilteredLeads()} onAddLead={() => setShowAddForm(true)} onSelectLead={setSelectedLead} filterCriteria={filterCriteria} setFilterCriteria={setFilterCriteria} onRefreshLeads={() => loadLeadsData(true)} />}
      </main>

      {selectedLead && !editingLead && <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} onEdit={() => setEditingLead(selectedLead)} onDelete={handleDeleteLead} />}
      {showAddForm && <LeadFormModal onSubmit={handleAddLead} onCancel={() => setShowAddForm(false)} />}
      {editingLead && <LeadFormModal initialData={editingLead} onSubmit={handleUpdateLead} onCancel={() => setEditingLead(null)} isEdit={true} />}
    </div>
  );
}

// --- Reusable Components ---
const StatCard = ({ title, value, icon, color }) => {
    const colors = { blue: 'bg-blue-100 text-blue-800', red: 'bg-red-100 text-red-800', green: 'bg-green-100 text-green-800', purple: 'bg-purple-100 text-purple-800' };
    return <div className="bg-white rounded-lg shadow p-5"><div className="flex items-center"><div className={`p-3 rounded-full ${colors[color]}`}>{icon}</div><div className="ml-4"><p className="text-sm font-medium text-gray-500 truncate">{title}</p><p className="text-2xl font-semibold text-gray-900">{value}</p></div></div></div>
};

const FilterControls = ({ filterCriteria, setFilterCriteria }) => {
    const handleFilterChange = (key, value) => setFilterCriteria(prev => ({ ...prev, [key]: value }));
    return <>
        <select value={filterCriteria.disposition} onChange={e => handleFilterChange('disposition', e.target.value)} className="rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"><option value="all">All Dispositions</option><option>New</option><option>Contacted</option><option>Qualified</option><option>Quoted</option><option>Follow Up</option><option>Closed Won</option><option>Closed Lost</option></select>
        <select value={filterCriteria.leadSource} onChange={e => handleFilterChange('leadSource', e.target.value)} className="rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"><option value="all">All Sources</option><option>Door Knock</option><option>Referral</option><option>Online</option><option>Advertisement</option><option>Cold Call</option></select>
        <select value={filterCriteria.quality} onChange={e => handleFilterChange('quality', e.target.value)} className="rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"><option value="all">All Qualities</option><option>Hot</option><option>Warm</option><option>Cold</option></select>
    </>;
};

// --- View Components ---

function DashboardView({ stats, leads }) {
  const recentLeads = leads.slice(-5).reverse();
  return <div className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"><StatCard title="Total Leads" value={stats.totalLeads} icon={<ClipboardList size={24} />} color="blue" /><StatCard title="Hot Leads" value={stats.hotLeads} icon={<AlertCircle size={24} />} color="red" /><StatCard title="Quoted Leads" value={stats.quotedLeads} icon={<DollarSign size={24} />} color="green" /><StatCard title="Total Quote Value" value={`$${stats.totalQuoteValue.toLocaleString()}`} icon={<Briefcase size={24} />} color="purple" /></div><div className="bg-white rounded-lg shadow"><div className="px-6 py-4 border-b border-gray-200"><h3 className="text-lg font-medium text-gray-900">Recent Leads</h3></div><div className="p-6">{recentLeads.length === 0 ? <p className="text-gray-500 text-center py-4">No recent leads.</p> : <div className="space-y-4">{recentLeads.map(lead => <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"><div><h4 className="font-medium text-gray-900">{lead.customerName}</h4><p className="text-sm text-gray-500">{lead.leadSource} - {lead.disposition}</p><p className="text-sm font-medium text-green-600">{lead.dabellaQuote || "No Quote"}</p></div><div className="text-right"><p className="text-sm text-gray-500">{lead.phoneNumber}</p><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${lead.quality === 'Hot' ? 'bg-red-100 text-red-800' : lead.quality === 'Warm' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{lead.quality}</span></div></div>)}</div>}</div></div></div>;
}

function LeadsView({ leads, onAddLead, onSelectLead, filterCriteria, setFilterCriteria, onRefreshLeads }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Leads Management</h2>
        <div className="flex space-x-2">
          <button onClick={onRefreshLeads} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm hover:shadow-md transition-all"><RefreshCw className="w-4 h-4 mr-2" />Refresh</button>
          <button onClick={onAddLead} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm hover:shadow-md transition-all"><Plus className="w-4 h-4 mr-2" />Add Lead</button>
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow"><div className="flex flex-wrap gap-4"><FilterControls filterCriteria={filterCriteria} setFilterCriteria={setFilterCriteria} /></div></div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quote</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No leads match filters.</td></tr>
            ) : (
              leads.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onSelectLead(lead)}>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{lead.customerName}</div><div className="text-sm text-gray-500">{lead.address}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{lead.phoneNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{lead.dabellaQuote || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{lead.leadSource}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${lead.quality === 'Hot' ? 'bg-red-100 text-red-800' : lead.quality === 'Warm' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{lead.quality}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Modal and Form Components ---

const DetailItem = ({ icon, label, value }) => (
    <div>
        <dt className="text-sm font-medium text-gray-500 flex items-center">{icon}{label}</dt>
        <dd className="mt-1 text-sm text-gray-900">{value || <span className="text-gray-400">Not provided</span>}</dd>
    </div>
);

function LeadDetailModal({ lead, onClose, onEdit, onDelete }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-40 animate-fade-in">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center"><User className="mr-3 text-blue-600" />{lead.customerName}</h3>
            <p className="text-sm text-gray-500">{lead.address}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        <div className="p-6 overflow-y-auto">
            {/* Main Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b">
                <DetailItem icon={<Phone size={14} className="mr-2" />} label="Phone" value={<a href={`tel:${lead.phoneNumber}`} className="text-blue-600 hover:underline">{lead.phoneNumber}</a>} />
                <DetailItem icon={<Mail size={14} className="mr-2" />} label="Email" value={<a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">{lead.email}</a>} />
                <DetailItem icon={<DollarSign size={14} className="mr-2" />} label="Quote" value={<span className="font-bold text-green-700">{lead.dabellaQuote}</span>} />
            </div>

            {/* Lead Status Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b">
                <DetailItem icon={<Tag size={14} className="mr-2" />} label="Quality" value={<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${lead.quality === 'Hot' ? 'bg-red-100 text-red-800' : lead.quality === 'Warm' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{lead.quality}</span>} />
                <DetailItem icon={<ClipboardList size={14} className="mr-2" />} label="Disposition" value={lead.disposition} />
                <DetailItem icon={<User size={14} className="mr-2" />} label="Lead Source" value={lead.leadSource} />
            </div>
            
             {/* Future Integrations Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <Calendar size={24} className="mx-auto text-gray-400 mb-2"/>
                    <h4 className="font-semibold text-sm">Appointments</h4>
                    <p className="text-xs text-gray-500">Google Calendar integration coming soon.</p>
                </div>
                 <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <Mail size={24} className="mx-auto text-gray-400 mb-2"/>
                    <h4 className="font-semibold text-sm">Communications</h4>
                    <p className="text-xs text-gray-500">SMS/Email integration coming soon.</p>
                </div>
                 <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <MapPin size={24} className="mx-auto text-gray-400 mb-2"/>
                    <h4 className="font-semibold text-sm">Route Planning</h4>
                    <p className="text-xs text-gray-500">Google Maps integration coming soon.</p>
                </div>
            </div>

            {/* Notes */}
            <div>
                 <h4 className="text-md font-semibold text-gray-800 mb-2">Notes</h4>
                 <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-md whitespace-pre-wrap">{lead.notes || "No notes for this lead."}</p>
            </div>
        </div>
        <div className="flex justify-end space-x-3 p-4 bg-gray-50 border-t">
            <button onClick={() => onDelete(lead.id)} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"><Trash2 size={16} className="mr-2"/>Delete</button>
            <button onClick={onEdit} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"><Edit2 size={16} className="mr-2"/>Edit Lead</button>
        </div>
      </div>
    </div>
  );
}

const initialFormData = { customerName: '', address: '', phoneNumber: '', email: '', dabellaQuote: '', quality: 'Cold', notes: '', disposition: 'New', leadSource: 'Door Knock', roofAge: '', roofType: 'Asphalt Shingle', inspectionStatus: 'Not Scheduled', appointmentDate: '', date: '', followupDate: '', leadStatus: '' };

function LeadFormModal({ initialData = initialFormData, onSubmit, onCancel, isEdit = false }) {
    const [formData, setFormData] = useState(initialData);
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData); };
    
    const FormSection = ({ title, children }) => <div className="mb-6"><h4 className="text-md font-semibold text-gray-800 border-b pb-2 mb-4">{title}</h4><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div></div>;
    const FormField = ({ label, children, fullWidth = false }) => <div className={fullWidth ? 'lg:col-span-3 md:col-span-2' : ''}><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>{children}</div>;
    const TextInput = (props) => <input type="text" {...props} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />;
    const DateInput = (props) => <input type="date" {...props} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />;
    const SelectInput = ({ children, ...props }) => <select {...props} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500">{children}</select>;
    const TextareaInput = (props) => <textarea {...props} rows={4} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />;

    return <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-40"><div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col"><div className="p-6 border-b flex justify-between items-center"><h3 className="text-lg font-medium text-gray-900">{isEdit ? "Edit Lead" : "Add New Lead"}</h3><button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={24}/></button></div><div className="p-6 overflow-y-auto"><form onSubmit={handleSubmit}>
        <FormSection title="Customer Information">
            <FormField label="Full Name *"><TextInput name="customerName" value={formData.customerName} onChange={handleChange} required /></FormField>
            <FormField label="Phone Number *"><TextInput name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required /></FormField>
            <FormField label="Email"><TextInput name="email" type="email" value={formData.email} onChange={handleChange} /></FormField>
            <FormField label="Address" fullWidth><TextInput name="address" value={formData.address} onChange={handleChange} /></FormField>
        </FormSection>
        <FormSection title="Lead Details">
            <FormField label="Lead Source"><SelectInput name="leadSource" value={formData.leadSource} onChange={handleChange}><option>Door Knock</option><option>Referral</option><option>Online</option><option>Advertisement</option><option>Cold Call</option></SelectInput></FormField>
            <FormField label="Quality"><SelectInput name="quality" value={formData.quality} onChange={handleChange}><option>Hot</option><option>Warm</option><option>Cold</option></SelectInput></FormField>
            <FormField label="Disposition"><SelectInput name="disposition" value={formData.disposition} onChange={handleChange}><option>New</option><option>Contacted</option><option>Qualified</option><option>Quoted</option><option>Follow Up</option><option>Closed Won</option><option>Closed Lost</option></SelectInput></FormField>
        </FormSection>
        <FormSection title="Job & Quote Details">
            <FormField label="Roof Age"><TextInput name="roofAge" value={formData.roofAge} onChange={handleChange} /></FormField>
            <FormField label="Roof Type"><SelectInput name="roofType" value={formData.roofType} onChange={handleChange}><option>Asphalt Shingle</option><option>Metal</option><option>Tile</option><option>Slate</option><option>Wood</option></SelectInput></FormField>
            <FormField label="Quote Amount"><TextInput name="dabellaQuote" value={formData.dabellaQuote} onChange={handleChange} placeholder="$15,000" /></FormField>
        </FormSection>
        <FormSection title="Notes"><FormField label="Notes" fullWidth><TextareaInput name="notes" value={formData.notes} onChange={handleChange} /></FormField></FormSection>
        <div className="flex justify-end space-x-3 pt-4 border-t mt-6"><button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{isEdit ? "Update Lead" : "Add Lead"}</button></div>
    </form></div></div></div>;
}

export default App;

