import React from 'react';
import { Calendar } from 'lucide-react';

function CalendarView() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center">
        <Calendar className="w-8 h-8 mr-3 text-blue-600" /> 
        Appointment Calendar
      </h2>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <Calendar className="mx-auto h-16 w-16 text-blue-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar Integration</h3>
          <p className="text-gray-600 mb-4">
            Calendar integration is available for managing appointments and schedules.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Setup Instructions:</h4>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li>Configure Google Calendar API credentials</li>
              <li>Set proper calendar permissions</li>
              <li>Update environment variables with calendar access tokens</li>
            </ol>
          </div>
          <p className="text-sm text-gray-500">
            Once configured, your appointments and lead schedules will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CalendarView;