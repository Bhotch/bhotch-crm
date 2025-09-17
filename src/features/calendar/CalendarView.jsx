import React, { useState, useMemo, useCallback } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Phone, Plus,
  Search, Edit2, Trash2, Target,
  CheckCircle, AlertCircle, CalendarDays, List, Grid,
  Bell, Send, FileText, Download
} from 'lucide-react';

function CalendarView({ leads = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month, week, day, agenda
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const today = useMemo(() => new Date(), []);
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Enhanced appointments with more features
  const appointments = useMemo(() => [
    {
      id: 1,
      date: new Date(currentYear, currentMonth, 15),
      time: '10:00 AM',
      endTime: '11:00 AM',
      customer: 'John Smith',
      address: '123 Main St, Ogden, UT',
      phone: '555-0123',
      email: 'john@example.com',
      type: 'Initial Consultation',
      status: 'Confirmed',
      priority: 'High',
      notes: 'First time customer, very interested in roof replacement',
      leadId: 'lead1',
      duration: 60,
      reminderSet: true,
      color: 'blue'
    },
    {
      id: 2,
      date: new Date(currentYear, currentMonth, 18),
      time: '2:00 PM',
      endTime: '3:30 PM',
      customer: 'Sarah Johnson',
      address: '456 Oak Ave, Salt Lake City, UT',
      phone: '555-0456',
      email: 'sarah@example.com',
      type: 'Follow-up',
      status: 'Pending',
      priority: 'Medium',
      notes: 'Quote review and final decision discussion',
      leadId: 'lead2',
      duration: 90,
      reminderSet: false,
      color: 'green'
    },
    {
      id: 3,
      date: new Date(currentYear, currentMonth, 22),
      time: '11:30 AM',
      endTime: '12:30 PM',
      customer: 'Mike Wilson',
      address: '789 Pine St, Provo, UT',
      phone: '555-0789',
      email: 'mike@example.com',
      type: 'Site Visit',
      status: 'Confirmed',
      priority: 'High',
      notes: 'On-site inspection for damage assessment',
      leadId: 'lead3',
      duration: 60,
      reminderSet: true,
      color: 'red'
    },
    {
      id: 4,
      date: new Date(currentYear, currentMonth, 25),
      time: '9:00 AM',
      endTime: '10:00 AM',
      customer: 'Emily Davis',
      address: '321 Elm Dr, West Valley, UT',
      phone: '555-0321',
      email: 'emily@example.com',
      type: 'Quote Presentation',
      status: 'Confirmed',
      priority: 'High',
      notes: 'Present final quote and contract signing',
      leadId: 'lead4',
      duration: 60,
      reminderSet: true,
      color: 'purple'
    },
    {
      id: 5,
      date: new Date(),
      time: '3:00 PM',
      endTime: '4:00 PM',
      customer: 'Chris Brown',
      address: '654 Cedar Ln, Layton, UT',
      phone: '555-0654',
      email: 'chris@example.com',
      type: 'Consultation',
      status: 'Confirmed',
      priority: 'Medium',
      notes: 'Initial consultation for new construction',
      leadId: 'lead5',
      duration: 60,
      reminderSet: true,
      color: 'orange'
    }
  ], [currentYear, currentMonth]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentYear, currentMonth + direction, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const getAppointmentsForDate = useCallback((date) => {
    return appointments.filter(apt =>
      apt.date.toDateString() === date.toDateString()
    );
  }, [appointments]);

  const getTodayAppointments = useCallback(() => {
    return getAppointmentsForDate(today);
  }, [getAppointmentsForDate, today]);

  const getUpcomingAppointments = () => {
    const upcoming = appointments.filter(apt => apt.date >= today)
      .sort((a, b) => a.date - b.date)
      .slice(0, 6);
    return upcoming;
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const matchesSearch = apt.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           apt.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           apt.address.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'All' || apt.type === filterType;
      const matchesStatus = filterStatus === 'All' || apt.status === filterStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [appointments, searchTerm, filterType, filterStatus]);

  const appointmentStats = useMemo(() => {
    const total = appointments.length;
    const todayCount = getTodayAppointments().length;
    const confirmed = appointments.filter(apt => apt.status === 'Confirmed').length;
    const pending = appointments.filter(apt => apt.status === 'Pending').length;
    const thisMonth = appointments.filter(apt =>
      apt.date.getMonth() === currentMonth && apt.date.getFullYear() === currentYear
    ).length;

    return { total, today: todayCount, confirmed, pending, thisMonth };
  }, [appointments, currentMonth, currentYear, getTodayAppointments]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed': return 'text-green-600 bg-green-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Cancelled': return 'text-red-600 bg-red-100';
      case 'Completed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'border-red-500 bg-red-50';
      case 'Medium': return 'border-yellow-500 bg-yellow-50';
      case 'Low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const AppointmentCard = ({ appointment, compact = false }) => (
    <div className={`border-l-4 ${getPriorityColor(appointment.priority)} p-3 rounded-r-lg hover:shadow-md transition-all duration-200 cursor-pointer group`}
         onClick={() => setSelectedAppointment(appointment)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">
              {appointment.time} - {appointment.endTime}
            </span>
            {appointment.reminderSet && <Bell className="w-3 h-3 text-blue-500" />}
          </div>
          <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {appointment.customer}
          </h4>
          <p className="text-sm text-gray-600 mb-2">{appointment.type}</p>

          {!compact && (
            <>
              <div className="flex items-center text-xs text-gray-500 mb-1">
                <MapPin className="w-3 h-3 mr-1" />
                {appointment.address}
              </div>
              <div className="flex items-center text-xs text-gray-500 mb-2">
                <Phone className="w-3 h-3 mr-1" />
                {appointment.phone}
              </div>
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                  {appointment.status}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1 hover:bg-gray-200 rounded">
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button className="p-1 hover:bg-gray-200 rounded">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const MonthView = () => (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          <div className="flex items-center space-x-2">
            <button onClick={() => navigateMonth(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={goToToday}
                    className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              Today
            </button>
            <button onClick={() => navigateMonth(1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {daysOfWeek.map(day => (
            <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600 bg-gray-50 rounded-lg">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfMonth }, (_, i) => (
            <div key={`empty-${i}`} className="h-24 p-1"></div>
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const date = new Date(currentYear, currentMonth, day);
            const isToday = today.toDateString() === date.toDateString();
            const dayAppointments = getAppointmentsForDate(date);
            const isSelected = selectedDate?.toDateString() === date.toDateString();

            return (
              <div key={day}
                   className={`h-24 p-1 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-blue-50 ${
                     isToday ? 'bg-blue-100 border-blue-300' : 'border-gray-200'
                   } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                   onClick={() => setSelectedDate(date)}>
                <div className={`text-sm font-medium p-1 ${
                  isToday ? 'text-blue-700' : 'text-gray-900'
                }`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {dayAppointments.slice(0, 2).map(apt => (
                    <div key={apt.id}
                         className={`text-xs p-1 rounded truncate bg-${apt.color}-100 text-${apt.color}-700 border-l-2 border-${apt.color}-400`}
                         onClick={(e) => { e.stopPropagation(); setSelectedAppointment(apt); }}>
                      {apt.time} {apt.customer}
                    </div>
                  ))}
                  {dayAppointments.length > 2 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayAppointments.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const AgendaView = () => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Agenda View</h3>
      <div className="space-y-6">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          filteredAppointments.map(appointment => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with enhanced controls */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center">
            <CalendarDays className="w-8 h-8 mr-3 text-blue-600" />
            Calendar & Appointments
          </h2>
          <p className="text-gray-600 mt-1">
            Manage your appointments, schedule consultations, and track customer meetings
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                viewMode === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="w-4 h-4" />
              Month
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                viewMode === 'agenda' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              Agenda
            </button>
          </div>

          {/* Add Appointment Button */}
          <button
            onClick={() => alert('Add Appointment Modal - Coming Soon!')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Appointment
          </button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarDays className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Appointments</p>
              <p className="text-2xl font-semibold text-gray-900">{appointmentStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Today's Appointments</p>
              <p className="text-2xl font-semibold text-gray-900">{appointmentStats.today}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Target className="w-8 h-8 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Confirmed</p>
              <p className="text-2xl font-semibold text-gray-900">{appointmentStats.confirmed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">{appointmentStats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-indigo-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="w-8 h-8 text-indigo-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">This Month</p>
              <p className="text-2xl font-semibold text-gray-900">{appointmentStats.thisMonth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search appointments by customer, type, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All">All Types</option>
            <option value="Initial Consultation">Initial Consultation</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Site Visit">Site Visit</option>
            <option value="Quote Presentation">Quote Presentation</option>
            <option value="Consultation">Consultation</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All">All Status</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Main Calendar/Agenda View */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          {viewMode === 'month' ? <MonthView /> : <AgendaView />}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Today's Appointments */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Today's Schedule
            </h3>
            {getTodayAppointments().length === 0 ? (
              <p className="text-gray-500 text-sm">No appointments today.</p>
            ) : (
              <div className="space-y-3">
                {getTodayAppointments().map(apt => (
                  <AppointmentCard key={apt.id} appointment={apt} compact={true} />
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-green-600" />
              Upcoming
            </h3>
            <div className="space-y-3">
              {getUpcomingAppointments().map(apt => (
                <div key={apt.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                     onClick={() => setSelectedAppointment(apt)}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-blue-600">
                      {apt.date.toLocaleDateString()}
                    </span>
                    <span className="text-xs text-gray-500">{apt.time}</span>
                  </div>
                  <div className="font-medium text-gray-900 text-sm">{apt.customer}</div>
                  <div className="text-xs text-gray-600">{apt.type}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Export Calendar
              </button>
              <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Send className="w-4 h-4 mr-2" />
                Send Reminders
              </button>
              <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  Appointment Details
                </h3>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-gray-900">{selectedAppointment.customer}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-gray-900">{selectedAppointment.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900">{selectedAppointment.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <p className="text-gray-900">{selectedAppointment.address}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Appointment Details</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date</label>
                      <p className="text-gray-900">{selectedAppointment.date.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Time</label>
                      <p className="text-gray-900">{selectedAppointment.time} - {selectedAppointment.endTime}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Type</label>
                      <p className="text-gray-900">{selectedAppointment.type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAppointment.status)}`}>
                        {selectedAppointment.status}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Priority</label>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        selectedAppointment.priority === 'High' ? 'bg-red-100 text-red-800' :
                        selectedAppointment.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {selectedAppointment.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Notes</label>
                <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                  {selectedAppointment.notes || 'No notes added.'}
                </p>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedAppointment(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Edit Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarView;