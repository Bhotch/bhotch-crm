import React, { useState } from 'react';
import { useVisualizationStore } from '../../store/visualizationStore';
import { getTrackPalette } from '../../utils/MaterialManager';
import ColorPalette from './ColorPalette';
import { Lightbulb, Zap, Sparkles, Plus, Trash2, Power } from 'lucide-react';

/**
 * Rime Lighting Designer Component
 * Design and configure Jellyfish-style outdoor lighting systems
 */
export default function LightingDesigner() {
  const {
    lighting,
    setLightingEnabled,
    setTrackColor,
    setLightingPattern,
    setLightingColor,
    setLightingBrightness,
    addLight,
    removeLight,
    generateDefaultLighting,
  } = useVisualizationStore();

  const trackPalette = getTrackPalette();

  const [lightingMode, setLightingMode] = useState('auto'); // 'auto' or 'manual'

  const patterns = [
    { id: 'solid', name: 'Solid', icon: '⬤' },
    { id: 'chase', name: 'Chase', icon: '→' },
    { id: 'fade', name: 'Fade', icon: '◐' },
    { id: 'holiday', name: 'Holiday', icon: '🎄' },
  ];

  const presetColors = [
    { name: 'Warm White', value: '#fff8dc' },
    { name: 'Cool White', value: '#ffffff' },
    { name: 'Amber', value: '#ffbf00' },
    { name: 'Red', value: '#ff0000' },
    { name: 'Green', value: '#00ff00' },
    { name: 'Blue', value: '#0000ff' },
    { name: 'Purple', value: '#800080' },
    { name: 'Cyan', value: '#00ffff' },
  ];

  const handleAddManualLight = () => {
    const newLight = {
      position: [0, 5, -20],
      color: lighting.color,
      intensity: lighting.brightness / 100 * 3,
      range: 15,
      beamWidth: 2,
      beamLength: 10,
    };
    addLight(newLight);
  };

  return (
    <div className="lighting-designer bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-purple-600" />
          Rime Lighting System
        </h3>
        <button
          onClick={() => setLightingEnabled(!lighting.enabled)}
          className={`p-2 rounded-lg transition-colors ${
            lighting.enabled
              ? 'bg-purple-600 text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
          title={lighting.enabled ? 'Lighting On' : 'Lighting Off'}
        >
          <Power className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Selection */}
      <div className="mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setLightingMode('auto')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              lightingMode === 'auto'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Zap className="w-4 h-4 inline mr-1" />
            Auto Design
          </button>
          <button
            onClick={() => setLightingMode('manual')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              lightingMode === 'manual'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Sparkles className="w-4 h-4 inline mr-1" />
            Manual
          </button>
        </div>
      </div>

      {lightingMode === 'auto' ? (
        /* Auto Design Mode */
        <div>
          <button
            onClick={generateDefaultLighting}
            className="w-full py-2.5 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Generate Complete Lighting Design
          </button>
          <p className="mt-2 text-xs text-gray-600 text-center">
            Automatically places professional lighting around the house
          </p>
        </div>
      ) : (
        /* Manual Mode */
        <div>
          <button
            onClick={handleAddManualLight}
            className="w-full py-2.5 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Light Fixture
          </button>
        </div>
      )}

      {/* Track Color Selection */}
      <div className="mt-4">
        <ColorPalette
          colors={trackPalette}
          selectedColor={lighting.trackColor}
          onSelectColor={setTrackColor}
          title="Aluminum Track Color"
        />
      </div>

      {/* LED Color Selection */}
      <div className="mt-4">
        <h4 className="text-sm font-semibold mb-2 text-gray-700">LED Color</h4>
        <div className="grid grid-cols-4 gap-2">
          {presetColors.map((preset) => (
            <button
              key={preset.value}
              onClick={() => setLightingColor(preset.value)}
              className={`aspect-square rounded-lg border-2 transition-all hover:scale-105 ${
                lighting.color === preset.value
                  ? 'border-purple-600 ring-2 ring-purple-200'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{ backgroundColor: preset.value }}
              title={preset.name}
            />
          ))}
        </div>
      </div>

      {/* Pattern Selection */}
      <div className="mt-4">
        <h4 className="text-sm font-semibold mb-2 text-gray-700">Lighting Pattern</h4>
        <div className="grid grid-cols-2 gap-2">
          {patterns.map((pattern) => (
            <button
              key={pattern.id}
              onClick={() => setLightingPattern(pattern.id)}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                lighting.pattern === pattern.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-1">{pattern.icon}</span>
              {pattern.name}
            </button>
          ))}
        </div>
      </div>

      {/* Brightness Control */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Brightness: {lighting.brightness}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={lighting.brightness}
          onChange={(e) => setLightingBrightness(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
        />
      </div>

      {/* Installed Lights List */}
      {lighting.lights.length > 0 && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-700">
              Installed Lights ({lighting.lights.length})
            </h4>
            {lighting.lights.length > 0 && (
              <button
                onClick={() => lighting.lights.forEach((l) => removeLight(l.id))}
                className="text-xs text-red-600 hover:text-red-800 font-medium"
              >
                Clear All
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {lighting.lights.map((light) => (
              <div
                key={light.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-3 h-3 text-purple-600" />
                  <span className="text-xs text-gray-700">
                    Position: {light.position.map((n) => n.toFixed(0)).join(', ')}
                  </span>
                </div>
                <button
                  onClick={() => removeLight(light.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Info */}
      <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
        <p className="text-xs text-purple-800">
          <strong>Rime Lighting - Jellyfish Style</strong>
          <br />
          RGB+W LED • App Controlled • Weather Resistant
        </p>
      </div>
    </div>
  );
}
