import React from 'react';
import { Calendar } from 'lucide-react';

export function CalendarView() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center"><Calendar className="w-8 h-8 mr-3 text-blue-600" /> Appointment Calendar</h2>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="border border-gray-300 rounded-lg overflow-hidden">
            <iframe 
                src="https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=America%2FDenver&showPrint=0&title=Bhotch%20Appointment&src=YnJhbmRvbkByaW1laHEubmV0&src=YnJhbmRvbi5ob3RjaGtpc3NAZ21haWwuY29t&color=%23addf00&color=%233f51b5" 
                style={{ border: 'none', width: '100%', height: '600px' }} 
                frameBorder="0" 
                scrolling="no" 
                title="Bhotch CRM Calendar"
            />
        </div>
      </div>
    </div>
  );
}