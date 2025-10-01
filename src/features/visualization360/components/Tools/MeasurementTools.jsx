import React, { useState } from 'react';
import { Ruler, Move, Square, Triangle, Calculator, Save, Trash2 } from 'lucide-react';
import { useVisualizationStore } from '../../store/visualizationStore';

/**
 * Advanced Measurement Tools Component
 * Interactive tools for measuring roof surfaces, calculating areas, and roof pitch
 * Phase 2 Feature
 */

export default function MeasurementTools({ className = '' }) {
  const [activeTool, setActiveTool] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [currentMeasurement, setCurrentMeasurement] = useState(null);
  const [unit, setUnit] = useState('feet'); // 'feet', 'meters', 'inches'
  // const canvasRef = useRef(null); // Reserved for future use

  const { setMeasurements: storeSetMeasurements } = useVisualizationStore();

  const tools = [
    { id: 'distance', name: 'Distance', icon: Ruler, description: 'Measure linear distance' },
    { id: 'area', name: 'Area', icon: Square, description: 'Measure surface area' },
    { id: 'pitch', name: 'Roof Pitch', icon: Triangle, description: 'Calculate roof pitch' },
    { id: 'perimeter', name: 'Perimeter', icon: Move, description: 'Measure perimeter' }
  ];

  /**
   * Start a new measurement
   */
  const startMeasurement = (toolId) => {
    setActiveTool(toolId);
    setCurrentMeasurement({
      id: Date.now(),
      type: toolId,
      points: [],
      value: null,
      unit
    });
  };

  /**
   * Add point to current measurement
   */
  // Reserved for future interactive measurement feature
  // const addPoint = (x, y, z = 0) => {
  //   if (!currentMeasurement) return;

  //   const newPoints = [...currentMeasurement.points, { x, y, z }];
  //   const updated = { ...currentMeasurement, points: newPoints };

  //   // Calculate value based on tool type
  //   switch (currentMeasurement.type) {
  // const calculateMeasurement = (measurementType, newPoints) => {
  //   const updated = { ...currentMeasurement, points: newPoints };

  //   switch (measurementType) {
  //     case 'distance':
  //       if (newPoints.length === 2) {
  //         updated.value = calculateDistance(newPoints[0], newPoints[1]);
  //         completeMeasurement(updated);
  //       }
  //       break;

  //     case 'area':
  //       if (newPoints.length >= 3) {
  //         updated.value = calculateArea(newPoints);
  //       }
  //       break;

  //     case 'pitch':
  //       if (newPoints.length === 2) {
  //         updated.value = calculatePitch(newPoints[0], newPoints[1]);
  //         completeMeasurement(updated);
  //       }
  //       break;

  //     case 'perimeter':
  //       if (newPoints.length >= 2) {
  //         updated.value = calculatePerimeter(newPoints);
  //       }
  //       break;

  //     default:
  //       break;
  //   }

  //   setCurrentMeasurement(updated);
  // };

  /**
   * Complete current measurement
   */
  const completeMeasurement = (measurement = currentMeasurement) => {
    if (!measurement || !measurement.value) return;

    setMeasurements(prev => [...prev, measurement]);
    setCurrentMeasurement(null);
    setActiveTool(null);

    // Update global measurements state
    updateGlobalMeasurements([...measurements, measurement]);
  };

  /**
   * Delete a measurement
   */
  const deleteMeasurement = (id) => {
    const updated = measurements.filter(m => m.id !== id);
    setMeasurements(updated);
    updateGlobalMeasurements(updated);
  };

  /**
   * Calculate distance between two points
   */
  const calculateDistance = (p1, p2) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;

    const pixels = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return pixelsToUnit(pixels);
  };

  /**
   * Calculate area of polygon
   */
  // eslint-disable-next-line no-unused-vars
  const calculateArea = (points) => {
    if (points.length < 3) return 0;

    // Shoelace formula for polygon area
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }

    area = Math.abs(area) / 2;
    return pixelsToUnit(Math.sqrt(area), 2); // Square units
  };

  /**
   * Calculate roof pitch
   */
  // eslint-disable-next-line no-unused-vars
  const calculatePitch = (p1, p2) => {
    const rise = Math.abs(p2.y - p1.y);
    const run = Math.abs(p2.x - p1.x);

    if (run === 0) return 0;

    // Pitch as rise/run ratio (e.g., 4:12)
    const pitchRatio = (rise / run) * 12;

    // Also calculate angle in degrees
    const angleDeg = Math.atan2(rise, run) * (180 / Math.PI);

    return {
      ratio: `${pitchRatio.toFixed(1)}:12`,
      degrees: angleDeg.toFixed(1),
      rise: pixelsToUnit(rise),
      run: pixelsToUnit(run)
    };
  };

  /**
   * Calculate perimeter of polygon
   */
  // eslint-disable-next-line no-unused-vars
  const calculatePerimeter = (points) => {
    if (points.length < 2) return 0;

    let perimeter = 0;
    for (let i = 0; i < points.length - 1; i++) {
      perimeter += calculateDistance(points[i], points[i + 1]);
    }

    return perimeter;
  };

  /**
   * Convert pixels to real-world units
   * Uses calibration factor (would be set by user or auto-detected)
   */
  const pixelsToUnit = (pixels, power = 1) => {
    const calibrationFactor = 0.1; // 1 pixel = 0.1 feet (example)

    let value = pixels * calibrationFactor;

    // Apply power for area/volume calculations
    value = Math.pow(value, power);

    // Convert to selected unit
    switch (unit) {
      case 'feet':
        return value;
      case 'meters':
        return value * 0.3048;
      case 'inches':
        return value * 12;
      default:
        return value;
    }
  };

  /**
   * Update global measurements state
   */
  const updateGlobalMeasurements = (allMeasurements) => {
    const summary = {
      roofArea: 0,
      perimeter: 0,
      pitch: 0,
      sqFt: 0
    };

    allMeasurements.forEach(m => {
      if (m.type === 'area') {
        summary.roofArea += m.value;
        summary.sqFt += m.value;
      } else if (m.type === 'perimeter') {
        summary.perimeter += m.value;
      } else if (m.type === 'pitch' && m.value.degrees) {
        summary.pitch = Math.max(summary.pitch, parseFloat(m.value.degrees));
      }
    });

    storeSetMeasurements(summary);
  };

  /**
   * Export measurements to CSV
   */
  const exportMeasurements = () => {
    const csv = [
      ['Type', 'Value', 'Unit', 'Points'].join(','),
      ...measurements.map(m => [
        m.type,
        typeof m.value === 'object' ? JSON.stringify(m.value) : m.value,
        m.unit,
        m.points.length
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `measurements-${Date.now()}.csv`;
    a.click();
  };

  /**
   * Format measurement value for display
   */
  const formatValue = (measurement) => {
    const { type, value, unit } = measurement;

    if (!value) return '-';

    switch (type) {
      case 'distance':
        return `${value.toFixed(2)} ${unit}`;

      case 'area':
        return `${value.toFixed(2)} sq ${unit}`;

      case 'pitch':
        return `${value.ratio} (${value.degrees}°)`;

      case 'perimeter':
        return `${value.toFixed(2)} ${unit}`;

      default:
        return value.toString();
    }
  };

  return (
    <div className={`measurement-tools bg-white rounded-lg shadow-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800">Measurement Tools</h3>
        </div>

        {/* Unit Selector */}
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="feet">Feet</option>
          <option value="meters">Meters</option>
          <option value="inches">Inches</option>
        </select>
      </div>

      {/* Tool Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {tools.map(tool => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              onClick={() => startMeasurement(tool.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded border-2 transition-all ${
                isActive
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-blue-300 text-gray-700'
              }`}
              title={tool.description}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tool.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active Measurement Instructions */}
      {activeTool && currentMeasurement && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
          <p className="text-sm text-blue-800 font-medium">
            {currentMeasurement.type === 'distance' && 'Click two points to measure distance'}
            {currentMeasurement.type === 'area' && 'Click points to define area (double-click to finish)'}
            {currentMeasurement.type === 'pitch' && 'Click base point, then peak point'}
            {currentMeasurement.type === 'perimeter' && 'Click points around perimeter'}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Points: {currentMeasurement.points.length}
          </p>

          {/* Finish/Cancel Buttons */}
          <div className="flex gap-2 mt-2">
            {currentMeasurement.points.length >= 2 && (
              <button
                onClick={() => completeMeasurement()}
                className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
              >
                Finish
              </button>
            )}
            <button
              onClick={() => {
                setCurrentMeasurement(null);
                setActiveTool(null);
              }}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Measurements List */}
      <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-700">Saved Measurements</h4>
          {measurements.length > 0 && (
            <button
              onClick={exportMeasurements}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Save className="w-3 h-3" />
              Export CSV
            </button>
          )}
        </div>

        {measurements.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No measurements yet. Select a tool to begin.
          </p>
        ) : (
          measurements.map(m => (
            <div
              key={m.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
            >
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800 capitalize">
                  {m.type}
                </div>
                <div className="text-sm text-gray-600">
                  {formatValue(m)}
                </div>
              </div>
              <button
                onClick={() => deleteMeasurement(m.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
                title="Delete measurement"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {measurements.length > 0 && (
        <div className="border-t border-gray-200 pt-3">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Summary</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Total Area:</span>
              <span className="ml-2 font-semibold text-gray-800">
                {measurements
                  .filter(m => m.type === 'area')
                  .reduce((sum, m) => sum + m.value, 0)
                  .toFixed(2)} sq {unit}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Max Pitch:</span>
              <span className="ml-2 font-semibold text-gray-800">
                {measurements
                  .filter(m => m.type === 'pitch')
                  .reduce((max, m) => Math.max(max, parseFloat(m.value.degrees) || 0), 0)
                  .toFixed(1)}°
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Calibration Helper */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <button className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200">
          Set Scale / Calibrate
        </button>
        <p className="text-xs text-gray-500 mt-1 text-center">
          Click to set a known distance for accurate measurements
        </p>
      </div>
    </div>
  );
}
