import React from 'react';
import { Check } from 'lucide-react';

/**
 * Color Palette Component
 * Displays selectable color swatches for products
 */
export default function ColorPalette({ colors, selectedColor, onSelectColor, title = 'Colors' }) {
  return (
    <div className="color-palette">
      <h4 className="text-sm font-semibold mb-3 text-gray-700">{title}</h4>
      <div className="grid grid-cols-4 gap-2">
        {colors.map((color) => (
          <button
            key={color.id}
            onClick={() => onSelectColor(color.id)}
            className={`relative aspect-square rounded-lg border-2 transition-all hover:scale-105 ${
              selectedColor === color.id
                ? 'border-blue-600 ring-2 ring-blue-200'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            style={{ backgroundColor: color.hex }}
            title={color.name}
          >
            {selectedColor === color.id && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white rounded-full p-0.5">
                  <Check className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
      <div className="mt-2 text-xs text-gray-600 font-medium">
        {colors.find((c) => c.id === selectedColor)?.name || 'Select a color'}
      </div>
    </div>
  );
}
