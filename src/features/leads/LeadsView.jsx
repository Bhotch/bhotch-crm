import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Edit2, Eye, RefreshCw, XCircle, CheckCircle, Clock, AlertCircle, DollarSign, ShieldCheck, Search, Calendar } from 'lucide-react';

function LeadsView({ leads, onAddLead, onEditLead, onDeleteLead, onRefreshLeads, onSelectLead }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDisposition, setFilterDisposition] = useState('All');
    const [filterSource, setFilterSource] = useState('All');

    const getStatusBadge = useCallback((status) => {
        const badges = { 'New': { bg: 'bg-blue-100', text: 'text-blue-800', icon: Plus },'Scheduled': { bg: 'bg-cyan-100', text: 'text-cyan-800', icon: Calendar },'Insurance': { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: ShieldCheck },'Quoted': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: DollarSign }, 'Follow Up': { bg: 'bg-orange-100', text: 'text-orange-800', icon: Clock },'Closed Sold': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle }, 'Closed Lost': { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle } };
        const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle };
        const Icon = badge.icon;
        return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}><Icon className="w-3 h-3 mr-1" />{status}</span>;
    }, []);

    const formatPhone = useCallback((phone) => {
        const phoneString = String(phone || '');
        if (!phoneString) return '';
        const cleaned = phoneString.replace(/\D/g, '');
        if (cleaned.length === 10) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        return phoneString;
    }, []);

    const formatCurrency = useCallback((amount) => {
        const amountString = String(amount || '');
        if (!amountString || amountString === '-' || amountString === '0') return 'N/A';
        return amountString.includes('$') ? amountString : `$${amountString}`;
    }, []);

    const filteredLeads = useMemo(() => {
        return leads.filter(lead =>
            (lead.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || lead.phoneNumber?.toString().includes(searchTerm) || lead.address?.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (filterDisposition === 'All' || lead.disposition === filterDisposition) &&
            (filterSource === 'All' || lead.leadSource === filterSource)
        );
    }, [leads, searchTerm, filterDisposition, filterSource]);

    const dispositionOptions = useMemo(() => ['New', 'Scheduled', 'Insurance', 'Quoted', 'Follow Up', 'Closed Sold', 'Closed Lost'], []);

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
                    <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="All">Lead Source</option>
                        <option>Door Knock</option><option>Rime</option><option>Adverta</option><option>Referral</option><option>DaBella</option>
                    </select>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quote</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredLeads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => onSelectLead(lead)}>
                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{lead.customerName || 'N/A'}</div></td>
                                <td className="px-6 py-4 whitespace-nowrap"><a href={`tel:${lead.phoneNumber}`} onClick={(e) => e.stopPropagation()} className="hover:text-blue-600 text-sm text-gray-900">{formatPhone(lead.phoneNumber)}</a></td>
                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{formatCurrency(lead.dabellaQuote)}</div></td>
                                <td className="px-6 py-4 whitespace-nowrap">{lead.leadSource}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(lead.disposition)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center space-x-2">
                                        <button onClick={(e) => { e.stopPropagation(); onSelectLead(lead); }} className="text-blue-600 hover:text-blue-900 p-1 rounded" title="View Details"><Eye className="w-4 h-4" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); onEditLead(lead); }} className="text-orange-600 hover:text-orange-900 p-1 rounded" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredLeads.length === 0 && (
                     <div className="text-center py-12">
                        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No leads found</h3>
                        <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LeadsView;