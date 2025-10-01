import React from 'react';
import House360Viewer from './components/Viewer/House360Viewer';
import ControlPanel from './components/UI/ControlPanel';
import ProductPanel from './components/UI/ProductPanel';
import { useVisualizationStore } from './store/visualizationStore';
import { Loader2, Eye } from 'lucide-react';

/**
 * Main Visualization 360 Component
 * Advanced AI-powered house visualization and product design tool
 */
export default function Visualization360() {
  const { ui, toggleControls } = useVisualizationStore();

  return (
    <div className="visualization-360 h-full w-full relative bg-gray-900">
      {/* Main 3D Viewer */}
      <div className="absolute inset-0">
        <House360Viewer />
      </div>

      {/* Control Panel - Left Side */}
      {ui.showControls && (
        <div className="absolute top-4 left-4 w-80 max-h-[calc(100vh-120px)] overflow-y-auto z-10">
          <ControlPanel />
        </div>
      )}

      {/* Product Panel - Right Side */}
      {ui.showControls && (
        <div className="absolute top-4 right-4 w-96 max-h-[calc(100vh-120px)] overflow-y-auto z-10">
          <ProductPanel />
        </div>
      )}

      {/* Toggle Controls Button */}
      <button
        onClick={toggleControls}
        className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-white hover:bg-gray-100 text-gray-800 px-4 py-2 rounded-full shadow-lg font-medium text-sm transition-colors flex items-center gap-2"
        title={ui.showControls ? 'Hide Controls' : 'Show Controls'}
      >
        <Eye className="w-4 h-4" />
        {ui.showControls ? 'Hide Controls' : 'Show Controls'}
      </button>

      {/* Loading Overlay */}
      {ui.isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="text-gray-800 font-medium">Processing...</span>
          </div>
        </div>
      )}

      {/* Branding */}
      <div className="absolute bottom-4 right-4 z-10 bg-black bg-opacity-60 text-white px-3 py-1.5 rounded text-xs">
        Powered by Rime + Malarkey • AI Visualization Technology
      </div>
    </div>
  );
}
