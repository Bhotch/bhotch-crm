import React, { useState, useMemo } from 'react';
import { Search, Phone, MessageSquare, Mail, PhoneCall, MessageCircle, Send, Clock, TrendingUp, User, MapPin, FileText, X, ChevronRight, History, BarChart3, Filter } from 'lucide-react';

export default function CommunicationsView({ leads, jobCounts, communications = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [activeAction, setActiveAction] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [messageContent, setMessageContent] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Combine leads and job counts into unified customer list
  const allCustomers = useMemo(() => {
    const leadCustomers = leads.map(lead => ({
      id: `lead-${lead.id}`,
      type: 'lead',
      name: lead.name,
      address: lead.address,
      phone: lead.phone,
      email: lead.email || '',
      notes: lead.notes || '',
      quality: lead.quality,
      disposition: lead.disposition,
      lastContact: lead.lastContact || null,
      source: 'Bhotchleads'
    }));

    const jobCountCustomers = jobCounts.map(job => ({
      id: `job-${job.id}`,
      type: 'jobcount',
      name: job.customerName,
      address: job.address,
      phone: job.phone || '',
      email: job.email || '',
      notes: job.notes || '',
      sqFt: job.sqFt,
      status: job.status,
      source: 'Job Count'
    }));

    return [...leadCustomers, ...jobCountCustomers];
  }, [leads, jobCounts]);

  // Filter customers based on search and filter type
  const filteredCustomers = useMemo(() => {
    let filtered = allCustomers;

    if (filterType !== 'all') {
      filtered = filtered.filter(c => c.type === filterType);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(term) ||
        c.address?.toLowerCase().includes(term) ||
        c.phone?.includes(term) ||
        c.email?.toLowerCase().includes(term)
      );
    }

    return filtered.sort((a, b) => {
      const aContact = a.lastContact ? new Date(a.lastContact) : new Date(0);
      const bContact = b.lastContact ? new Date(b.lastContact) : new Date(0);
      return bContact - aContact;
    });
  }, [allCustomers, searchTerm, filterType]);

  // Get communication history for selected customer
  const customerHistory = useMemo(() => {
    if (!selectedCustomer) return [];
    return communications
      .filter(c => c.customerId === selectedCustomer.id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [selectedCustomer, communications]);

  // Calculate stats
  const stats = useMemo(() => {
    const history = selectedCustomer ? customerHistory : communications;
    return {
      totalCalls: history.filter(c => c.type === 'call').length,
      totalSMS: history.filter(c => c.type === 'sms').length,
      totalEmails: history.filter(c => c.type === 'email').length,
      lastContact: history.length > 0 ? history[0].timestamp : null
    };
  }, [selectedCustomer, customerHistory, communications]);

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setActiveAction(null);
    setMessageContent('');
    setEmailSubject('');
    setEmailBody('');
  };

  const handleActionClick = (action) => {
    if (activeAction === action) {
      setActiveAction(null);
    } else {
      setActiveAction(action);
      if (action === 'call') {
        // Open Google Voice dialer
        const phoneNumber = selectedCustomer.phone.replace(/\D/g, '');
        window.open(`https://voice.google.com/u/0/calls?a=nc,%2B1${phoneNumber}`, '_blank');
      }
    }
  };

  const handleSendSMS = () => {
    if (!messageContent.trim()) return;
    const phoneNumber = selectedCustomer.phone.replace(/\D/g, '');
    window.open(`https://voice.google.com/u/0/messages?itemId=t.%2B1${phoneNumber}`, '_blank');
    setMessageContent('');
  };

  const handleSendEmail = () => {
    if (!emailSubject.trim() || !emailBody.trim()) return;
    const mailtoLink = `mailto:${selectedCustomer.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoLink;
    setEmailSubject('');
    setEmailBody('');
  };

  const getQualityColor = (quality) => {
    const colors = {
      'Hot': 'bg-red-100 text-red-800 border-red-300',
      'Warm': 'bg-orange-100 text-orange-800 border-orange-300',
      'Cold': 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return colors[quality] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6">
      {/* Left Panel - Customer Search */}
      <div className="w-1/3 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
        {/* Search Header */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <MessageCircle className="w-6 h-6 mr-2 text-blue-600" />
            Communications Hub
          </h2>

          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search customers by name, address, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <Filter className="w-4 h-4 inline mr-1" />
              All ({allCustomers.length})
            </button>
            <button
              onClick={() => setFilterType('lead')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                filterType === 'lead'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Leads ({leads.length})
            </button>
            <button
              onClick={() => setFilterType('jobcount')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                filterType === 'jobcount'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Jobs ({jobCounts.length})
            </button>
          </div>
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto">
          {filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
              <Search className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No customers found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredCustomers.map(customer => (
              <div
                key={customer.id}
                onClick={() => handleCustomerSelect(customer)}
                className={`p-4 border-b hover:bg-blue-50 cursor-pointer transition-all ${
                  selectedCustomer?.id === customer.id ? 'bg-blue-100 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <User className="w-4 h-4 mr-2 text-gray-500" />
                      {customer.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        customer.type === 'lead'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {customer.source}
                      </span>
                      {customer.quality && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getQualityColor(customer.quality)}`}>
                          {customer.quality}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                    selectedCustomer?.id === customer.id ? 'rotate-90' : ''
                  }`} />
                </div>

                <div className="space-y-1 text-sm text-gray-600">
                  {customer.phone && (
                    <div className="flex items-center">
                      <Phone className="w-3 h-3 mr-2 text-gray-400" />
                      {customer.phone}
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-2 text-gray-400" />
                      {customer.address}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Customer Details & Communication */}
      {selectedCustomer ? (
        <div className="flex-1 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
          {/* Customer Header */}
          <div className="p-6 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedCustomer.name}</h2>
                <p className="text-gray-600 flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  {selectedCustomer.address}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <PhoneCall className="w-5 h-5 text-blue-600" />
                  <span className="text-2xl font-bold text-gray-900">{stats.totalCalls}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Calls</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  <span className="text-2xl font-bold text-gray-900">{stats.totalSMS}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">SMS</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-purple-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <Mail className="w-5 h-5 text-purple-600" />
                  <span className="text-2xl font-bold text-gray-900">{stats.totalEmails}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Emails</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-orange-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  <span className="text-2xl font-bold text-gray-900">{customerHistory.length}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Total</p>
              </div>
            </div>

            {/* Notes Section */}
            {selectedCustomer.notes && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-start">
                  <FileText className="w-4 h-4 mr-2 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Notes</p>
                    <p className="text-sm text-gray-600">{selectedCustomer.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex gap-3">
              <button
                onClick={() => handleActionClick('call')}
                disabled={!selectedCustomer.phone}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  activeAction === 'call'
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                <PhoneCall className="w-5 h-5" />
                Call
              </button>
              <button
                onClick={() => handleActionClick('sms')}
                disabled={!selectedCustomer.phone}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  activeAction === 'sms'
                    ? 'bg-green-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 border-2 border-green-200 hover:border-green-400 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                SMS
              </button>
              <button
                onClick={() => handleActionClick('email')}
                disabled={!selectedCustomer.email}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  activeAction === 'email'
                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                <Mail className="w-5 h-5" />
                Email
              </button>
            </div>
          </div>

          {/* Communication Interface */}
          {activeAction && (
            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              {activeAction === 'sms' && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2 text-green-600" />
                    Send SMS via Google Voice
                  </h3>
                  <textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Type your message here..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                    rows="3"
                  />
                  <button
                    onClick={handleSendSMS}
                    disabled={!messageContent.trim()}
                    className="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Open Google Voice SMS
                  </button>
                </div>
              )}

              {activeAction === 'email' && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <Mail className="w-5 h-5 mr-2 text-purple-600" />
                    Send Email
                  </h3>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Subject"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Email body..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                    rows="4"
                  />
                  <button
                    onClick={handleSendEmail}
                    disabled={!emailSubject.trim() || !emailBody.trim()}
                    className="w-full bg-purple-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Open Email Client
                  </button>
                </div>
              )}

              {activeAction === 'call' && (
                <div className="text-center py-4">
                  <PhoneCall className="w-12 h-12 mx-auto mb-3 text-blue-600 animate-pulse" />
                  <p className="text-gray-600">Google Voice call window opened</p>
                  <p className="text-sm text-gray-500 mt-1">Calling {selectedCustomer.phone}</p>
                </div>
              )}
            </div>
          )}

          {/* Communication History */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <History className="w-5 h-5 mr-2 text-gray-600" />
                Communication History
              </h3>
              {customerHistory.length > 0 && (
                <span className="text-sm text-gray-500">{customerHistory.length} interactions</span>
              )}
            </div>

            {customerHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <BarChart3 className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">No communication history</p>
                <p className="text-sm">Start by making a call, sending an SMS, or email</p>
              </div>
            ) : (
              <div className="space-y-3">
                {customerHistory.map((comm, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {comm.type === 'call' && <PhoneCall className="w-4 h-4 text-blue-600" />}
                        {comm.type === 'sms' && <MessageSquare className="w-4 h-4 text-green-600" />}
                        {comm.type === 'email' && <Mail className="w-4 h-4 text-purple-600" />}
                        <span className="font-medium text-gray-900 capitalize">{comm.type}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(comm.timestamp).toLocaleString()}
                      </div>
                    </div>
                    {comm.notes && (
                      <p className="text-sm text-gray-600 mt-2 pl-6">{comm.notes}</p>
                    )}
                    {comm.outcome && (
                      <div className="mt-2 pl-6">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          comm.outcome === 'Completed' ? 'bg-green-100 text-green-700' :
                          comm.outcome === 'No Answer' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {comm.outcome}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-lg shadow-sm border flex items-center justify-center">
          <div className="text-center text-gray-400 p-8">
            <MessageCircle className="w-24 h-24 mx-auto mb-6 opacity-20" />
            <h3 className="text-2xl font-bold mb-2">Select a Customer</h3>
            <p className="text-lg">Choose a customer from the left to view details and communicate</p>
          </div>
        </div>
      )}
    </div>
  );
}
