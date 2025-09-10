import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Calendar, Plus, Edit2, Trash2, DollarSign, ClipboardList, AlertCircle, CheckCircle, Clock, Home, Phone, Mail, RefreshCw, X, User, Tag, Briefcase, Search, TrendingUp, MessageSquare, Eye, XCircle, ShieldCheck } from 'lucide-react';

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
        return { success: true, message: 'Request sent, but response could not be read directly.' };
      }
      return await response.json();
    } catch (error) {
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

// --- Reusable UI Components ---
const StatCard = ({ title, value, icon, color }) => {
    const colors = { blue: 'bg-blue-100 text-blue-800', red: 'bg-red-100 text-red-800', green: 'bg-green-100 text-green-800', purple: 'bg-purple-100 text-purple-800' };
    return <div className="bg-white rounded-lg shadow p-5"><div className="flex items-center"><div className={`p-3 rounded-full ${colors[color]}`}>{icon}</div><div className="ml-4"><p className="text-sm font-medium text-gray-500 truncate">{title}</p><p className="text-2xl font-semibold text-gray-900">{value}</p></div></div></div>
};

const DetailItem = ({ icon, label, value }) => (
    <div>
        <dt className="text-sm font-medium text-gray-500 flex items-center">{icon}{label}</dt>
        <dd className="mt-1 text-sm text-gray-900">{value || <span className="text-gray-400">Not provided</span>}</dd>
    </div>
);

const FormSection = ({ title, children }) => <div className="mb-6"><h4 className="text-md font-semibold text-gray-800 border-b pb-2 mb-4">{title}</h4><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div></div>;
const FormField = ({ label, children, fullWidth = false }) => <div className={fullWidth ? 'lg:col-span-3 md:col-span-2' : ''}><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>{children}</div>;
const TextInput = (props) => <input type="text" {...props} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />;
const SelectInput = ({ children, ...props }) => <select {...props} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500">{children}</select>;
const TextareaInput = (props) => <textarea {...props} rows={4} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />;


// --- View Components ---
function DashboardView({ stats, leads }) {
  const recentLeads = leads.slice(-5).reverse();
  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Leads" value={stats.totalLeads} icon={<ClipboardList size={24} />} color="blue" />
            <StatCard title="Hot Leads" value={stats.hotLeads} icon={<AlertCircle size={24} />} color="red" />
            <StatCard title="Quoted Leads" value={stats.quotedLeads} icon={<DollarSign size={24} />} color="green" />
            <StatCard title="Total Quote Value" value={`$${stats.totalQuoteValue.toLocaleString()}`} icon={<Briefcase size={24} />} color="purple" />
        </div>
        <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200"><h3 className="text-lg font-medium text-gray-900">Recent Leads</h3></div>
            <div className="p-6">
                {recentLeads.length === 0 ? <p className="text-gray-500 text-center py-4">No recent leads.</p> : 
                <div className="space-y-4">
                    {recentLeads.map(lead => (
                        <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                            <div>
                                <h4 className="font-medium text-gray-900">{lead.customerName}</h4>
                                <p className="text-sm text-gray-500">{lead.leadSource} - {lead.disposition}</p>
                                <p className="text-sm font-medium text-green-600">{lead.dabellaQuote || "No Quote"}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">{lead.phoneNumber}</p>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${lead.quality === 'Hot' ? 'bg-red-100 text-red-800' : lead.quality === 'Warm' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{lead.quality}</span>
                            </div>
                        </div>
                    ))}
                </div>}
            </div>
        </div>
    </div>
  );
}

