import React, { useState } from 'react';
import { X, Phone, MessageSquare, Mail } from 'lucide-react';

const CALL_OUTCOMES = [
  {
    id: 'no-answer',
    label: 'No Answer',
    color: '#EF4444',
    bgColor: 'bg-red-50 hover:bg-red-100 border-red-200',
    icon: '📵',
    autoNote: 'No answer - will try again later',
    status: 'No Answer',
    keepOpen: true,
    suggestRetry: true
  },
  {
    id: 'voicemail',
    label: 'No Answer Left Voicemail',
    color: '#F59E0B',
    bgColor: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
    icon: '📭',
    autoNote: 'Left voicemail with callback request',
    status: 'Left Voicemail',
    keepOpen: true,
    createReminder: true,
    reminderHours: 24
  },
  {
    id: 'confirmed',
    label: 'Called and Confirmed Appointment',
    color: '#10B981',
    bgColor: 'bg-green-50 hover:bg-green-100 border-green-200',
    icon: '✅',
    autoNote: 'Appointment confirmed - customer ready',
    status: 'Completed',
    updateLeadStatus: 'scheduled',
    promptCalendar: true
  },
  {
    id: 'not-interested',
    label: 'Not Interested',
    color: '#6B7280',
    bgColor: 'bg-gray-50 hover:bg-gray-100 border-gray-200',
    icon: '❌',
    autoNote: 'Customer declined - not interested at this time',
    status: 'Completed',
    updateLeadStatus: 'lost',
    requiresConfirmation: true
  },
  {
    id: 'follow-up',
    label: 'Follow-up Needed',
    color: '#3B82F6',
    bgColor: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
    icon: '🔔',
    autoNote: 'Needs follow-up - set reminder',
    status: 'Completed',
    createReminder: true,
    updateLeadStatus: 'follow-up'
  }
];

const DURATION_OPTIONS = [
  { value: 1, label: '1 minute' },
  { value: 2, label: '2 minutes' },
  { value: 5, label: '5 minutes' },
  { value: 10, label: '10 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' }
];

const REMINDER_OPTIONS = [
  { value: 'tomorrow', label: 'Tomorrow morning (9 AM)', hours: 24 },
  { value: '3days', label: 'In 3 days', hours: 72 },
  { value: 'week', label: 'Next week', hours: 168 },
  { value: 'custom', label: 'Custom date/time' }
];

