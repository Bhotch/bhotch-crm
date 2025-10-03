import React, { useState, useEffect } from 'react';
import {
  Calendar, CalendarDays, ExternalLink, RefreshCw, Grid, List, Clock, AlertTriangle
} from 'lucide-react';

function CalendarView() {
  const [calendarView, setCalendarView] = useState('MONTH'); // MONTH, WEEK, AGENDA
  const [iframeError, setIframeError] = useState(false);

  // Google Calendar embed URL for brandon@rimehq.net
  const GOOGLE_CALENDAR_EMAIL = 'brandon@rimehq.net';

  const getCalendarEmbedUrl = () => {
    const baseUrl = 'https://calendar.google.com/calendar/embed';
    const params = new URLSearchParams({
      src: GOOGLE_CALENDAR_EMAIL,
      ctz: 'America/Denver', // Mountain Time Zone
      mode: calendarView,
      showTitle: '0',
      showNav: '1',
      showDate: '1',
      showPrint: '0',
      showTabs: '1',
      showCalendars: '0',
      showTz: '0',
      bgcolor: '%23ffffff',
      color: '%232952A3'
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const handleOpenInGoogle = () => {
    window.open(`https://calendar.google.com/calendar/u/0/r?cid=${GOOGLE_CALENDAR_EMAIL}`, '_blank');
  };

  const handleRefresh = () => {
    // Force iframe reload by resetting the src
    const iframe = document.getElementById('google-calendar-iframe');
    if (iframe) {
      const currentSrc = iframe.src;
      iframe.src = '';
      iframe.src = currentSrc;
      setIframeError(false);
    }
  };

  // Monitor iframe load errors (401 Unauthorized)
  useEffect(() => {
    const iframe = document.getElementById('google-calendar-iframe');
    if (iframe) {
      const handleLoad = () => {
        try {
          // If calendar loads successfully, clear error state
          setIframeError(false);
        } catch (e) {
          // Iframe loaded but may have errors
          console.log('Calendar iframe loaded');
        }
      };

      const handleError = () => {
        setIframeError(true);
      };

      iframe.addEventListener('load', handleLoad);
      iframe.addEventListener('error', handleError);

      // Check for 401 errors after a short delay
      const timeout = setTimeout(() => {
        try {
          // If iframe is accessible and calendar is private, show error
          if (iframe.contentDocument === null) {
            // Cross-origin iframe, likely has auth issues
            // This is expected for Google Calendar embeds without proper auth
          }
        } catch (e) {
          // Expected cross-origin error
        }
      }, 2000);

      return () => {
        iframe.removeEventListener('load', handleLoad);
        iframe.removeEventListener('error', handleError);
        clearTimeout(timeout);
      };
    }
  }, [calendarView]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center">
            <CalendarDays className="w-8 h-8 mr-3 text-blue-600" />
            Calendar
          </h2>
          <p className="text-gray-600 mt-1">
            View and manage appointments from Google Calendar for {GOOGLE_CALENDAR_EMAIL}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setCalendarView('MONTH')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                calendarView === 'MONTH' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="w-4 h-4" />
              Month
            </button>
            <button
              onClick={() => setCalendarView('WEEK')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                calendarView === 'WEEK' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Week
            </button>
            <button
              onClick={() => setCalendarView('AGENDA')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                calendarView === 'AGENDA' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              Agenda
            </button>
          </div>

          {/* Action Buttons */}
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={handleOpenInGoogle}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in Google
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
        <Clock className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-900 mb-1">Google Calendar Integration</h3>
          <p className="text-sm text-blue-800">
            This calendar displays all events from <span className="font-semibold">{GOOGLE_CALENDAR_EMAIL}</span>.
            To add or edit appointments, click "Open in Google" to manage them directly in Google Calendar.
          </p>
        </div>
      </div>

      {/* Authentication Warning (if needed) */}
      {iframeError && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 flex items-start">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-yellow-900 mb-1">Calendar Authentication Required</h3>
            <p className="text-sm text-yellow-800 mb-2">
              The calendar cannot be displayed due to authentication restrictions. This is normal for private calendars.
            </p>
            <button
              onClick={handleOpenInGoogle}
              className="text-sm text-yellow-900 hover:text-yellow-700 font-medium underline"
            >
              Open Google Calendar directly →
            </button>
          </div>
        </div>
      )}

      {/* Google Calendar Embed */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        {!iframeError ? (
          <iframe
            id="google-calendar-iframe"
            src={getCalendarEmbedUrl()}
            style={{ border: 0 }}
            width="100%"
            height="700"
            frameBorder="0"
            scrolling="no"
            title="Google Calendar"
            className="w-full"
            onError={() => setIframeError(true)}
          ></iframe>
        ) : (
          <div className="flex flex-col items-center justify-center p-16 bg-gray-50">
            <AlertTriangle className="w-16 h-16 text-yellow-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Calendar Requires Authentication</h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              This calendar is private and requires Google authentication to view.
              Please use the button below to access it directly in Google Calendar.
            </p>
            <button
              onClick={handleOpenInGoogle}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Open Google Calendar
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions Footer */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CalendarDays className="w-5 h-5 mr-2 text-blue-600" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <h4 className="font-medium text-gray-900 mb-2">Create Appointment</h4>
            <p className="text-sm text-gray-600 mb-3">
              Click "Open in Google" above to create new appointments directly in Google Calendar.
            </p>
            <button
              onClick={handleOpenInGoogle}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Go to Google Calendar →
            </button>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <h4 className="font-medium text-gray-900 mb-2">Sync with Leads</h4>
            <p className="text-sm text-gray-600 mb-3">
              Appointments created in Google Calendar will be automatically reflected here in real-time.
            </p>
            <button
              onClick={handleRefresh}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Refresh Calendar →
            </button>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <h4 className="font-medium text-gray-900 mb-2">Time Zone</h4>
            <p className="text-sm text-gray-600 mb-3">
              Calendar is set to Mountain Time (America/Denver). All appointments display in this time zone.
            </p>
            <span className="text-sm text-gray-500 font-medium">
              MT (UTC-7/UTC-6)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarView;
