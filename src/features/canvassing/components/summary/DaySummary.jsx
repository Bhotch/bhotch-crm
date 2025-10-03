import React, { useMemo } from 'react';
import {
  X,
  MapPin,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Download,
} from 'lucide-react';
import { useCanvassingStore } from '../../store/canvassingStore';
import { PROPERTY_STATUS } from '../map/PropertyMarker';
import { format } from 'date-fns';

/**
 * DaySummary Component
 * End-of-day summary showing all properties visited/pinned with their actions
 */
const DaySummary = ({ onClose, date = new Date() }) => {
  const { properties } = useCanvassingStore();

  // Filter properties with actions from today
  const todayProperties = useMemo(() => {
    const today = new Date(date);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return properties.filter(property => {
      // Include if property was created today
      if (property.createdAt) {
        const createdDate = new Date(property.createdAt);
        if (createdDate >= today && createdDate < tomorrow) {
          return true;
        }
      }

      // Include if property has visits from today
      if (property.visits && property.visits.length > 0) {
        return property.visits.some(visit => {
          if (visit.timestamp) {
            const visitDate = new Date(visit.timestamp);
            return visitDate >= today && visitDate < tomorrow;
          }
          return false;
        });
      }

      return false;
    });
  }, [properties, date]);

  // Group properties by status
  const groupedByStatus = useMemo(() => {
    const groups = {};
    todayProperties.forEach(property => {
      const status = property.status || PROPERTY_STATUS.NOT_CONTACTED;
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(property);
    });
    return groups;
  }, [todayProperties]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: todayProperties.length,
      needsInspection: groupedByStatus[PROPERTY_STATUS.NEEDS_INSPECTION]?.length || 0,
      knockNotHome: groupedByStatus[PROPERTY_STATUS.KNOCK_NOT_HOME]?.length || 0,
      followUpNeeded: groupedByStatus[PROPERTY_STATUS.FOLLOW_UP_NEEDED]?.length || 0,
      doorHanger: groupedByStatus[PROPERTY_STATUS.DOOR_HANGER]?.length || 0,
      interested: groupedByStatus[PROPERTY_STATUS.INTERESTED]?.length || 0,
      appointments: groupedByStatus[PROPERTY_STATUS.APPOINTMENT]?.length || 0,
    };
  }, [groupedByStatus]);

  const exportSummary = () => {
    const dateStr = format(date, 'yyyy-MM-dd');
    let csvContent = 'Address,Status,Notes,Time\n';

    todayProperties.forEach(property => {
      const address = (property.address || 'Unknown').replace(/,/g, ' ');
      const status = (property.status || 'not_contacted').replace(/_/g, ' ');
      const latestVisit = property.visits?.[property.visits.length - 1];
      const notes = latestVisit?.notes ? latestVisit.notes.replace(/,/g, ' ') : '';
      const time = property.createdAt ? format(new Date(property.createdAt), 'HH:mm') : '';

      csvContent += `"${address}","${status}","${notes}","${time}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canvassing-summary-${dateStr}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    const colors = {
      [PROPERTY_STATUS.NEEDS_INSPECTION]: 'bg-orange-50 border-orange-200',
      [PROPERTY_STATUS.KNOCK_NOT_HOME]: 'bg-gray-50 border-gray-200',
      [PROPERTY_STATUS.FOLLOW_UP_NEEDED]: 'bg-yellow-50 border-yellow-200',
      [PROPERTY_STATUS.DOOR_HANGER]: 'bg-purple-50 border-purple-200',
      [PROPERTY_STATUS.INTERESTED]: 'bg-green-50 border-green-200',
      [PROPERTY_STATUS.APPOINTMENT]: 'bg-blue-50 border-blue-200',
    };
    return colors[status] || 'bg-gray-50 border-gray-200';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case PROPERTY_STATUS.NEEDS_INSPECTION:
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case PROPERTY_STATUS.KNOCK_NOT_HOME:
        return <Clock className="w-4 h-4 text-gray-600" />;
      case PROPERTY_STATUS.FOLLOW_UP_NEEDED:
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case PROPERTY_STATUS.DOOR_HANGER:
        return <FileText className="w-4 h-4 text-purple-600" />;
      case PROPERTY_STATUS.INTERESTED:
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case PROPERTY_STATUS.APPOINTMENT:
        return <Calendar className="w-4 h-4 text-blue-600" />;
      default:
        return <MapPin className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Day Summary</h2>
              <p className="text-blue-100 text-sm">{format(date, 'EEEE, MMMM d, yyyy')}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportSummary}
              className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-all flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 p-6 bg-gray-50 border-b">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-600">Total Pins</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.needsInspection}</div>
            <div className="text-xs text-gray-600">Needs Inspection</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.knockNotHome}</div>
            <div className="text-xs text-gray-600">Not Home</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.followUpNeeded}</div>
            <div className="text-xs text-gray-600">Follow-up</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.doorHanger}</div>
            <div className="text-xs text-gray-600">Door Hangers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.interested}</div>
            <div className="text-xs text-gray-600">Interested</div>
          </div>
        </div>

        {/* Properties List */}
        <div className="flex-1 overflow-y-auto p-6">
          {todayProperties.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Properties Yet</h3>
              <p className="text-gray-500">Start pinning properties on the map to see them here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedByStatus).map(([status, props]) => (
                <div key={status}>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                    {getStatusIcon(status)}
                    <span className="ml-2">
                      {status.replace(/_/g, ' ').toUpperCase()} ({props.length})
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {props.map((property) => (
                      <div
                        key={property.id}
                        className={`border rounded-lg p-4 ${getStatusColor(status)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-start space-x-3">
                              <MapPin className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">
                                  {property.address || property.streetAddress || 'Unknown Address'}
                                </h4>
                                {property.customerName && (
                                  <p className="text-sm text-gray-600 mt-1">{property.customerName}</p>
                                )}
                                {property.visits && property.visits.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {property.visits
                                      .filter(visit => {
                                        const visitDate = new Date(visit.timestamp);
                                        const today = new Date(date);
                                        today.setHours(0, 0, 0, 0);
                                        return visitDate >= today;
                                      })
                                      .map((visit, idx) => (
                                        <div key={idx} className="text-xs text-gray-600 bg-white bg-opacity-50 rounded px-2 py-1">
                                          <span className="font-medium">
                                            {format(new Date(visit.timestamp), 'h:mm a')}:
                                          </span>{' '}
                                          {visit.notes || visit.type?.replace(/_/g, ' ')}
                                        </div>
                                      ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          {property.phoneNumber && (
                            <a
                              href={`tel:${property.phoneNumber}`}
                              className="ml-3 text-blue-600 hover:text-blue-700 text-sm"
                            >
                              Call
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {todayProperties.length > 0 && (
          <div className="border-t px-6 py-4 bg-gray-50">
            <p className="text-sm text-gray-600 text-center">
              Great work! You've logged {stats.total} properties today.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DaySummary;
