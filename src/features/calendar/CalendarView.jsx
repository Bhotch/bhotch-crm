import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Phone } from 'lucide-react';

function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Sample appointments - this would come from your data in a real app
  const appointments = [
    { id: 1, date: new Date(currentYear, currentMonth, 15), time: '10:00 AM', customer: 'John Smith', address: '123 Main St', phone: '555-0123', type: 'Initial Consultation' },
    { id: 2, date: new Date(currentYear, currentMonth, 18), time: '2:00 PM', customer: 'Sarah Johnson', address: '456 Oak Ave', phone: '555-0456', type: 'Follow-up' },
    { id: 3, date: new Date(currentYear, currentMonth, 22), time: '11:30 AM', customer: 'Mike Wilson', address: '789 Pine St', phone: '555-0789', type: 'Site Visit' }
  ];

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentYear, currentMonth + direction, 1));
  };

  const hasAppointment = (day) => {
    return appointments.some(apt =>
      apt.date.getDate() === day &&
      apt.date.getMonth() === currentMonth &&
      apt.date.getFullYear() === currentYear
    );
  };

  const getTodayAppointments = () => {
    return appointments.filter(apt =>
      apt.date.toDateString() === today.toDateString()
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center">
        <Calendar className="w-8 h-8 mr-3 text-blue-600" />
        Appointment Calendar
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {monthNames[currentMonth]} {currentYear}
            </h3>
            <div className="flex space-x-2">
              <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-gray-100 rounded">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-gray-100 rounded">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }, (_, i) => (
              <div key={`empty-${i}`} className="p-2 h-10"></div>
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const isToday = today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
              const hasApt = hasAppointment(day);

              return (
                <div key={day} className={`p-2 h-10 text-center text-sm rounded cursor-pointer hover:bg-gray-100 ${
                  isToday ? 'bg-blue-100 text-blue-600 font-semibold' : ''
                } ${hasApt ? 'bg-green-100 text-green-600' : ''}`}>
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Appointments</h3>
          {getTodayAppointments().length === 0 ? (
            <p className="text-gray-500 text-sm">No appointments scheduled for today.</p>
          ) : (
            <div className="space-y-3">
              {getTodayAppointments().map(apt => (
                <div key={apt.id} className="border-l-4 border-blue-500 pl-3">
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <Clock className="w-4 h-4 mr-1" />
                    {apt.time}
                  </div>
                  <div className="font-medium text-gray-900">{apt.customer}</div>
                  <div className="text-sm text-gray-600">{apt.type}</div>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    {apt.address}
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Phone className="w-3 h-3 mr-1" />
                    {apt.phone}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Appointments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.map(apt => (
            <div key={apt.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-600">{apt.date.toDateString()}</span>
                <span className="text-sm text-gray-500">{apt.time}</span>
              </div>
              <div className="font-medium text-gray-900 mb-1">{apt.customer}</div>
              <div className="text-sm text-gray-600 mb-2">{apt.type}</div>
              <div className="text-xs text-gray-500">
                <div className="flex items-center mb-1">
                  <MapPin className="w-3 h-3 mr-1" />
                  {apt.address}
                </div>
                <div className="flex items-center">
                  <Phone className="w-3 h-3 mr-1" />
                  {apt.phone}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CalendarView;