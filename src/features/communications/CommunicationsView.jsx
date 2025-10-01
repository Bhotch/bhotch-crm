import React, { useState, useMemo } from 'react';
import { Search, Phone, MessageSquare, Mail, PhoneCall, MessageCircle, Send, Clock, TrendingUp, User, MapPin, FileText, X, ChevronRight, History, BarChart3, Filter, SendHorizontal, MessageCircleReply, UserX, CalendarClock, CheckCircle2 } from 'lucide-react';

export default function CommunicationsView({ leads, jobCounts, communications = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [activeAction, setActiveAction] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [messageContent, setMessageContent] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [quickOutcome, setQuickOutcome] = useState('');

  // Combine leads and job counts into unified customer list
  const allCustomers = useMemo(() => {
    const leadCustomers = leads.map(lead => ({
      id: `lead-${lead.id}`,
      type: 'lead',
      name: lead.customerName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.name || 'Unknown',
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
      name: job.customerName || `${job.firstName || ''} ${job.lastName || ''}`.trim() || 'Unknown',
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
    setQuickOutcome('');
  };

  // Quick outcome options for SMS
  const smsOutcomes = [
    { id: 'sent', label: 'Sent SMS', icon: SendHorizontal, color: 'green' },
    { id: 'received', label: 'Received SMS', icon: MessageCircleReply, color: 'teal' },
    { id: 'follow-up', label: 'Follow-up Needed', icon: CalendarClock, color: 'orange' },
    { id: 'not-interested', label: 'Not Interested', icon: UserX, color: 'red' }
  ];

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
    if (!messageContent.trim() || !quickOutcome) return;
    const phoneNumber = selectedCustomer.phone.replace(/\D/g, '');

    // Log the communication (you can pass this to parent component via props)
    console.log({
      customerId: selectedCustomer.id,
      type: 'sms',
      outcome: quickOutcome,
      notes: messageContent,
      timestamp: new Date().toISOString()
    });

    // Open Google Voice if sending SMS
    if (quickOutcome === 'sent') {
      window.open(`https://voice.google.com/u/0/messages?itemId=t.%2B1${phoneNumber}`, '_blank');
    }

    setMessageContent('');
    setQuickOutcome('');
    setActiveAction(null);
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
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-4 lg:gap-6">
      {/* Left Panel - Customer Search */}
      <div className="w-full lg:w-1/3 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col max-h-[40vh] lg:max-h-none">
        {/* Search Header */}
        <div className="p-3 lg:p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-3 lg:mb-4 flex items-center">
            <MessageCircle className="w-5 h-5 lg:w-6 lg:h-6 mr-2 text-blue-600" />
            <span className="hidden sm:inline">Communications Hub</span>
            <span className="sm:hidden">Comms</span>
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
          <div className="flex gap-1 lg:gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`flex-1 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <Filter className="w-3 h-3 lg:w-4 lg:h-4 inline mr-1" />
              <span className="hidden sm:inline">All ({allCustomers.length})</span>
              <span className="sm:hidden">{allCustomers.length}</span>
            </button>
            <button
              onClick={() => setFilterType('lead')}
              className={`flex-1 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                filterType === 'lead'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <span className="hidden sm:inline">Leads ({leads.length})</span>
              <span className="sm:hidden">L{leads.length}</span>
            </button>
            <button
              onClick={() => setFilterType('jobcount')}
              className={`flex-1 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                filterType === 'jobcount'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <span className="hidden sm:inline">Jobs ({jobCounts.length})</span>
              <span className="sm:hidden">J{jobCounts.length}</span>
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
          <div className="p-3 lg:p-4 border-b bg-gray-50">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
              <button
                onClick={() => handleActionClick('call')}
                disabled={!selectedCustomer.phone}
                className={`py-2 lg:py-3 px-2 lg:px-4 rounded-lg text-xs lg:text-sm font-medium transition-all flex flex-col lg:flex-row items-center justify-center gap-1 lg:gap-2 shadow-sm ${
                  activeAction === 'call'
                    ? 'bg-blue-600 text-white shadow-lg scale-105 ring-2 ring-blue-300'
                    : 'bg-white text-gray-700 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                <PhoneCall className="w-4 h-4 lg:w-5 lg:h-5" />
                <span>📞 Call</span>
              </button>
              <button
                onClick={() => handleActionClick('sms')}
                disabled={!selectedCustomer.phone}
                className={`py-2 lg:py-3 px-2 lg:px-4 rounded-lg text-xs lg:text-sm font-medium transition-all flex flex-col lg:flex-row items-center justify-center gap-1 lg:gap-2 shadow-sm ${
                  activeAction === 'sms'
                    ? 'bg-green-600 text-white shadow-lg scale-105 ring-2 ring-green-300'
                    : 'bg-white text-gray-700 border-2 border-green-200 hover:border-green-400 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                <MessageCircle className="w-4 h-4 lg:w-5 lg:h-5" />
                <span>💬 SMS</span>
              </button>
              <button
                onClick={() => handleActionClick('email')}
                disabled={!selectedCustomer.email}
                className={`py-2 lg:py-3 px-2 lg:px-4 rounded-lg text-xs lg:text-sm font-medium transition-all flex flex-col lg:flex-row items-center justify-center gap-1 lg:gap-2 shadow-sm ${
                  activeAction === 'email'
                    ? 'bg-purple-600 text-white shadow-lg scale-105 ring-2 ring-purple-300'
                    : 'bg-white text-gray-700 border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                <Mail className="w-4 h-4 lg:w-5 lg:h-5" />
                <span>✉️ Email</span>
              </button>
            </div>
          </div>

          {/* Communication Interface */}
          {activeAction && (
            <div className="p-3 lg:p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              {activeAction === 'sms' && (
                <div className="space-y-4">
                  <h3 className="text-sm lg:text-base font-semibold text-gray-900 flex items-center">
                    <MessageCircle className="w-4 h-4 lg:w-5 lg:h-5 mr-2 text-green-600" />
                    💬 Log SMS Communication
                  </h3>

                  {/* Quick Outcome Selection */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Quick Outcome <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {smsOutcomes.map((outcome) => {
                        const Icon = outcome.icon;
                        const isSelected = quickOutcome === outcome.id;
                        const colorClasses = {
                          green: isSelected
                            ? 'bg-green-600 text-white ring-2 ring-green-300 shadow-lg scale-105'
                            : 'bg-white text-gray-700 border-2 border-green-200 hover:border-green-400 hover:bg-green-50',
                          teal: isSelected
                            ? 'bg-teal-600 text-white ring-2 ring-teal-300 shadow-lg scale-105'
                            : 'bg-white text-gray-700 border-2 border-teal-200 hover:border-teal-400 hover:bg-teal-50',
                          orange: isSelected
                            ? 'bg-orange-600 text-white ring-2 ring-orange-300 shadow-lg scale-105'
                            : 'bg-white text-gray-700 border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50',
                          red: isSelected
                            ? 'bg-red-600 text-white ring-2 ring-red-300 shadow-lg scale-105'
                            : 'bg-white text-gray-700 border-2 border-red-200 hover:border-red-400 hover:bg-red-50'
                        };

                        const outcomeIcons = {
                          sent: '📤',
                          received: '📥',
                          'follow-up': '📅',
                          'not-interested': '🚫'
                        };

                        return (
                          <button
                            key={outcome.id}
                            onClick={() => setQuickOutcome(outcome.id)}
                            className={`py-3 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${colorClasses[outcome.color]}`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="hidden lg:inline">{outcomeIcons[outcome.id]} {outcome.label}</span>
                            <span className="lg:hidden">{outcomeIcons[outcome.id]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Message Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message Content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder="Enter the SMS message content or notes..."
                      className="w-full p-3 text-sm lg:text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                      rows="4"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSendSMS}
                    disabled={!messageContent.trim() || !quickOutcome}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 text-sm lg:text-base rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {quickOutcome === 'sent' ? '✓ Log & Open Google Voice' : '✓ Log SMS Communication'}
                  </button>

                  {(!messageContent.trim() || !quickOutcome) && (
                    <p className="text-xs text-gray-500 text-center">
                      Please select an outcome and enter message content
                    </p>
                  )}
                </div>
              )}

              {activeAction === 'email' && (
                <div className="space-y-4">
                  <h3 className="text-sm lg:text-base font-semibold text-gray-900 flex items-center">
                    <Mail className="w-4 h-4 lg:w-5 lg:h-5 mr-2 text-purple-600" />
                    ✉️ Compose Email
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To: <span className="text-blue-600 font-semibold">{selectedCustomer.email}</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Enter email subject..."
                      className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Enter email message..."
                      className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                      rows="5"
                    />
                  </div>
                  <button
                    onClick={handleSendEmail}
                    disabled={!emailSubject.trim() || !emailBody.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    📧 Open Email Client
                  </button>
                </div>
              )}

              {activeAction === 'call' && (
                <div className="text-center py-8 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border-2 border-blue-200">
                  <div className="relative inline-block mb-4">
                    <PhoneCall className="w-16 h-16 text-blue-600 animate-pulse" />
                    <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-2">
                      <span className="text-white text-xl">📞</span>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-gray-800 mb-2">Google Voice Call Window Opened</p>
                  <p className="text-blue-600 font-medium text-lg mb-1">{selectedCustomer.phone}</p>
                  <p className="text-sm text-gray-600">{selectedCustomer.name}</p>
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-xs text-gray-500">Complete the call in the Google Voice window</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Communication History */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <History className="w-5 h-5 mr-2 text-gray-600" />
                📜 Communication History
              </h3>
              {customerHistory.length > 0 && (
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                  {customerHistory.length} interaction{customerHistory.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {customerHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="relative">
                  <BarChart3 className="w-20 h-20 mb-4 opacity-30" />
                  <div className="absolute -bottom-1 -right-1 text-4xl">💬</div>
                </div>
                <p className="text-lg font-semibold text-gray-600 mb-2">No communication history yet</p>
                <p className="text-sm text-gray-500">Start by making a call, sending an SMS, or email</p>
              </div>
            ) : (
              <div className="space-y-3">
                {customerHistory.map((comm, index) => {
                  const outcomeConfig = {
                    'sent': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: '📤' },
                    'received': { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', icon: '📥' },
                    'follow-up': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: '📅' },
                    'not-interested': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: '🚫' },
                    'Completed': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: '✅' },
                    'No Answer': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: '📵' }
                  };

                  const typeConfig = {
                    'call': { icon: PhoneCall, color: 'text-blue-600', emoji: '📞', bg: 'bg-blue-50' },
                    'sms': { icon: MessageSquare, color: 'text-green-600', emoji: '💬', bg: 'bg-green-50' },
                    'email': { icon: Mail, color: 'text-purple-600', emoji: '✉️', bg: 'bg-purple-50' }
                  };

                  const TypeIcon = typeConfig[comm.type]?.icon || MessageSquare;
                  const config = typeConfig[comm.type] || typeConfig['sms'];

                  return (
                    <div
                      key={index}
                      className={`${config.bg} border-2 ${comm.outcome && outcomeConfig[comm.outcome] ? outcomeConfig[comm.outcome].border : 'border-gray-200'} rounded-xl p-4 hover:shadow-lg transition-all hover:scale-[1.02]`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 ${config.bg} rounded-lg border border-gray-200`}>
                            <TypeIcon className={`w-5 h-5 ${config.color}`} />
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 capitalize flex items-center gap-1">
                              {config.emoji} {comm.type}
                            </span>
                            {comm.outcome && outcomeConfig[comm.outcome] && (
                              <span className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 mt-1 ${outcomeConfig[comm.outcome].bg} ${outcomeConfig[comm.outcome].text} border ${outcomeConfig[comm.outcome].border} font-medium`}>
                                {outcomeConfig[comm.outcome].icon} {comm.outcome}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center text-xs text-gray-600 bg-white px-2 py-1 rounded-full border border-gray-200">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(comm.timestamp).toLocaleDateString()} {new Date(comm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      {comm.notes && (
                        <div className="bg-white border border-gray-200 rounded-lg p-3 mt-2">
                          <p className="text-sm text-gray-700 leading-relaxed">{comm.notes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg shadow-sm border-2 border-dashed border-gray-300 flex items-center justify-center">
          <div className="text-center text-gray-500 p-8 max-w-md">
            <div className="relative inline-block mb-6">
              <MessageCircle className="w-32 h-32 opacity-20" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl">
                💬
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-700">👋 Select a Customer</h3>
            <p className="text-lg text-gray-600 mb-4">Choose a customer from the list to:</p>
            <div className="grid grid-cols-1 gap-2 text-left bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-blue-500">📞</span>
                <span className="text-gray-700">Make phone calls via Google Voice</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-500">💬</span>
                <span className="text-gray-700">Send and log SMS messages</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-purple-500">✉️</span>
                <span className="text-gray-700">Compose and send emails</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-orange-500">📜</span>
                <span className="text-gray-700">View communication history</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