const ProfessionalLeadsView = ({ leads, onAddLead, onEditLead, onDeleteLead, onRefreshLeads }) => {
    const [selectedLead, setSelectedLead] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDisposition, setFilterDisposition] = useState('All');
    const [filterSource, setFilterSource] = useState('All');
    const [sortBy, setSortBy] = useState('createdDate');
    const [sortOrder, setSortOrder] = useState('desc');

    const getStatusBadge = (status) => {
        const badges = { 
            'New': { bg: 'bg-blue-100', text: 'text-blue-800', icon: Plus },
            'Scheduled': { bg: 'bg-cyan-100', text: 'text-cyan-800', icon: Calendar },
            'Insurance': { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: ShieldCheck },
            'Quoted': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: DollarSign }, 
            'Follow Up': { bg: 'bg-orange-100', text: 'text-orange-800', icon: Clock },
            'Closed Sold': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle }, 
            'Closed Lost': { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle } 
        };
        const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle };
        const Icon = badge.icon;
        return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}><Icon className="w-3 h-3 mr-1" />{status}</span>;
    };
    
    const formatPhone = (phone) => {
        const phoneString = String(phone || '');
        if (!phoneString) return '';
        const cleaned = phoneString.replace(/\D/g, '');
        if (cleaned.length === 10) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        return phoneString;
    };
    
    const formatCurrency = (amount) => {
        const amountString = String(amount || '');
        if (!amountString || amountString === '-' || amountString === '0') return 'N/A';
        return amountString.includes('$') ? amountString : `$${amountString}`;
    };

    const filteredAndSortedLeads = useMemo(() => {
        let filtered = leads.filter(lead => 
            (lead.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || lead.phoneNumber?.toString().includes(searchTerm) || lead.address?.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (filterDisposition === 'All' || lead.disposition === filterDisposition) &&
            (filterSource === 'All' || lead.leadSource === filterSource)
        );

        filtered.sort((a, b) => {
            let aVal, bVal;
            switch (sortBy) {
                case 'name': aVal = a.customerName || ''; bVal = b.customerName || ''; break;
                case 'quote': aVal = parseFloat(a.dabellaQuote?.replace(/[$,]/g, '')) || 0; bVal = parseFloat(b.dabellaQuote?.replace(/[$,]/g, '')) || 0; break;
                default: aVal = new Date(a.createdDate || 0); bVal = new Date(b.createdDate || 0); break;
            }
            if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
            return aVal < bVal ? 1 : -1;
        });

        return filtered;
    }, [leads, searchTerm, filterDisposition, filterSource, sortBy, sortOrder]);

    const dispositionOptions = ['New', 'Scheduled', 'Insurance', 'Quoted', 'Follow Up', 'Closed Sold', 'Closed Lost'];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Lead Management</h2>
                <div className="flex items-center space-x-3">
                    <button onClick={onRefreshLeads} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"><RefreshCw className="w-4 h-4 mr-2" /> Refresh</button>
                    <button onClick={onAddLead} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />Add Lead</button>
                </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative md:col-span-2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input type="text" placeholder="Search by name, phone, or address..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <select value={filterDisposition} onChange={(e) => setFilterDisposition(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="All">All Dispositions</option>
                        {dispositionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"><option value="All">All Sources</option><option>Door Knock</option><option>Referral</option><option>Online</option><option>Advertisement</option><option>Cold Call</option></select>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quote</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Source</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAndSortedLeads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setSelectedLead(lead)}>
                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{lead.customerName || 'N/A'}</div><div className="text-sm text-gray-500">{lead.address}</div></td>
                                <td className="px-6 py-4 whitespace-nowrap"><a href={`tel:${lead.phoneNumber}`} onClick={(e) => e.stopPropagation()} className="hover:text-blue-600 text-sm text-gray-900">{formatPhone(lead.phoneNumber)}</a></td>
                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{formatCurrency(lead.dabellaQuote)}</div></td>
                                <td className="px-6 py-4 whitespace-nowrap">{lead.leadSource}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(lead.disposition)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center space-x-2">
                                        <button onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); }} className="text-blue-600 hover:text-blue-900 p-1 rounded" title="View Details"><Eye className="w-4 h-4" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); onEditLead(lead); }} className="text-orange-600 hover:text-orange-900 p-1 rounded" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredAndSortedLeads.length === 0 && ( <div className="text-center py-12"><AlertCircle className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-sm font-medium text-gray-900">No leads found</h3><p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p></div>)}
            </div>
            {selectedLead && <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} onEdit={() => { onEditLead(selectedLead); setSelectedLead(null); }} onDelete={() => { onDeleteLead(selectedLead.id); setSelectedLead(null); }}/>}
        </div>
    );
};


