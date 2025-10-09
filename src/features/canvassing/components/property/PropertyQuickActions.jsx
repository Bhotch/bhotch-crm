import React from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Phone,
  Clock,
  Home,
  Ban,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

/**
 * PropertyQuickActions - Fast disposition buttons for field sales
 * Inspired by SalesRabbit's one-tap status updates
 */
const PropertyQuickActions = ({ property, onStatusChange, onViewDetails, className = '' }) => {
  const quickActions = [
    {
      status: 'Interested',
      label: 'Interested',
      icon: ThumbsUp,
      color: 'bg-green-500 hover:bg-green-600',
      textColor: 'text-white',
    },
    {
      status: 'Not Interested',
      label: 'Not Interested',
      icon: ThumbsDown,
      color: 'bg-red-500 hover:bg-red-600',
      textColor: 'text-white',
    },
    {
      status: 'Appointment',
      label: 'Set Appointment',
      icon: Calendar,
      color: 'bg-blue-500 hover:bg-blue-600',
      textColor: 'text-white',
    },
    {
      status: 'Callback',
      label: 'Callback',
      icon: Phone,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      textColor: 'text-white',
    },
    {
      status: 'Not Home',
      label: 'Not Home',
      icon: Home,
      color: 'bg-gray-500 hover:bg-gray-600',
      textColor: 'text-white',
    },
    {
      status: 'Sold',
      label: 'Sold!',
      icon: CheckCircle2,
      color: 'bg-purple-500 hover:bg-purple-600',
      textColor: 'text-white',
    },
    {
      status: 'DNC',
      label: 'Do Not Contact',
      icon: Ban,
      color: 'bg-black hover:bg-gray-800',
      textColor: 'text-white',
    },
  ];

  const handleQuickAction = (status) => {
    if (onStatusChange) {
      onStatusChange({
        ...property,
        status,
        last_visited_at: new Date().toISOString(),
        visit_count: (property.visit_count || 0) + 1,
      });
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-4 ${className}`}>
      {/* Property Header */}
      <div className="mb-4 pb-3 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm mb-1">
              {property.address || 'Unknown Address'}
            </h3>
            <div className="flex items-center gap-2">
              <span
                className="inline-block px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: getStatusColor(property.status) + '20',
                  color: getStatusColor(property.status),
                }}
              >
                {property.status || 'Not Contacted'}
              </span>
              {property.visit_count > 0 && (
                <span className="text-xs text-gray-500">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {property.visit_count} visit{property.visit_count !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onViewDetails}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="View full details"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {property.owner_name && (
          <p className="text-sm text-gray-600 mt-2">
            Owner: {property.owner_name}
          </p>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Quick Actions
        </p>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const isCurrentStatus = property.status === action.status;

            return (
              <button
                key={action.status}
                onClick={() => handleQuickAction(action.status)}
                disabled={isCurrentStatus}
                className={`
                  ${action.color} ${action.textColor}
                  px-3 py-2.5 rounded-lg
                  font-medium text-xs
                  transition-all duration-200
                  flex items-center justify-center gap-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                  shadow-sm hover:shadow-md
                  active:scale-95
                  ${isCurrentStatus ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Last Visited Info */}
      {property.last_visited_at && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Last visited: {new Date(property.last_visited_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        </div>
      )}

      {/* Notes Preview */}
      {property.notes && (
        <div className="mt-3 p-2 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-700 line-clamp-2">
            <span className="font-medium">Notes:</span> {property.notes}
          </p>
        </div>
      )}
    </div>
  );
};

// Helper function to get status colors
const getStatusColor = (status) => {
  const colors = {
    'Not Contacted': '#9CA3AF',
    'Interested': '#10B981',
    'Appointment': '#3B82F6',
    'Sold': '#8B5CF6',
    'Not Interested': '#EF4444',
    'Callback': '#F59E0B',
    'Not Home': '#6B7280',
    'DNC': '#1F2937',
  };
  return colors[status] || '#9CA3AF';
};

/**
 * PropertyQuickActionsCompact - Minimal version for mobile/overlay
 */
export const PropertyQuickActionsCompact = ({ property, onStatusChange }) => {
  const compactActions = [
    { status: 'Interested', icon: ThumbsUp, color: 'bg-green-500' },
    { status: 'Not Interested', icon: ThumbsDown, color: 'bg-red-500' },
    { status: 'Appointment', icon: Calendar, color: 'bg-blue-500' },
    { status: 'Not Home', icon: Home, color: 'bg-gray-500' },
  ];

  return (
    <div className="flex gap-2 p-2 bg-white rounded-lg shadow-lg">
      {compactActions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.status}
            onClick={() => onStatusChange({ ...property, status: action.status })}
            className={`${action.color} p-3 rounded-lg text-white hover:opacity-90 transition-opacity`}
            title={action.status}
          >
            <Icon className="w-5 h-5" />
          </button>
        );
      })}
    </div>
  );
};

export default PropertyQuickActions;
