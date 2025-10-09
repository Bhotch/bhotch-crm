import React, { useState } from 'react';
import {
  X,
  MapPin,
  Phone,
  User,
  Clock,
  Camera,
  FileText,
  Navigation as NavigationIcon,
  Trash2,
  Edit,
  History,
  Image as ImageIcon,
} from 'lucide-react';

/**
 * PropertyDetailSheetEnhanced - Complete property details with photos, notes, and history
 * Inspired by SalesRabbit's detailed property view
 */
const PropertyDetailSheetEnhanced = ({
  property,
  onClose,
  onUpdate,
  onDelete,
  onNavigate,
  onAddVisit,
}) => {
  const [notes, setNotes] = useState(property.notes || '');
  const [ownerName, setOwnerName] = useState(property.owner_name || '');
  const [ownerPhone, setOwnerPhone] = useState(property.owner_phone || '');
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'visits', 'photos'
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    if (onUpdate) {
      onUpdate({
        ...property,
        notes,
        owner_name: ownerName,
        owner_phone: ownerPhone,
        updated_at: new Date().toISOString(),
      });
    }
    setIsEditing(false);
  };

  const handleAddVisitNote = () => {
    const visitNote = window.prompt('Add visit note:');
    if (visitNote && onAddVisit) {
      onAddVisit({
        property_id: property.id,
        notes: visitNote,
        visited_at: new Date().toISOString(),
      });
    }
  };

  const handleCall = () => {
    if (ownerPhone) {
      window.open(`tel:${ownerPhone}`);
    }
  };

  const handleNavigateToProperty = () => {
    if (property.latitude && property.longitude && onNavigate) {
      onNavigate(property);
    } else {
      // Fallback to Google Maps
      const address = encodeURIComponent(property.address);
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-t-2xl rounded-t-2xl sm:rounded-b-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">
                {property.address || 'Unknown Address'}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                }}
              >
                {property.status || 'Not Contacted'}
              </span>
              {property.visit_count > 0 && (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
                  {property.visit_count} Visit{property.visit_count !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'details'
                ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Details
          </button>
          <button
            onClick={() => setActiveTab('visits')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'visits'
                ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <History className="w-4 h-4 inline mr-2" />
            Visit History
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'photos'
                ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ImageIcon className="w-4 h-4 inline mr-2" />
            Photos
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Owner Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Owner Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="owner-name" className="block text-xs font-medium text-gray-700 mb-1">
                      Owner Name
                    </label>
                    <input
                      id="owner-name"
                      name="owner_name"
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                      placeholder="Enter owner name"
                    />
                  </div>
                  <div>
                    <label htmlFor="owner-phone" className="block text-xs font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="owner-phone"
                        name="owner_phone"
                        type="tel"
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(e.target.value)}
                        disabled={!isEditing}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                        placeholder="(555) 555-5555"
                      />
                      {ownerPhone && !isEditing && (
                        <button
                          onClick={handleCall}
                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          title="Call"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </h3>
                <textarea
                  id="property-notes"
                  name="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={!isEditing}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                  placeholder="Add notes about this property..."
                />
              </div>

              {/* Property Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium mb-1">Created</p>
                  <p className="text-sm font-semibold text-blue-900">
                    {property.created_at
                      ? new Date(property.created_at).toLocaleDateString()
                      : 'Unknown'}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <p className="text-xs text-green-600 font-medium mb-1">Last Visit</p>
                  <p className="text-sm font-semibold text-green-900">
                    {property.last_visited_at
                      ? new Date(property.last_visited_at).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
              </div>

              {/* Coordinates */}
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                <p>
                  <strong>Coordinates:</strong> {property.latitude?.toFixed(6)},{' '}
                  {property.longitude?.toFixed(6)}
                </p>
              </div>
            </div>
          )}

          {/* Visit History Tab */}
          {activeTab === 'visits' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Visit Timeline</h3>
                <button
                  onClick={handleAddVisitNote}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
                >
                  + Add Visit
                </button>
              </div>

              {property.visits && property.visits.length > 0 ? (
                <div className="space-y-3">
                  {property.visits.map((visit, index) => (
                    <div
                      key={visit.id || index}
                      className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-600"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-900">
                          {visit.status || property.status}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(visit.visited_at).toLocaleString()}
                        </p>
                      </div>
                      {visit.notes && (
                        <p className="text-sm text-gray-700 mt-2">{visit.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No visits recorded yet</p>
                  <button
                    onClick={handleAddVisitNote}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Add First Visit
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Property Photos</h3>
                <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Add Photo
                </button>
              </div>

              {property.photos && property.photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {property.photos.map((photo, index) => (
                    <div
                      key={photo.id || index}
                      className="relative aspect-square rounded-lg overflow-hidden bg-gray-200"
                    >
                      <img
                        src={photo.url}
                        alt={`Property ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Camera className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-medium">No photos yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Capture photos of the property
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={handleNavigateToProperty}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <NavigationIcon className="w-4 h-4" />
                  Navigate
                </button>
                {onDelete && (
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this property?')) {
                        onDelete(property);
                        onClose();
                      }
                    }}
                    className="px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailSheetEnhanced;
