import React from 'react';
import { Calendar } from 'lucide-react';

export function CalendarView() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center">
        <Calendar className="w-8 h-8 mr-3 text-blue-600" /> 
        Appointment Calendar
      </h2>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar Integration</h3>
          <p className="text-gray-600 mb-4">
            Calendar integration requires proper authentication setup.
          </p>
          <p className="text-sm text-gray-500">
            Contact your administrator to configure calendar access.
          </p>
        </div>
      </div>
    </div>
  );
}