// --- Modals and Forms ---
function LeadDetailModal({ lead, onClose, onEdit, onDelete }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-40 animate-fade-in">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b flex justify-between items-center"><div><h3 className="text-xl font-semibold text-gray-900 flex items-center"><User className="mr-3 text-blue-600" />{lead.customerName}</h3><p className="text-sm text-gray-500">{lead.address}</p></div><button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button></div>
        <div className="p-6 overflow-y-auto"><div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b"><DetailItem icon={<Phone size={14} className="mr-2" />} label="Phone" value={<a href={`tel:${lead.phoneNumber}`} className="text-blue-600 hover:underline">{lead.phoneNumber}</a>} /><DetailItem icon={<Mail size={14} className="mr-2" />} label="Email" value={<a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">{lead.email}</a>} /><DetailItem icon={<DollarSign size={14} className="mr-2" />} label="Quote" value={<span className="font-bold text-green-700">{lead.dabellaQuote}</span>} /></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b"><DetailItem icon={<Tag size={14} className="mr-2" />} label="Quality" value={<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${lead.quality === 'Hot' ? 'bg-red-100 text-red-800' : lead.quality === 'Warm' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{lead.quality}</span>} /><DetailItem icon={<ClipboardList size={14} className="mr-2" />} label="Disposition" value={lead.disposition} /><DetailItem icon={<Briefcase size={14} className="mr-2" />} label="Lead Source" value={lead.leadSource} /></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pb-6 border-b"><div className="bg-gray-50 p-4 rounded-lg text-center"><Calendar size={24} className="mx-auto text-gray-400 mb-2"/><h4 className="font-semibold text-sm">Appointments</h4><p className="text-xs text-gray-500">Google Calendar integration coming soon.</p></div><div className="bg-gray-50 p-4 rounded-lg text-center"><Mail size={24} className="mx-auto text-gray-400 mb-2"/><h4 className="font-semibold text-sm">Communications</h4><p className="text-xs text-gray-500">SMS/Email integration coming soon.</p></div><div className="bg-gray-50 p-4 rounded-lg text-center"><MapPin size={24} className="mx-auto text-gray-400 mb-2"/><h4 className="font-semibold text-sm">Route Planning</h4><p className="text-xs text-gray-500">Google Maps integration coming soon.</p></div></div><div><h4 className="text-md font-semibold text-gray-800 mb-2">Notes</h4><p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-md whitespace-pre-wrap">{lead.notes || "No notes for this lead."}</p></div></div>
        <div className="flex justify-end space-x-3 p-4 bg-gray-50 border-t"><button onClick={onDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"><Trash2 size={16} className="mr-2"/>Delete</button><button onClick={onEdit} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"><Edit2 size={16} className="mr-2"/>Edit Lead</button></div>
      </div>
    </div>
  );
}

