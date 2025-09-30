import React from 'react';

/**
 * Communication Indicators Component
 * Shows visual indicators for recent communication activity on a lead
 */
function CommunicationIndicators({ lead, communications = [] }) {
  // Filter communications for this specific lead
  const leadComms = communications.filter(comm => comm.leadId === lead.id);

  // Get the most recent 3 communications
  const recentComms = leadComms
    .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
    .slice(0, 3);

  if (recentComms.length === 0) {
    return <span className="text-xs text-gray-400">No activity</span>;
  }

  return (
    <div className="flex gap-1">
      {recentComms.map((comm, index) => {
        let icon = '';
        let title = '';
        let bgColor = '';

        switch (comm.status) {
          case 'No Answer':
            icon = '📵';
            title = `No Answer - ${new Date(comm.dateTime).toLocaleDateString()}`;
            bgColor = 'bg-red-100';
            break;
          case 'Left Voicemail':
            icon = '📭';
            title = `Left Voicemail - ${new Date(comm.dateTime).toLocaleDateString()}`;
            bgColor = 'bg-orange-100';
            break;
          case 'Completed':
            if (comm.notes?.includes('confirmed')) {
              icon = '✅';
              title = `Confirmed - ${new Date(comm.dateTime).toLocaleDateString()}`;
              bgColor = 'bg-green-100';
            } else if (comm.notes?.includes('not interested')) {
              icon = '❌';
              title = `Not Interested - ${new Date(comm.dateTime).toLocaleDateString()}`;
              bgColor = 'bg-gray-100';
            } else {
              icon = '📞';
              title = `${comm.communicationType} - ${new Date(comm.dateTime).toLocaleDateString()}`;
              bgColor = 'bg-blue-100';
            }
            break;
          default:
            icon = '📞';
            title = `${comm.communicationType} - ${new Date(comm.dateTime).toLocaleDateString()}`;
            bgColor = 'bg-gray-100';
        }

        return (
          <div
            key={comm.id || index}
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${bgColor} text-xs cursor-help`}
            title={`${title}\n${comm.notes || ''}`}
          >
            {icon}
          </div>
        );
      })}
      {leadComms.length > 3 && (
        <span className="text-xs text-gray-500 self-center">
          +{leadComms.length - 3} more
        </span>
      )}
    </div>
  );
}

export default CommunicationIndicators;
