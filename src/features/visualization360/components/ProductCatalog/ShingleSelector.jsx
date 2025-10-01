import React from 'react';
import { useVisualizationStore } from '../../store/visualizationStore';
import { getShinglePalette } from '../../utils/MaterialManager';
import ColorPalette from './ColorPalette';
import { Plus, Info } from 'lucide-react';

/**
 * Shingle Selector Component
 * Allows selection and application of Malarkey shingle colors
 */
export default function ShingleSelector() {
  const {
    shingles,
    setShingleColor,
    setShingleOpacity,
    addShingleRegion,
    removeShingleRegion,
  } = useVisualizationStore();

  const shinglePalette = getShinglePalette();

  const handleApplyShingle = () => {
    const newRegion = {
      id: Date.now(),
      color: shingles.selectedColor,
      opacity: shingles.opacity,
      position: [0, 0, 0],
      scale: [1, 1, 1],
    };
    addShingleRegion(newRegion);
  };

  return (
    <div className="shingle-selector bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Malarkey Shingles</h3>
        <div className="group relative">
          <Info className="w-4 h-4 text-gray-400 cursor-help" />
          <div className="absolute right-0 top-6 hidden group-hover:block bg-gray-900 text-white text-xs rounded p-2 w-48 z-10">
            Select a shingle color and click Apply to add to your roof
          </div>
        </div>
      </div>

      {/* Color Palette */}
      <ColorPalette
        colors={shinglePalette}
        selectedColor={shingles.selectedColor}
        onSelectColor={setShingleColor}
        title="Select Shingle Color"
      />

      {/* Opacity Control */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Opacity: {Math.round(shingles.opacity * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={shingles.opacity * 100}
          onChange={(e) => setShingleOpacity(e.target.value / 100)}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      {/* Apply Button */}
      <button
        onClick={handleApplyShingle}
        className="w-full mt-4 py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Apply to Roof
      </button>

      {/* Applied Regions List */}
      {shingles.appliedRegions.length > 0 && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Applied Shingles</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {shingles.appliedRegions.map((region) => {
              const colorData = shinglePalette.find((c) => c.id === region.color);
              return (
                <div
                  key={region.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: colorData?.hex }}
                    />
                    <span className="text-sm text-gray-700">{colorData?.name}</span>
                  </div>
                  <button
                    onClick={() => removeShingleRegion(region.id)}
                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Product Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-xs text-blue-800">
          <strong>Premium Malarkey Shingles</strong>
          <br />
          Class 4 Impact Resistant • 50-Year Warranty
        </p>
      </div>
    </div>
  );
}