const initialFormData = { customerName: '', address: '', phoneNumber: '', email: '', dabellaQuote: '', quality: 'Cold', notes: '', disposition: 'New', leadSource: 'Door Knock', roofAge: '', roofType: 'Asphalt Shingle', inspectionStatus: 'Not Scheduled', appointmentDate: '', date: '', followupDate: '', leadStatus: '' };
function LeadFormModal({ initialData = initialFormData, onSubmit, onCancel, isEdit = false }) {
    const [formData, setFormData] = useState(initialData);
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData); };
    
    const dispositionOptions = ['New', 'Scheduled', 'Insurance', 'Quoted', 'Follow Up', 'Closed Sold', 'Closed Lost'];

    return <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-40"><div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col"><div className="p-6 border-b flex justify-between items-center"><h3 className="text-lg font-medium text-gray-900">{isEdit ? "Edit Lead" : "Add New Lead"}</h3><button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={24}/></button></div><div className="p-6 overflow-y-auto"><form onSubmit={handleSubmit}>
        <FormSection title="Customer Information"><FormField label="Full Name *"><TextInput name="customerName" value={formData.customerName} onChange={handleChange} required /></FormField><FormField label="Phone Number *"><TextInput name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required /></FormField><FormField label="Email"><TextInput name="email" type="email" value={formData.email} onChange={handleChange} /></FormField><FormField label="Address" fullWidth><TextInput name="address" value={formData.address} onChange={handleChange} /></FormField></FormSection>
        <FormSection title="Lead Details">
            <FormField label="Lead Source"><SelectInput name="leadSource" value={formData.leadSource} onChange={handleChange}><option>Door Knock</option><option>Referral</option><option>Online</option><option>Advertisement</option><option>Cold Call</option></SelectInput></FormField>
            <FormField label="Quality"><SelectInput name="quality" value={formData.quality} onChange={handleChange}><option>Hot</option><option>Warm</option><option>Cold</option></SelectInput></FormField>
            <FormField label="Disposition">
                <SelectInput name="disposition" value={formData.disposition} onChange={handleChange}>
                    {dispositionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </SelectInput>
            </FormField>
        </FormSection>
        <FormSection title="Job & Quote Details"><FormField label="Roof Age"><TextInput name="roofAge" value={formData.roofAge} onChange={handleChange} /></FormField><FormField label="Roof Type"><SelectInput name="roofType" value={formData.roofType} onChange={handleChange}><option>Asphalt Shingle</option><option>Metal</option><option>Tile</option><option>Slate</option><option>Wood</option></SelectInput></FormField><FormField label="Quote Amount"><TextInput name="dabellaQuote" value={formData.dabellaQuote} onChange={handleChange} placeholder="$15,000" /></FormField></FormSection>
        <FormSection title="Notes"><FormField label="Notes" fullWidth><TextareaInput name="notes" value={formData.notes} onChange={handleChange} /></FormField></FormSection>
        <div className="flex justify-end space-x-3 pt-4 border-t mt-6"><button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{isEdit ? "Update Lead" : "Add Lead"}</button></div>
    </form></div></div></div>;
}

function LoginScreen({ onLoginSuccess }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    // IMPORTANT: Change this password to a secure one!
    const CORRECT_PASSWORD = 'IAMBRANDON';

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === CORRECT_PASSWORD) {
            setError('');
            onLoginSuccess();
        } else {
            setError('Incorrect password. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
                <div className="text-center mb-6">
                    <DollarSign className="h-12 w-12 text-blue-600 mx-auto" />
                    <h1 className="text-2xl font-bold text-gray-900 mt-2">Bhotch CRM Login</h1>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    <div>
                        <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}


// --- Main App Component ---
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [editingLead, setEditingLead] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const storedAuth = sessionStorage.getItem('isAuthenticated');
    if (storedAuth === 'true') {
        setIsAuthenticated(true);
    } else {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    if(isAuthenticated) {
        loadLeadsData();
    }
  }, [isAuthenticated]);

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
        await loadLeadsData(true);
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
        } else {
          throw new Error(response.message || 'Failed to delete lead.');
        }
      } catch (error) {
        addNotification(`Error deleting lead: ${error.message}`, 'error');
      }
    }
  };
  
  const getDashboardStats = () => ({
    totalLeads: leads.length,
    hotLeads: leads.filter(l => l.quality === 'Hot').length,
    quotedLeads: leads.filter(l => l.disposition === 'Quoted').length,
    totalQuoteValue: leads.reduce((sum, lead) => sum + (parseFloat(String(lead.dabellaQuote).replace(/[$,]/g, '')) || 0), 0)
  });
  
  const handleLoginSuccess = () => {
    sessionStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

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
        {currentView === 'leads' && <ProfessionalLeadsView leads={leads} onAddLead={() => setShowAddForm(true)} onEditLead={setEditingLead} onDeleteLead={handleDeleteLead} onRefreshLeads={() => loadLeadsData(true)} />}
      </main>

      {showAddForm && <LeadFormModal onSubmit={handleAddLead} onCancel={() => setShowAddForm(false)} />}
      {editingLead && <LeadFormModal initialData={editingLead} onSubmit={handleUpdateLead} onCancel={() => setEditingLead(null)} isEdit={true} />}
    </div>
  );
}
export default App;

