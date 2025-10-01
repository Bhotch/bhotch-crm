import React, { useState } from 'react';
import {
  X,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  Star,
  Edit,
  Trash2,
  MessageCircle,
  FileText,
  DollarSign,
  Home,
  User,
  TrendingUp,
} from 'lucide-react';
import { useCanvassingStore } from '../../store/canvassingStore';
import { PROPERTY_STATUS } from '../map/PropertyMarker';
import { format } from 'date-fns';

/**
 * PropertyDetailSheet Component
 * Bottom sheet that displays detailed property information
 */
const PropertyDetailSheet = ({ property, onClose, onEdit, onDelete, onAddVisit }) => {
  const { updateProperty, addVisit } = useCanvassingStore();
  const [activeTab, setActiveTab] = useState('details'); // details, visits, notes

  const [newNote, setNewNote] = useState('');
  const [quickStatus, setQuickStatus] = useState(property.status);

  if (!property) return null;

  const handleStatusChange = (newStatus) => {
    setQuickStatus(newStatus);
    updateProperty(property.id, { status: newStatus });

    // Add visit log
    addVisit(property.id, {
      type: 'status_change',
      status: newStatus,
      notes: `Status changed to ${newStatus}`,
    });
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    addVisit(property.id, {
      type: 'note',
      notes: newNote,
    });

    setNewNote('');
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      [PROPERTY_STATUS.SOLD]: 'bg-purple-100 text-purple-800',
      [PROPERTY_STATUS.APPOINTMENT]: 'bg-blue-100 text-blue-800',
      [PROPERTY_STATUS.INTERESTED]: 'bg-green-100 text-green-800',
      [PROPERTY_STATUS.CALLBACK]: 'bg-yellow-100 text-yellow-800',
      [PROPERTY_STATUS.NOT_HOME]: 'bg-gray-100 text-gray-800',
      [PROPERTY_STATUS.NOT_INTERESTED]: 'bg-red-100 text-red-800',
      [PROPERTY_STATUS.DNC]: 'bg-gray-900 text-white',
      [PROPERTY_STATUS.NOT_CONTACTED]: 'bg-gray-50 text-gray-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-30 animate-fade-in">
      <div className="w-full max-w-2xl bg-white rounded-t-2xl shadow-2xl max-h-[85vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <MapPin className="w-6 h-6 text-white" />
            <div className="text-white flex-1">
              <h3 className="text-lg font-semibold truncate">
                {property.address || 'Unknown Address'}
              </h3>
              <p className="text-blue-100 text-sm">
                {property.customerName || property.ownerName || 'Property Owner'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-3 bg-gray-50 border-b flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(quickStatus)}`}>
              {quickStatus?.replace('_', ' ').toUpperCase() || 'NOT CONTACTED'}
            </span>
            {property.quality && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                property.quality === 'Hot'
                  ? 'bg-red-100 text-red-800'
                  : property.quality === 'Warm'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                <Star className="w-3 h-3 inline mr-1" />
                {property.quality}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit?.(property)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Edit Property"
            >
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => onDelete?.(property)}
              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
              title="Delete Property"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Home className="w-4 h-4 inline mr-2" />
              Details
            </button>
            <button
              onClick={() => setActiveTab('visits')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'visits'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Visits ({property.visits?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'notes'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Notes
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)]">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </button>
                <button className="flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </button>
              </div>

              {/* Quick Status Update */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Status Update
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(PROPERTY_STATUS).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        quickStatus === status
                          ? getStatusBadgeColor(status)
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {status.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Property Information */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Property Information
                </h4>
                {property.phoneNumber && (
                  <div className="flex items-center text-sm">
                    <Phone className="w-4 h-4 mr-3 text-gray-400" />
                    <span className="text-gray-600">Phone:</span>
                    <a href={`tel:${property.phoneNumber}`} className="ml-2 text-blue-600 hover:underline">
                      {property.phoneNumber}
                    </a>
                  </div>
                )}
                {property.email && (
                  <div className="flex items-center text-sm">
                    <Mail className="w-4 h-4 mr-3 text-gray-400" />
                    <span className="text-gray-600">Email:</span>
                    <a href={`mailto:${property.email}`} className="ml-2 text-blue-600 hover:underline truncate">
                      {property.email}
                    </a>
                  </div>
                )}
                {property.propertyValue && (
                  <div className="flex items-center text-sm">
                    <DollarSign className="w-4 h-4 mr-3 text-gray-400" />
                    <span className="text-gray-600">Est. Value:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      ${property.propertyValue.toLocaleString()}
                    </span>
                  </div>
                )}
                {property.lastVisitDate && (
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                    <span className="text-gray-600">Last Visit:</span>
                    <span className="ml-2 text-gray-900">
                      {format(new Date(property.lastVisitDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
              </div>

              {/* Lead Score */}
              {property.leadScore !== undefined && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Lead Score
                    </span>
                    <span className="text-2xl font-bold text-blue-600">{property.leadScore}/100</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${property.leadScore}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'visits' && (
            <div className="space-y-3">
              {property.visits && property.visits.length > 0 ? (
                property.visits.map((visit, index) => (
                  <div key={visit.id || index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">
                        {format(new Date(visit.timestamp), 'MMM d, yyyy h:mm a')}
                      </span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {visit.type?.replace('_', ' ') || 'Visit'}
                      </span>
                    </div>
                    {visit.notes && <p className="text-sm text-gray-700">{visit.notes}</p>}
                    {visit.status && (
                      <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${getStatusBadgeColor(visit.status)}`}>
                        {visit.status.replace('_', ' ').toUpperCase()}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No visits recorded yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note about this property..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows="4"
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add Note
                </button>
              </div>

              {property.notes && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-medium text-gray-900">Previous Notes</h4>
                  {typeof property.notes === 'string' ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700">{property.notes}</p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailSheet;
