import React, { useMemo } from 'react';
import { Home, Phone, Calendar, DollarSign, Ban, Star, Clock } from 'lucide-react';

/**
 * Property status definitions
 */
export const PROPERTY_STATUS = {
  NOT_CONTACTED: 'not_contacted',
  INTERESTED: 'interested',
  NOT_INTERESTED: 'not_interested',
  CALLBACK: 'callback',
  APPOINTMENT: 'appointment',
  SOLD: 'sold',
  DNC: 'dnc', // Do Not Contact
  NOT_HOME: 'not_home',
  NEEDS_INSPECTION: 'needs_inspection',
  KNOCK_NOT_HOME: 'knock_not_home',
  FOLLOW_UP_NEEDED: 'follow_up_needed',
  DOOR_HANGER: 'door_hanger',
};

/**
 * Get color based on property status and quality
 */
const getMarkerColor = (status, quality) => {
  // Status takes priority over quality
  switch (status) {
    case PROPERTY_STATUS.SOLD:
      return '#8B5CF6'; // Purple - highest priority
    case PROPERTY_STATUS.APPOINTMENT:
      return '#3B82F6'; // Blue
    case PROPERTY_STATUS.INTERESTED:
      return '#10B981'; // Green
    case PROPERTY_STATUS.CALLBACK:
      return '#F59E0B'; // Amber
    case PROPERTY_STATUS.NOT_HOME:
      return '#6B7280'; // Gray
    case PROPERTY_STATUS.NOT_INTERESTED:
      return '#EF4444'; // Red
    case PROPERTY_STATUS.DNC:
      return '#1F2937'; // Dark gray
    // New canvassing-specific statuses
    case PROPERTY_STATUS.NEEDS_INSPECTION:
      return '#F97316'; // Orange
    case PROPERTY_STATUS.KNOCK_NOT_HOME:
      return '#9CA3AF'; // Gray
    case PROPERTY_STATUS.FOLLOW_UP_NEEDED:
      return '#EAB308'; // Yellow
    case PROPERTY_STATUS.DOOR_HANGER:
      return '#A855F7'; // Purple
    default:
      // Use quality for not contacted
      switch (quality?.toLowerCase()) {
        case 'hot':
          return '#DC2626'; // Bright red
        case 'warm':
          return '#F59E0B'; // Orange
        case 'cold':
          return '#3B82F6'; // Blue
        default:
          return '#9CA3AF'; // Light gray
      }
  }
};

/**
 * Get icon based on property status
 */
const getStatusIcon = (status) => {
  switch (status) {
    case PROPERTY_STATUS.SOLD:
      return DollarSign;
    case PROPERTY_STATUS.APPOINTMENT:
      return Calendar;
    case PROPERTY_STATUS.INTERESTED:
      return Star;
    case PROPERTY_STATUS.CALLBACK:
      return Phone;
    case PROPERTY_STATUS.NOT_HOME:
      return Clock;
    case PROPERTY_STATUS.DNC:
      return Ban;
    default:
      return Home;
  }
};

/**
 * PropertyMarker Component
 * Displays a property pin on the map with status and quality indicators
 */
const PropertyMarker = ({ property, onClick, isSelected, showLabel = false }) => {
  const color = useMemo(
    () => getMarkerColor(property.status, property.quality),
    [property.status, property.quality]
  );

  const Icon = useMemo(() => getStatusIcon(property.status), [property.status]);

  const markerSize = isSelected ? 44 : 36;
  const iconSize = isSelected ? 20 : 16;

  return (
    <div
      className="property-marker-container"
      style={{
        position: 'relative',
        cursor: 'pointer',
        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 0.2s ease-in-out',
        zIndex: isSelected ? 1000 : property.priority === 'high' ? 500 : 100,
      }}
      onClick={onClick}
    >
      {/* Main marker pin */}
      <svg
        width={markerSize}
        height={markerSize}
        viewBox="0 0 36 36"
        style={{
          filter: isSelected ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
        }}
      >
        {/* Pin shape */}
        <path
          d="M18 2c-7.7 0-14 6.3-14 14 0 10.5 14 18 14 18s14-7.5 14-18c0-7.7-6.3-14-14-14z"
          fill={color}
          stroke="#ffffff"
          strokeWidth="2"
        />

        {/* Inner circle */}
        <circle cx="18" cy="16" r="8" fill="#ffffff" opacity="0.9" />

        {/* Status icon */}
        <foreignObject x="10" y="8" width="16" height="16">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Icon size={iconSize} color={color} />
          </div>
        </foreignObject>

        {/* High priority indicator */}
        {property.priority === 'high' && (
          <circle cx="26" cy="8" r="4" fill="#EF4444" stroke="#ffffff" strokeWidth="1">
            <animate attributeName="r" values="4;5;4" dur="1.5s" repeatCount="indefinite" />
          </circle>
        )}
      </svg>

      {/* Label (optional) */}
      {showLabel && (
        <div
          className="marker-label"
          style={{
            position: 'absolute',
            top: markerSize + 4,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
            fontSize: '12px',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            color: '#1F2937',
          }}
        >
          {property.address?.split(',')[0] || 'Unknown Address'}
        </div>
      )}

      {/* Visit count indicator */}
      {property.visits?.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            backgroundColor: '#3B82F6',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold',
            border: '2px solid white',
          }}
        >
          {property.visits.length}
        </div>
      )}
    </div>
  );
};

export default PropertyMarker;

/**
 * Create SVG marker icon for Google Maps
 * This version returns a data URI for use with Google Maps API
 */
export const createPropertyMarkerIcon = (property, isSelected = false) => {
  const color = getMarkerColor(property.status, property.quality);
  const size = isSelected ? 44 : 36;

  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path
        d="M18 2c-7.7 0-14 6.3-14 14 0 10.5 14 18 14 18s14-7.5 14-18c0-7.7-6.3-14-14-14z"
        fill="${color}"
        stroke="#ffffff"
        stroke-width="2"
        filter="url(#shadow)"
      />
      <circle cx="18" cy="16" r="6" fill="#ffffff"/>
      <circle cx="18" cy="16" r="3" fill="${color}"/>
      ${
        property.priority === 'high'
          ? '<circle cx="26" cy="8" r="4" fill="#EF4444" stroke="#ffffff" stroke-width="1"/>'
          : ''
      }
    </svg>
  `;

  // Check if Google Maps API is loaded
  if (!window.google?.maps) {
    console.warn('[PropertyMarker] Google Maps not loaded yet, using basic icon');
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    };
  }

  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new window.google.maps.Size(size, size),
    anchor: new window.google.maps.Point(size / 2, size),
  };
};
