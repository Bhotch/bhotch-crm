import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Edit2, Trash2, X, Clock, MapPin, User, Save } from 'lucide-react';
import { calendarEventsService } from '../../api/supabaseService';
import { isSupabaseEnabled } from '../../lib/supabase';

function InternalCalendar({ leads, addNotification }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    lead_id: '',
    start_time: '',
    end_time: '',
    location: '',
    notes: '',
    event_type: 'Appointment'
  });

  const useSupabase = isSupabaseEnabled();

  // Load events
  const loadEvents = useCallback(async () => {
    if (!useSupabase) {
      addNotification('Calendar requires Supabase to be enabled', 'error');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const data = await calendarEventsService.getAll(
        startOfMonth.toISOString(),
        endOfMonth.toISOString()
      );
      setEvents(data || []);
    } catch (error) {
      addNotification(`Error loading events: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [currentDate, useSupabase, addNotification]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Calendar helpers
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(date);
    setFormData({
      ...formData,
      start_time: `${date.toISOString().split('T')[0]}T09:00`,
      end_time: `${date.toISOString().split('T')[0]}T10:00`
    });
    setShowEventModal(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      lead_id: event.lead_id || '',
      start_time: event.start_time.slice(0, 16),
      end_time: event.end_time.slice(0, 16),
      location: event.location || '',
      notes: event.notes || '',
      event_type: event.event_type || 'Appointment'
    });
    setShowEventModal(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      await calendarEventsService.delete(eventId);
      addNotification('Event deleted successfully', 'success');
      loadEvents();
    } catch (error) {
      addNotification(`Error deleting event: ${error.message}`, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingEvent) {
        await calendarEventsService.update(editingEvent.id, formData);
        addNotification('Event updated successfully', 'success');
      } else {
        await calendarEventsService.create(formData);
        addNotification('Event created successfully', 'success');
      }

      setShowEventModal(false);
      setEditingEvent(null);
      setFormData({
        title: '',
        lead_id: '',
        start_time: '',
        end_time: '',
        location: '',
        notes: '',
        event_type: 'Appointment'
      });
      loadEvents();
    } catch (error) {
      addNotification(`Error saving event: ${error.message}`, 'error');
    }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const today = new Date();

  // Generate calendar grid
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-24 bg-gray-50"></div>);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayEvents = getEventsForDate(date);
    const isToday = date.toDateString() === today.toDateString();

    calendarDays.push(
      <div
        key={day}
        onClick={() => handleDateClick(day)}
        className={`h-24 border border-gray-200 p-2 cursor-pointer hover:bg-blue-50 transition-colors ${
          isToday ? 'bg-blue-100 border-blue-400' : 'bg-white'
        }`}
      >
        <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
          {day}
        </div>
        <div className="space-y-1">
          {dayEvents.slice(0, 2).map(event => (
            <div
              key={event.id}
              className="text-xs bg-blue-500 text-white px-2 py-1 rounded truncate"
              onClick={(e) => {
                e.stopPropagation();
                handleEditEvent(event);
              }}
            >
              {new Date(event.start_time).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
              })} {event.title}
            </div>
          ))}
          {dayEvents.length > 2 && (
            <div className="text-xs text-gray-500">+{dayEvents.length - 2} more</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center">
            <Calendar className="w-8 h-8 mr-3 text-blue-600" />
            Calendar
          </h2>
          <p className="text-gray-600 mt-1">Manage appointments and events</p>
        </div>
        <button
          onClick={() => {
            setEditingEvent(null);
            setSelectedDate(new Date());
            setFormData({
              title: '',
              lead_id: '',
              start_time: new Date().toISOString().slice(0, 16),
              end_time: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
              location: '',
              notes: '',
              event_type: 'Appointment'
            });
            setShowEventModal(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Event
        </button>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
        <button
          onClick={handlePrevMonth}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ← Previous
        </button>
        <div className="text-xl font-semibold text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </div>
        <button
          onClick={handleNextMonth}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Next →
        </button>
      </div>

      <button
        onClick={handleToday}
        className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
      >
        Today
      </button>

      {/* Calendar Grid */}
      {loading ? (
        <div className="text-center py-12">Loading calendar...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-7 bg-gray-100 border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-3 text-center text-sm font-semibold text-gray-700">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays}
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">
                {editingEvent ? 'Edit Event' : 'New Event'}
              </h3>
              <button onClick={() => setShowEventModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Roof Inspection"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                <select
                  value={formData.event_type}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>Appointment</option>
                  <option>Follow Up</option>
                  <option>Site Visit</option>
                  <option>Estimate</option>
                  <option>Meeting</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link to Lead (Optional)</label>
                <select
                  value={formData.lead_id}
                  onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No lead selected</option>
                  {leads.map(lead => (
                    <option key={lead.id} value={lead.id}>
                      {lead.customer_name || lead.customerName} - {lead.address}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123 Main St, City, State"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional details..."
                />
              </div>

              <div className="flex justify-between pt-4 border-t">
                {editingEvent && (
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(editingEvent.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                )}
                <div className="flex gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowEventModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingEvent ? 'Update' : 'Create'} Event
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default InternalCalendar;
