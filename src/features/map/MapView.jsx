import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Loader2, AlertCircle, Map, MapPin, Navigation, Layers, Search } from 'lucide-react';
import { loadGoogleMaps } from '../../services/googleMapsService';

function GoogleMapComponent({ leads, onLeadClick, showDemoData, mapType, showTraffic, searchAddress, onSearchComplete }) {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const trafficLayerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Demo data for when no real leads exist
  const demoLeads = useMemo(() => [
    { id: 'demo1', customerName: 'John Smith', phoneNumber: '555-0123', address: '123 Main St, Ogden, UT', quality: 'Hot', latitude: 41.2230, longitude: -111.9738 },
    { id: 'demo2', customerName: 'Sarah Johnson', phoneNumber: '555-0456', address: '456 Oak Ave, Salt Lake City, UT', quality: 'Warm', latitude: 40.7608, longitude: -111.8910 },
    { id: 'demo3', customerName: 'Mike Wilson', phoneNumber: '555-0789', address: '789 Pine St, Provo, UT', quality: 'Cold', latitude: 40.2338, longitude: -111.6585 },
    { id: 'demo4', customerName: 'Emily Davis', phoneNumber: '555-0321', address: '321 Elm Dr, West Valley, UT', quality: 'Hot', latitude: 40.6916, longitude: -112.0011 },
    { id: 'demo5', customerName: 'Chris Brown', phoneNumber: '555-0654', address: '654 Cedar Ln, Layton, UT', quality: 'Warm', latitude: 41.0602, longitude: -111.9711 }
  ], []);

  // Use demo data if showDemoData is true, otherwise use all leads (with and without coords)
  const dataToShow = showDemoData ? demoLeads : leads;

  // Separate leads with and without coordinates
  const leadsWithCoords = dataToShow.filter(lead => {
    const lat = lead.latitude || lead.lat || lead.geocoded_lat;
    const lng = lead.longitude || lead.lng || lead.geocoded_lng;
    return lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));
  });

  const leadsWithoutCoords = dataToShow.filter(lead => {
    const lat = lead.latitude || lead.lat || lead.geocoded_lat;
    const lng = lead.longitude || lead.lng || lead.geocoded_lng;
    return !lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng));
  });

  const getMarkerColor = useCallback((quality) => {
    switch (quality) {
      case 'Hot': return '#dc2626';
      case 'Warm': return '#f59e0b';
      case 'Cold': return '#3b82f6';
      default: return '#6b7280';
    }
  }, []);

  const createMarkerIcon = useCallback((quality) => {
    const color = getMarkerColor(quality);
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
        `<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 2c-7.7 0-14 6.3-14 14 0 10.5 14 18 14 18s14-7.5 14-18c0-7.7-6.3-14-14-14z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
          <circle cx="18" cy="16" r="6" fill="#ffffff"/>
          <circle cx="18" cy="16" r="3" fill="${color}"/>
        </svg>`
      ),
      scaledSize: new window.google.maps.Size(36, 36),
      anchor: new window.google.maps.Point(18, 36)
    };
  }, [getMarkerColor]);

  useEffect(() => {
    const initializeMap = async () => {
      try {
        const google = await loadGoogleMaps();
        if (!mapRef.current) return;

        const mapStyles = [
          { featureType: "poi.business", stylers: [{ visibility: "off" }] },
          { featureType: "poi.park", elementType: "labels.text", stylers: [{ visibility: "off" }] }
        ];

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat: 40.7608, lng: -111.8910 }, // Salt Lake City center
          zoom: 9,
          styles: mapStyles,
          mapTypeId: mapType,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true
        });

        // Initialize traffic layer
        trafficLayerRef.current = new google.maps.TrafficLayer();
        if (showTraffic) {
          trafficLayerRef.current.setMap(mapInstance);
        }

        infoWindowRef.current = new google.maps.InfoWindow();
        setMap(mapInstance);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    initializeMap();
  }, [mapType, showTraffic]);

  // Update traffic layer visibility
  useEffect(() => {
    if (trafficLayerRef.current && map) {
      trafficLayerRef.current.setMap(showTraffic ? map : null);
    }
  }, [showTraffic, map]);

  // Handle address search when searchAddress changes
  useEffect(() => {
    if (!map || !window.google || !searchAddress) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: searchAddress }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        map.setCenter(location);
        map.setZoom(15);

        // Add a marker for the searched address
        new window.google.maps.Marker({
          position: location,
          map,
          title: searchAddress,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4F46E5',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });
      }
      // Clear the search address after processing
      if (onSearchComplete) onSearchComplete();
    });
  }, [map, searchAddress, onSearchComplete]);

  useEffect(() => {
    window.viewLeadDetails = (leadId) => {
      const lead = dataToShow.find(l => l.id === leadId);
      if (lead && onLeadClick) onLeadClick(lead);
    };
    return () => { window.viewLeadDetails = null; };
  }, [dataToShow, onLeadClick]);

  useEffect(() => {
    if (!map || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();

    leadsWithCoords.forEach(lead => {
      const lat = lead.latitude || lead.lat || lead.geocoded_lat;
      const lng = lead.longitude || lead.lng || lead.geocoded_lng;
      const position = { lat: parseFloat(lat), lng: parseFloat(lng) };

      const marker = new window.google.maps.Marker({
        position,
        map,
        title: lead.customerName,
        icon: createMarkerIcon(lead.quality),
        animation: window.google.maps.Animation.DROP
      });

      marker.addListener('click', () => {
        const content = `
          <div style="padding: 12px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
              ${lead.customerName || 'Unknown'}
            </h3>
            <div style="margin-bottom: 8px;">
              <strong style="color: #374151;">Phone:</strong>
              <a href="tel:${lead.phoneNumber}" style="color: #3b82f6; text-decoration: none;">
                ${lead.phoneNumber || 'N/A'}
              </a>
            </div>
            <div style="margin-bottom: 8px;">
              <strong style="color: #374151;">Quality:</strong>
              <span style="background: ${getMarkerColor(lead.quality)}20; color: ${getMarkerColor(lead.quality)}; padding: 2px 6px; border-radius: 4px; font-size: 12px;">
                ${lead.quality}
              </span>
            </div>
            ${lead.address ? `<div style="margin-bottom: 12px; color: #6b7280; font-size: 14px;">${lead.address}</div>` : ''}
            <button onclick="window.viewLeadDetails('${lead.id}')"
                    style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
              View Details
            </button>
          </div>
        `;
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(map, marker);
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    if (leadsWithCoords.length > 0) {
      map.fitBounds(bounds);
      // Ensure reasonable zoom level
      window.google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
        if (map.getZoom() > 15) map.setZoom(15);
      });
    }
  }, [map, leadsWithCoords, createMarkerIcon, getMarkerColor, onLeadClick]);

  if (loading) {
    return (
      <div className="h-[70vh] w-full rounded-lg border border-gray-300 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600 text-lg">Loading Interactive Map...</p>
          <p className="text-gray-500 text-sm mt-1">Connecting to Google Maps</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[70vh] w-full rounded-lg border border-red-300 flex items-center justify-center bg-red-50">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Map Loading Failed</h3>
          <p className="text-red-600 mb-3">{error}</p>
          <p className="text-sm text-gray-600">
            Please check your Google Maps API key configuration and internet connection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div ref={mapRef} className="h-[70vh] w-full rounded-lg overflow-hidden border border-gray-300 shadow-sm" />

      {/* Show leads without coordinates if any exist */}
      {!showDemoData && leadsWithoutCoords.length > 0 && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-yellow-800 mb-3 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            Leads Without Location Data ({leadsWithoutCoords.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {leadsWithoutCoords.slice(0, 4).map(lead => (
              <div key={lead.id} className="bg-white p-3 rounded border border-yellow-200 hover:shadow-sm transition-shadow cursor-pointer"
                   onClick={() => onLeadClick && onLeadClick(lead)}>
                <div className="font-medium text-gray-900">{lead.customerName || 'Unknown'}</div>
                <div className="text-sm text-gray-600">{lead.phoneNumber || 'No phone'}</div>
                <div className="text-xs text-gray-500">{lead.address || 'No address provided'}</div>
              </div>
            ))}
          </div>
          {leadsWithoutCoords.length > 4 && (
            <div className="mt-3 text-sm text-yellow-700">
              And {leadsWithoutCoords.length - 4} more leads without coordinates...
            </div>
          )}
        </div>
      )}
    </div>
  );
}


function MapView({ leads, onLeadClick, searchAddress, onSearchComplete }) {
  const [showDemoData, setShowDemoData] = useState(false);
  const [mapType, setMapType] = useState('roadmap');
  const [showTraffic, setShowTraffic] = useState(false);

  const leadsWithCoords = useMemo(() => leads.filter(lead =>
    (lead.latitude && lead.longitude) ||
    (lead.lat && lead.lng) ||
    (lead.geocoded_lat && lead.geocoded_lng)
  ), [leads]);

  const hasRealData = leadsWithCoords.length > 0;

  const qualityStats = useMemo(() => {
    const dataToAnalyze = showDemoData ? [
      { quality: 'Hot' }, { quality: 'Hot' }, { quality: 'Warm' }, { quality: 'Warm' }, { quality: 'Cold' }
    ] : leads;

    return {
      hot: dataToAnalyze.filter(l => l.quality === 'Hot').length,
      warm: dataToAnalyze.filter(l => l.quality === 'Warm').length,
      cold: dataToAnalyze.filter(l => l.quality === 'Cold').length,
      total: dataToAnalyze.length,
      mapped: leadsWithCoords.length
    };
  }, [leads, leadsWithCoords, showDemoData]);

  return (
    <div className="space-y-6">
      {/* Header with enhanced controls */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center">
            <MapPin className="w-8 h-8 mr-3 text-blue-600" />
            Customer Locations
          </h2>
          <p className="text-gray-600 mt-1">
            Interactive map showing customer locations with lead quality indicators
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Data Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setShowDemoData(false)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                !showDemoData ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Real Data ({leads.length})
            </button>
            <button
              onClick={() => setShowDemoData(true)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                showDemoData ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Demo Data (5)
            </button>
          </div>

          {/* Map Type Selector */}
          <select
            value={mapType}
            onChange={(e) => setMapType(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="roadmap">Road Map</option>
            <option value="satellite">Satellite</option>
            <option value="hybrid">Hybrid</option>
            <option value="terrain">Terrain</option>
          </select>

          {/* Traffic Toggle */}
          <button
            onClick={() => setShowTraffic(!showTraffic)}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
              showTraffic
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Navigation className="w-4 h-4 mr-2" />
            Traffic
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Hot Leads</p>
              <p className="text-2xl font-semibold text-gray-900">{qualityStats.hot}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Warm Leads</p>
              <p className="text-2xl font-semibold text-gray-900">{qualityStats.warm}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Cold Leads</p>
              <p className="text-2xl font-semibold text-gray-900">{qualityStats.cold}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <MapPin className="w-4 h-4 text-gray-600" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Mapped</p>
              <p className="text-2xl font-semibold text-gray-900">{showDemoData ? 5 : qualityStats.mapped}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      {!hasRealData && !showDemoData ? (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center py-12">
            <Map className="mx-auto h-20 w-20 text-gray-400 mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No Location Data Available</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Your leads don't have geocoded coordinates yet. Add addresses to your leads or use demo data to see the map in action.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowDemoData(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Map className="w-4 h-4 mr-2" />
                View Demo Data
              </button>
              <button className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Search className="w-4 h-4 mr-2" />
                Learn About Geocoding
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-900">Interactive Map</h3>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                    Hot ({qualityStats.hot})
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
                    Warm ({qualityStats.warm})
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                    Cold ({qualityStats.cold})
                  </div>
                </div>
              </div>
              {showDemoData && (
                <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  <Layers className="w-4 h-4 mr-1" />
                  Demo Mode
                </div>
              )}
            </div>
          </div>
          <GoogleMapComponent
            leads={leads}
            onLeadClick={onLeadClick}
            showDemoData={showDemoData}
            mapType={mapType}
            showTraffic={showTraffic}
            searchAddress={searchAddress}
            onSearchComplete={onSearchComplete}
          />
        </div>
      )}
    </div>
  );
}

export default MapView;