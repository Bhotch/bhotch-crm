import React, { useState, useMemo } from 'react';
import { Search, Phone, MessageSquare, Mail, PhoneCall, MessageCircle, Send, Clock, TrendingUp, User, MapPin, FileText, X, ChevronRight, History, BarChart3, Filter, SendHorizontal, MessageCircleReply, UserX, CalendarClock, CheckCircle2, PhoneOff, Voicemail, AlertCircle, MailOpen, DollarSign } from 'lucide-react';

const GOOGLE_VOICE_EMAIL = 'brandon@rimehq.net';
const GOOGLE_VOICE_NUMBER = '801-228-0678';

export default function EnhancedCommunicationsView({ leads, jobCounts, communications = [], onLogCommunication }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [activeAction, setActiveAction] = useState(null);
  const [filterType, setFilterType] = useState('all');

  // Form states
  const [messageContent, setMessageContent] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [selectedDisposition, setSelectedDisposition] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // SMS Dispositions
  const smsDispositions = [
    { id: 'Sent SMS', label: 'Sent SMS', icon: SendHorizontal, color: 'green', emoji: '📤' },
    { id: 'Received SMS', label: 'Received SMS', icon: MessageCircleReply, color: 'teal', emoji: '📥' },
    { id: 'SMS Follow-up Needed', label: 'Follow-up Needed', icon: CalendarClock, color: 'orange', emoji: '📅' },
    { id: 'SMS Not Interested', label: 'Not Interested', icon: UserX, color: 'red', emoji: '🚫' }
  ];

  // Call Dispositions
  const callDispositions = [
    { id: 'Spoke with Customer', label: 'Spoke with Customer', icon: CheckCircle2, color: 'green', emoji: '✅' },
    { id: 'No Answer', label: 'No Answer', icon: PhoneOff, color: 'yellow', emoji: '📵' },
    { id: 'Left Voicemail', label: 'Left Voicemail', icon: Voicemail, color: 'blue', emoji: '📞' },
    { id: 'Call Follow-up Needed', label: 'Follow-up Needed', icon: CalendarClock, color: 'orange', emoji: '📅' },
    { id: 'Call Not Interested', label: 'Not Interested', icon: UserX, color: 'red', emoji: '🚫' }
  ];

  // Email Dispositions
  const emailDispositions = [
    { id: 'Email Sent', label: 'Email Sent', icon: Send, color: 'green', emoji: '📧' },
    { id: 'Email Received', label: 'Email Received', icon: MailOpen, color: 'teal', emoji: '📨' },
    { id: 'Email Follow-up Needed', label: 'Follow-up Needed', icon: CalendarClock, color: 'orange', emoji: '📅' },
    { id: 'Email Not Interested', label: 'Not Interested', icon: UserX, color: 'red', emoji: '🚫' },
    { id: 'Email Bounced', label: 'Email Bounced', icon: AlertCircle, color: 'gray', emoji: '⚠️' }
  ];

  // Combine leads and job counts into unified customer list
  const allCustomers = useMemo(() => {
    const leadCustomers = (leads || [])
      .filter(lead => lead != null)
      .map((lead, index) => ({
        id: lead.id,
        type: 'lead',
        name: lead.customerName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.name || 'Unknown',
        firstName: lead.firstName,
        lastName: lead.lastName,
        address: lead.address || '',
        phone: lead.phoneNumber || lead.phone || '',
        email: lead.email || '',
        notes: lead.notes || '',
        quality: lead.quality,
        disposition: lead.disposition,
        lastContact: lead.lastContactDate || lead.lastContact || null,
        source: 'Bhotchleads',
        // Additional details
        roofAge: lead.roofAge,
        roofType: lead.roofType,
        sqft: lead.sqft,
        dabellaQuote: lead.dabellaQuote,
        leadSource: lead.leadSource,
        status: lead.status,
        uniqueKey: `lead-${lead.id || index}-${index}`
      }));

    const jobCountCustomers = (jobCounts || [])
      .filter(job => job != null)
      .map((job, index) => ({
        id: job.id,
        type: 'jobcount',
        name: job.customerName || `${job.firstName || ''} ${job.lastName || ''}`.trim() || 'Unknown',
        firstName: job.firstName,
        lastName: job.lastName,
        address: job.address || '',
        phone: job.phoneNumber || job.phone || '',
        email: job.email || '',
        notes: job.notes || '',
        sqFt: job.sqFt,
        status: job.status,
        source: 'Job Count',
        uniqueKey: `job-${job.id || index}-${index}`
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
      .filter(c => c.leadId === selectedCustomer.id || c.customerId === selectedCustomer.id)
      .sort((a, b) => new Date(b.timestamp || b.dateTime) - new Date(a.timestamp || a.dateTime));
  }, [selectedCustomer, communications]);

  // Calculate stats
  const stats = useMemo(() => {
    const history = selectedCustomer ? customerHistory : communications;
    return {
      totalCalls: history.filter(c => c.type === 'call' || c.communicationType === 'Call').length,
      totalSMS: history.filter(c => c.type === 'sms' || c.communicationType === 'SMS').length,
      totalEmails: history.filter(c => c.type === 'email' || c.communicationType === 'Email').length,
      lastContact: history.length > 0 ? (history[0].timestamp || history[0].dateTime) : null
    };
  }, [selectedCustomer, customerHistory, communications]);

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setActiveAction(null);
    resetForm();
  };

  const resetForm = () => {
    setMessageContent('');
    setEmailSubject('');
    setEmailBody('');
    setSelectedDisposition('');
    setFollowUpDate('');
  };

  const handleActionClick = (action) => {
    if (activeAction === action) {
      setActiveAction(null);
    } else {
      setActiveAction(action);
      resetForm();

      if (action === 'call') {
        // Open Google Voice dialer
        const phoneNumber = selectedCustomer.phone ? selectedCustomer.phone.replace(/\D/g, '') : '';
        if (phoneNumber) {
          window.open(`https://voice.google.com/u/0/calls?a=nc,%2B1${phoneNumber}`, '_blank');
        } else {
          window.open('https://voice.google.com/u/0/calls', '_blank');
        }
      } else if (action === 'sms') {
        // Open Google Voice SMS
        const phoneNumber = selectedCustomer.phone ? selectedCustomer.phone.replace(/\D/g, '') : '';
        if (phoneNumber) {
          window.open(`https://voice.google.com/u/0/messages?a=nc,%2B1${phoneNumber}`, '_blank');
        } else {
          window.open('https://voice.google.com/u/0/messages', '_blank');
        }
      }
    }
  };

  const handleLogCommunication = async (type) => {
    if (!selectedDisposition) {
      alert('Please select a disposition');
      return;
    }

    const communicationData = {
      leadId: selectedCustomer.id,
      customerId: selectedCustomer.id,
      type: type,
      communicationType: type.charAt(0).toUpperCase() + type.slice(1),
      disposition: selectedDisposition,
      outcome: selectedDisposition,
      notes: messageContent || emailBody || '',
      message_content: messageContent || emailBody || '',
      subject: emailSubject || null,
      phone_number: selectedCustomer.phone || null,
      email_to: type === 'email' ? selectedCustomer.email : null,
      email_from: type === 'email' ? GOOGLE_VOICE_EMAIL : null,
      google_voice_account: GOOGLE_VOICE_EMAIL,
      google_voice_number: GOOGLE_VOICE_NUMBER,
      follow_up_date: followUpDate || null,
      timestamp: new Date().toISOString(),
      dateTime: new Date().toISOString(),
      direction: type === 'sms' && selectedDisposition === 'Received SMS' ? 'inbound' : 'outbound'
    };

    try {
      // Call the parent's log communication function
      if (onLogCommunication) {
        await onLogCommunication(communicationData);
      }

      // If SMS sent, open Google Voice
      if (type === 'sms' && selectedDisposition === 'Sent SMS') {
        const phoneNumber = selectedCustomer.phone ? selectedCustomer.phone.replace(/\D/g, '') : '';
        if (phoneNumber) {
          window.open(`https://voice.google.com/u/0/messages?a=nc,%2B1${phoneNumber}`, '_blank');
        }
      }

      // If email sent, open mailto
      if (type === 'email' && selectedDisposition === 'Email Sent') {
        const mailtoLink = `mailto:${selectedCustomer.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        window.location.href = mailtoLink;
      }

      resetForm();
      setActiveAction(null);

      alert('Communication logged successfully!');
    } catch (error) {
      console.error('Error logging communication:', error);
      alert('Failed to log communication. Please try again.');
    }
  };

  const getDispositions = () => {
    if (activeAction === 'sms') return smsDispositions;
    if (activeAction === 'call') return callDispositions;
    if (activeAction === 'email') return emailDispositions;
    return [];
  };

  const getQualityColor = (quality) => {
    const colors = {
      'Hot': 'bg-red-100 text-red-800 border-red-300',
      'Warm': 'bg-orange-100 text-orange-800 border-orange-300',
      'Cold': 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return colors[quality] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const dispositions = getDispositions();
  const requiresFollowUp = selectedDisposition?.includes('Follow-up');

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-4 lg:gap-6">
      {/* Left Panel - Customer Search & Selection */}
      <div className="w-full lg:w-1/3 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col max-h-[40vh] lg:max-h-none">
        {/* Search Header */}
        <div className="p-3 lg:p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-3 lg:mb-4 flex items-center">
            <MessageCircle className="w-5 h-5 lg:w-6 lg:h-6 mr-2 text-blue-600" />
            Communication Center
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

          {/* Google Voice Info Banner */}
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-2 mb-3">
            <div className="text-xs text-blue-800 font-semibold">Google Voice Account</div>
            <div className="text-xs text-blue-600">{GOOGLE_VOICE_EMAIL}</div>
            <div className="text-xs text-blue-600 font-mono">{GOOGLE_VOICE_NUMBER}</div>
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
              All ({allCustomers.length})
            </button>
            <button
              onClick={() => setFilterType('lead')}
              className={`flex-1 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                filterType === 'lead'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Leads ({leads.length})
            </button>
            <button
              onClick={() => setFilterType('jobcount')}
              className={`flex-1 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${
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
                key={customer.uniqueKey}
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
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                  {customer.email && (
                    <div className="flex items-center truncate">
                      <Mail className="w-3 h-3 mr-2 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-2 text-gray-400" />
                      <span className="line-clamp-1">{customer.address}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Customer Details & Communication Interface */}
      {selectedCustomer ? (
        <div className="flex-1 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
          {/* Customer Header with Full Details */}
          <div className="p-6 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedCustomer.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700 mt-3">
                  {selectedCustomer.address && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                      {selectedCustomer.address}
                    </div>
                  )}
                  {selectedCustomer.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-500" />
                      {selectedCustomer.phone}
                    </div>
                  )}
                  {selectedCustomer.email && (
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-500" />
                      {selectedCustomer.email}
                    </div>
                  )}
                  {selectedCustomer.roofAge && (
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-gray-500" />
                      Roof Age: {selectedCustomer.roofAge} years
                    </div>
                  )}
                  {selectedCustomer.sqft && (
                    <div className="flex items-center">
                      <BarChart3 className="w-4 h-4 mr-2 text-gray-500" />
                      {selectedCustomer.sqft} sq ft
                    </div>
                  )}
                  {selectedCustomer.dabellaQuote && (
                    <div className="flex items-center font-semibold text-green-700">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Quote: ${parseFloat(String(selectedCustomer.dabellaQuote).replace(/[$,]/g, '')).toLocaleString()}
                    </div>
                  )}
                </div>
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
                  <FileText className="w-4 h-4 mr-2 text-gray-500 mt-0.5 flex-shrink-0" />
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
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleActionClick('call')}
                className={`py-3 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-sm ${
                  activeAction === 'call'
                    ? 'bg-blue-600 text-white shadow-lg scale-105 ring-2 ring-blue-300'
                    : 'bg-white text-gray-700 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                <PhoneCall className="w-5 h-5" />
                Call
              </button>
              <button
                onClick={() => handleActionClick('sms')}
                className={`py-3 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-sm ${
                  activeAction === 'sms'
                    ? 'bg-green-600 text-white shadow-lg scale-105 ring-2 ring-green-300'
                    : 'bg-white text-gray-700 border-2 border-green-200 hover:border-green-400 hover:bg-green-50'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                SMS
              </button>
              <button
                onClick={() => handleActionClick('email')}
                disabled={!selectedCustomer.email}
                className={`py-3 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-sm ${
                  activeAction === 'email'
                    ? 'bg-purple-600 text-white shadow-lg scale-105 ring-2 ring-purple-300'
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
            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 max-h-[50vh] overflow-y-auto">
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                {activeAction === 'sms' && <MessageCircle className="w-5 h-5 mr-2 text-green-600" />}
                {activeAction === 'call' && <PhoneCall className="w-5 h-5 mr-2 text-blue-600" />}
                {activeAction === 'email' && <Mail className="w-5 h-5 mr-2 text-purple-600" />}
                Log {activeAction === 'sms' ? 'SMS' : activeAction === 'call' ? 'Call' : 'Email'} Communication
              </h3>

              {/* Disposition Selection */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Disposition <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {dispositions.map((disposition) => {
                    const Icon = disposition.icon;
                    const isSelected = selectedDisposition === disposition.id;
                    const colorClasses = {
                      green: isSelected ? 'bg-green-600 text-white ring-2 ring-green-300' : 'bg-white text-gray-700 border-2 border-green-200 hover:border-green-400',
                      teal: isSelected ? 'bg-teal-600 text-white ring-2 ring-teal-300' : 'bg-white text-gray-700 border-2 border-teal-200 hover:border-teal-400',
                      orange: isSelected ? 'bg-orange-600 text-white ring-2 ring-orange-300' : 'bg-white text-gray-700 border-2 border-orange-200 hover:border-orange-400',
                      red: isSelected ? 'bg-red-600 text-white ring-2 ring-red-300' : 'bg-white text-gray-700 border-2 border-red-200 hover:border-red-400',
                      blue: isSelected ? 'bg-blue-600 text-white ring-2 ring-blue-300' : 'bg-white text-gray-700 border-2 border-blue-200 hover:border-blue-400',
                      yellow: isSelected ? 'bg-yellow-600 text-white ring-2 ring-yellow-300' : 'bg-white text-gray-700 border-2 border-yellow-200 hover:border-yellow-400',
                      gray: isSelected ? 'bg-gray-600 text-white ring-2 ring-gray-300' : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-400'
                    };

                    return (
                      <button
                        key={disposition.id}
                        onClick={() => setSelectedDisposition(disposition.id)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${colorClasses[disposition.color]}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{disposition.emoji} {disposition.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Email Subject (Email only) */}
              {activeAction === 'email' && (
                <div className="mb-4">
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
              )}

              {/* Message Content / Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {activeAction === 'email' ? 'Message' : 'Notes'} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={activeAction === 'email' ? emailBody : messageContent}
                  onChange={(e) => activeAction === 'email' ? setEmailBody(e.target.value) : setMessageContent(e.target.value)}
                  placeholder={`Enter ${activeAction === 'email' ? 'email message' : 'notes about this communication'}...`}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows="4"
                />
              </div>

              {/* Follow-up Date (if follow-up disposition selected) */}
              {requiresFollowUp && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Follow-up Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={() => handleLogCommunication(activeAction)}
                disabled={!selectedDisposition || (activeAction === 'email' && (!emailSubject.trim() || !emailBody.trim())) || (activeAction !== 'email' && !messageContent.trim()) || (requiresFollowUp && !followUpDate)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Log Communication
              </button>
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
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                  {customerHistory.length} interaction{customerHistory.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {customerHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border-2 border-dashed border-gray-300">
                <BarChart3 className="w-20 h-20 mb-4 opacity-30" />
                <p className="text-lg font-semibold text-gray-600 mb-2">No communication history yet</p>
                <p className="text-sm text-gray-500">Start by making a call, sending an SMS, or email</p>
              </div>
            ) : (
              <div className="space-y-3">
                {customerHistory.map((comm, index) => {
                  const timestamp = comm.timestamp || comm.dateTime;
                  const commType = (comm.type || comm.communicationType || '').toLowerCase();
                  const disposition = comm.disposition || comm.outcome || comm.status;
                  const notes = comm.notes || comm.message_content;

                  const typeConfig = {
                    'call': { icon: PhoneCall, color: 'text-blue-600', emoji: '📞', bg: 'bg-blue-50' },
                    'sms': { icon: MessageSquare, color: 'text-green-600', emoji: '💬', bg: 'bg-green-50' },
                    'email': { icon: Mail, color: 'text-purple-600', emoji: '📧', bg: 'bg-purple-50' }
                  };

                  const TypeIcon = typeConfig[commType]?.icon || MessageSquare;
                  const config = typeConfig[commType] || typeConfig['sms'];

                  return (
                    <div
                      key={comm.id || index}
                      className={`${config.bg} border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 ${config.bg} rounded-lg border border-gray-200`}>
                            <TypeIcon className={`w-5 h-5 ${config.color}`} />
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 capitalize flex items-center gap-1">
                              {config.emoji} {commType}
                            </span>
                            {disposition && (
                              <span className="text-xs px-2 py-1 rounded-full bg-white text-gray-700 border border-gray-200 font-medium inline-block mt-1">
                                {disposition}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center text-xs text-gray-600 bg-white px-2 py-1 rounded-full border border-gray-200">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(timestamp).toLocaleDateString()} {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      {notes && (
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                          <p className="text-sm text-gray-700 leading-relaxed">{notes}</p>
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
            <MessageCircle className="w-32 h-32 mx-auto mb-6 opacity-20" />
            <h3 className="text-2xl font-bold mb-3 text-gray-700">Select a Customer</h3>
            <p className="text-lg text-gray-600 mb-4">Choose a customer from the list to:</p>
            <div className="grid grid-cols-1 gap-2 text-left bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 text-sm">
                <PhoneCall className="w-4 h-4 text-blue-500" />
                <span className="text-gray-700">Make phone calls via Google Voice</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MessageCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-700">Send and log SMS messages</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-purple-500" />
                <span className="text-gray-700">Compose and send emails</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <History className="w-4 h-4 text-orange-500" />
                <span className="text-gray-700">View complete communication history</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
