import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Loader2, AlertCircle, Map } from 'lucide-react';
import { loadGoogleMaps } from '../../services/googleMapsService';

function GoogleMapComponent({ leads, onLeadClick }) {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeMap = async () => {
      try {
        const google = await loadGoogleMaps();
        if (!mapRef.current) return;
        const mapInstance = new google.maps.Map(mapRef.current, { center: { lat: 41.1617, lng: -112.0377 }, zoom: 10, styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }] });
        infoWindowRef.current = new google.maps.InfoWindow();
        setMap(mapInstance);
      } catch (err) { setError(err.message); } 
      finally { setLoading(false); }
    };
    initializeMap();
  }, []);

  useEffect(() => {
    window.viewLeadDetails = (leadId) => {
      const lead = leads.find(l => l.id === leadId);
      if (lead && onLeadClick) onLeadClick(lead);
    };
    return () => { window.viewLeadDetails = null; };
  }, [leads, onLeadClick]);

  useEffect(() => {
    if (!map || !window.google) return;
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    const bounds = new window.google.maps.LatLngBounds();
    const leadsWithCoords = leads.filter(lead => {
      const lat = lead.latitude || lead.lat || lead.geocoded_lat;
      const lng = lead.longitude || lead.lng || lead.geocoded_lng;
      return lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));
    });
    
    leadsWithCoords.forEach(lead => {
        const lat = lead.latitude || lead.lat || lead.geocoded_lat;
        const lng = lead.longitude || lead.lng || lead.geocoded_lng;
        const position = { lat: parseFloat(lat), lng: parseFloat(lng) };
        const marker = new window.google.maps.Marker({ position, map, title: lead.customerName, icon: { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="12" fill="#dc2626" stroke="#ffffff" stroke-width="2"/><circle cx="16" cy="16" r="4" fill="#ffffff"/></svg>`), scaledSize: new window.google.maps.Size(32, 32), anchor: new window.google.maps.Point(16, 16) }});
        marker.addListener('click', () => {
            const content = `<div style="padding: 8px;"><h3 style="margin:0 0 8px 0;">${lead.customerName || ''}</h3><p><strong>Phone:</strong> ${lead.phoneNumber||'N/A'}</p><p><button onclick="window.viewLeadDetails('${lead.id}')" style="background:#3b82f6;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;">View Details</button></p></div>`;
            infoWindowRef.current.setContent(content);
            infoWindowRef.current.open(map, marker);
        });
        markersRef.current.push(marker);
        bounds.extend(position);
    });

    if (leadsWithCoords.length > 0) map.fitBounds(bounds);

  }, [map, leads]);

  if (loading) {
    return (
      <div className="h-[60vh] w-full rounded-lg border border-gray-300 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[60vh] w-full rounded-lg border border-red-300 flex items-center justify-center bg-red-50">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
          <p className="text-red-600 mb-2">Failed to load Google Maps</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className="h-[60vh] w-full rounded-lg overflow-hidden border border-gray-300" />;
}


function MapView({ leads, onLeadClick }) {
  const leadsWithCoords = useMemo(() => leads.filter(lead => 
    (lead.latitude && lead.longitude) || 
    (lead.lat && lead.lng) || 
    (lead.geocoded_lat && lead.geocoded_lng)
  ), [leads]);
  

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Map className="w-8 h-8 mr-3 text-blue-600" /> Customer Locations
        </h2>
        <div className="text-sm text-gray-600">
          Showing {leadsWithCoords.length} of {leads.length} customers on map
        </div>
      </div>
      
      {leadsWithCoords.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center py-12">
            <Map className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Geocoded Locations</h3>
            <p className="text-gray-600 mb-4">
              Your leads don't have location coordinates yet.
            </p>
            <p className="text-sm text-gray-500">
              Location data will appear here once addresses are geocoded.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <GoogleMapComponent leads={leads} onLeadClick={onLeadClick} />
        </div>
      )}
    </div>
  );
}

export default MapView;