import React from 'react';
import { useVisualizationStore } from '../../store/visualizationStore';
import { Package, Lightbulb } from 'lucide-react';
import ShingleSelector from '../ProductCatalog/ShingleSelector';
import LightingDesigner from '../ProductCatalog/LightingDesigner';

/**
 * Product Panel Component
 * Tabbed interface for product selection and configuration
 */
export default function ProductPanel() {
  const { ui, setActivePanel } = useVisualizationStore();

  const panels = [
    { id: 'products', label: 'Shingles', icon: Package },
    { id: 'lighting', label: 'Lighting', icon: Lightbulb },
  ];

  return (
    <div className="product-panel bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        {panels.map((panel) => {
          const Icon = panel.icon;
          return (
            <button
              key={panel.id}
              onClick={() => setActivePanel(panel.id)}
              className={`flex-1 py-3 px-4 font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                ui.activePanel === panel.id
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {panel.label}
            </button>
          );
        })}
      </div>

      {/* Panel Content */}
      <div className="p-4">
        {ui.activePanel === 'products' && <ShingleSelector />}
        {ui.activePanel === 'lighting' && <LightingDesigner />}
      </div>
    </div>
  );
}
