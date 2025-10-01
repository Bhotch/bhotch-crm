import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Square, Circle, Trash2, Save, X, MapPin } from 'lucide-react';
import { useCanvassingStore } from '../../store/canvassingStore';
import { useTerritories } from '../../hooks/useTerritories';
import { calculateTerritoryArea, getTerritoryCenter } from '../../utils/geoUtils';

/**
 * TerritoryDrawingTool Component
 * Advanced territory creation with hand-drawing, shapes, and ZIP code import
 */
const TerritoryDrawingTool = ({ map, onClose }) => {
  const [drawingMode, setDrawingMode] = useState(null); // 'polygon', 'rectangle', 'circle', null
  const [territoryName, setTerritoryName] = useState('');
  const [territoryColor, setTerritoryColor] = useState('#3B82F6');
  // const [assignedReps, setAssignedReps] = useState([]); // Reserved for future use
  const [coordinates, setCoordinates] = useState([]);
  const [stats, setStats] = useState({ area: 0, center: null });

  const drawingManagerRef = useRef(null);
  const currentShapeRef = useRef(null);

  const { createTerritory } = useTerritories();
  const { setDrawingMode: setStoreDrawingMode } = useCanvassingStore();

  // Initialize Google Maps Drawing Manager
  useEffect(() => {
    if (!map || !window.google) return;

    const drawingManager = new window.google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      polygonOptions: {
        fillColor: territoryColor,
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: territoryColor,
        editable: true,
        draggable: true,
      },
      rectangleOptions: {
        fillColor: territoryColor,
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: territoryColor,
        editable: true,
        draggable: true,
      },
      circleOptions: {
        fillColor: territoryColor,
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: territoryColor,
        editable: true,
        draggable: true,
      },
    });

    drawingManager.setMap(map);
    drawingManagerRef.current = drawingManager;

    // Listen for shape completion
    window.google.maps.event.addListener(drawingManager, 'overlaycomplete', (event) => {
      const shape = event.overlay;
      currentShapeRef.current = shape;

      // Extract coordinates based on shape type
      let coords = [];
      if (event.type === 'polygon') {
        const path = shape.getPath();
        const pathArray = path.getArray();
        coords = pathArray.map((latLng) => [latLng.lng(), latLng.lat()]);
        coords.push(coords[0]); // Close the polygon
      } else if (event.type === 'rectangle') {
        const bounds = shape.getBounds();
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        coords = [
          [sw.lng(), ne.lat()],
          [ne.lng(), ne.lat()],
          [ne.lng(), sw.lat()],
          [sw.lng(), sw.lat()],
          [sw.lng(), ne.lat()],
        ];
      } else if (event.type === 'circle') {
        // Convert circle to polygon approximation
        const center = shape.getCenter();
        const radius = shape.getRadius();
        const numPoints = 32;
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * 2 * Math.PI;
          const lat = center.lat() + (radius / 111000) * Math.cos(angle);
          const lng = center.lng() + (radius / (111000 * Math.cos(center.lat() * Math.PI / 180))) * Math.sin(angle);
          coords.push([lng, lat]);
        }
        coords.push(coords[0]);
      }

      setCoordinates(coords);

      // Calculate stats
      if (coords.length > 0) {
        const area = calculateTerritoryArea(coords);
        const center = getTerritoryCenter(coords);
        setStats({ area, center });
      }

      // Stop drawing
      setDrawingMode(null);
      drawingManager.setDrawingMode(null);

      // Add event listeners for editing
      if (event.type === 'polygon') {
        window.google.maps.event.addListener(shape.getPath(), 'set_at', updateCoordinates);
        window.google.maps.event.addListener(shape.getPath(), 'insert_at', updateCoordinates);
      }
    });

    return () => {
      if (drawingManager) {
        window.google.maps.event.clearInstanceListeners(drawingManager);
        drawingManager.setMap(null);
      }
    };
  }, [map, territoryColor]);

  // Update coordinates when shape is edited
  const updateCoordinates = () => {
    if (!currentShapeRef.current) return;

    const path = currentShapeRef.current.getPath();
    const pathArray = path.getArray();
    const coords = pathArray.map((latLng) => [latLng.lng(), latLng.lat()]);
    coords.push(coords[0]);

    setCoordinates(coords);

    const area = calculateTerritoryArea(coords);
    const center = getTerritoryCenter(coords);
    setStats({ area, center });
  };

  // Handle drawing mode changes
  const handleDrawingModeChange = (mode) => {
    if (!drawingManagerRef.current) return;

    setDrawingMode(mode);
    setStoreDrawingMode(mode);

    // Clear existing shape
    if (currentShapeRef.current) {
      currentShapeRef.current.setMap(null);
      currentShapeRef.current = null;
    }

    setCoordinates([]);
    setStats({ area: 0, center: null });

    // Set drawing mode
    const modeMap = {
      polygon: window.google.maps.drawing.OverlayType.POLYGON,
      rectangle: window.google.maps.drawing.OverlayType.RECTANGLE,
      circle: window.google.maps.drawing.OverlayType.CIRCLE,
    };

    drawingManagerRef.current.setDrawingMode(modeMap[mode] || null);
  };

  // Clear current drawing
  const handleClear = () => {
    if (currentShapeRef.current) {
      currentShapeRef.current.setMap(null);
      currentShapeRef.current = null;
    }
    setCoordinates([]);
    setStats({ area: 0, center: null });
    setDrawingMode(null);
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }
  };

  // Save territory
  const handleSave = () => {
    if (coordinates.length === 0) {
      alert('Please draw a territory first');
      return;
    }

    if (!territoryName.trim()) {
      alert('Please enter a territory name');
      return;
    }

    try {
      createTerritory({
        name: territoryName,
        coordinates,
        assignedReps: [], // Reserved for future assignment feature
        color: territoryColor,
        description: `Territory with ${stats.area} sq mi area`,
      });

      alert('Territory created successfully!');
      handleClear();
      onClose();
    } catch (error) {
      alert('Error creating territory: ' + error.message);
    }
  };

  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-6 max-w-md z-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-blue-600" />
          Create Territory
        </h3>
        <button
          onClick={() => {
            handleClear();
            onClose();
          }}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Territory Details */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Territory Name
          </label>
          <input
            type="text"
            value={territoryName}
            onChange={(e) => setTerritoryName(e.target.value)}
            placeholder="e.g., Downtown District"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Territory Color
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={territoryColor}
              onChange={(e) => setTerritoryColor(e.target.value)}
              className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={territoryColor}
              onChange={(e) => setTerritoryColor(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Drawing Tools */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Drawing Tools
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleDrawingModeChange('polygon')}
              className={`p-3 rounded-lg border-2 transition-all ${
                drawingMode === 'polygon'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-blue-300'
              }`}
            >
              <Pencil className="w-5 h-5 mx-auto" />
              <span className="text-xs mt-1 block">Polygon</span>
            </button>
            <button
              onClick={() => handleDrawingModeChange('rectangle')}
              className={`p-3 rounded-lg border-2 transition-all ${
                drawingMode === 'rectangle'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-blue-300'
              }`}
            >
              <Square className="w-5 h-5 mx-auto" />
              <span className="text-xs mt-1 block">Rectangle</span>
            </button>
            <button
              onClick={() => handleDrawingModeChange('circle')}
              className={`p-3 rounded-lg border-2 transition-all ${
                drawingMode === 'circle'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-blue-300'
              }`}
            >
              <Circle className="w-5 h-5 mx-auto" />
              <span className="text-xs mt-1 block">Circle</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        {coordinates.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Territory Stats</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <div>Area: <strong>{stats.area} sq mi</strong></div>
              <div>Points: <strong>{coordinates.length - 1}</strong></div>
              {stats.center && (
                <div>
                  Center: <strong>{stats.center.lat.toFixed(6)}, {stats.center.lng.toFixed(6)}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        {drawingMode && (
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              {drawingMode === 'polygon' && 'Click on the map to create polygon points. Double-click to finish.'}
              {drawingMode === 'rectangle' && 'Click and drag on the map to create a rectangle.'}
              {drawingMode === 'circle' && 'Click and drag on the map to create a circle.'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleClear}
            disabled={coordinates.length === 0}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </button>
          <button
            onClick={handleSave}
            disabled={coordinates.length === 0 || !territoryName.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Territory
          </button>
        </div>
      </div>
    </div>
  );
};

export default TerritoryDrawingTool;