function CommunicationModal({ lead, onClose, onLogCommunication, onUpdateLead }) {
  const [communicationType, setCommunicationType] = useState('Call');
  const [selectedTag, setSelectedTag] = useState(null);
  const [duration, setDuration] = useState(5);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState('tomorrow');
  const [customReminderDate, setCustomReminderDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickTag = async (tag) => {
    setSelectedTag(tag);

    // If requires confirmation, show confirmation dialog
    if (tag.requiresConfirmation) {
      const confirmed = window.confirm(`Are you sure you want to mark this lead as "${tag.updateLeadStatus}"?`);
      if (!confirmed) {
        setSelectedTag(null);
        return;
      }
    }

    // If tag creates a reminder, show reminder modal
    if (tag.createReminder) {
      setShowReminderModal(true);
      return;
    }

    // Otherwise, submit immediately
    await submitCommunication(tag);
  };

  const submitCommunication = async (tag) => {
    setIsSubmitting(true);

    try {
      const communication = {
        leadId: lead.id,
        customerName: lead.customerName,
        phoneNumber: lead.phoneNumber,
        communicationType: communicationType,
        dateTime: new Date().toISOString(),
        status: tag.status,
        duration: duration,
        notes: additionalNotes || tag.autoNote,
        createdBy: 'user@example.com', // TODO: Get from auth context
        createdAt: new Date().toISOString()
      };

      // Log the communication
      await onLogCommunication(communication);

      // Update lead status if specified
      if (tag.updateLeadStatus) {
        await onUpdateLead({
          ...lead,
          disposition: tag.updateLeadStatus
        });
      }

      // Show success message
      let successMessage = 'Communication logged successfully!';
      if (tag.updateLeadStatus) {
        successMessage += ` Lead status updated to ${tag.updateLeadStatus}.`;
      }
      if (tag.promptCalendar) {
        successMessage += ' Check Google Calendar for appointment details.';
      }

      alert(successMessage);

      // Suggest retry time for "No Answer"
      if (tag.suggestRetry) {
        const retryTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
        alert(`Suggested retry time: ${retryTime.toLocaleTimeString()}`);
      }

      // Prompt to open calendar if confirmed appointment
      if (tag.promptCalendar) {
        const openCalendar = window.confirm('Would you like to open Google Calendar to verify the appointment?');
        if (openCalendar) {
          window.open('https://calendar.google.com', '_blank');
        }
      }

      // Close modal if tag doesn't keep it open
      if (!tag.keepOpen) {
        onClose();
      } else {
        // Reset for another quick log
        setSelectedTag(null);
        setAdditionalNotes('');
      }
    } catch (error) {
      console.error('Error logging communication:', error);
      alert('Failed to log communication. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReminderSubmit = async () => {
    // TODO: Implement reminder creation
    alert(`Reminder set for ${selectedReminder}`);
    setShowReminderModal(false);
    await submitCommunication(selectedTag);
  };

  if (showReminderModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full shadow-2xl">
          <div className="p-6 border-b flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900">Set Reminder</h3>
            <button onClick={() => setShowReminderModal(false)} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">When should we remind you to follow up with {lead.customerName}?</p>
            <div className="space-y-2">
              {REMINDER_OPTIONS.map(option => (
                <label key={option.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="reminder"
                    value={option.value}
                    checked={selectedReminder === option.value}
                    onChange={(e) => setSelectedReminder(e.target.value)}
                    className="mr-3"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
            {selectedReminder === 'custom' && (
              <input
                type="datetime-local"
                value={customReminderDate}
                onChange={(e) => setCustomReminderDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            )}
          </div>
          <div className="flex justify-end space-x-3 p-4 bg-gray-50 border-t">
            <button
              onClick={() => setShowReminderModal(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleReminderSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Set Reminder & Log
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full shadow-2xl">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Log {communicationType} - {lead.customerName}
            </h3>
            <p className="text-sm text-gray-500">{lead.phoneNumber}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Communication Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Communication Type</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setCommunicationType('Call')}
                className={`flex-1 px-4 py-2 rounded-md flex items-center justify-center ${
                  communicationType === 'Call' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Phone size={16} className="mr-2" />
                Call
              </button>
              <button
                onClick={() => setCommunicationType('SMS')}
                className={`flex-1 px-4 py-2 rounded-md flex items-center justify-center ${
                  communicationType === 'SMS' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <MessageSquare size={16} className="mr-2" />
                SMS
              </button>
              <button
                onClick={() => setCommunicationType('Email')}
                className={`flex-1 px-4 py-2 rounded-md flex items-center justify-center ${
                  communicationType === 'Email' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Mail size={16} className="mr-2" />
                Email
              </button>
            </div>
          </div>

          {/* Quick Outcomes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Quick Outcomes:</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {CALL_OUTCOMES.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => handleQuickTag(tag)}
                  disabled={isSubmitting}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${tag.bgColor} ${
                    selectedTag?.id === tag.id ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ borderColor: tag.color + '40' }}
                >
                  <div className="text-2xl mb-1">{tag.icon}</div>
                  <div className="text-xs font-medium text-gray-800 leading-tight">{tag.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            >
              {DURATION_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder={selectedTag ? selectedTag.autoNote : 'Enter any additional notes...'}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-4 bg-gray-50 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!selectedTag) {
                alert('Please select a quick outcome tag');
                return;
              }
              handleQuickTag(selectedTag);
            }}
            disabled={!selectedTag || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Logging...' : 'Quick Log & Close'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CommunicationModal;
