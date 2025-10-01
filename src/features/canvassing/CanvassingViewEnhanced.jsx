import React, { useState } from 'react';
import { Target, Map, Route, Trophy, BarChart3, Settings, X } from 'lucide-react';
import CanvassingView from './CanvassingView';
import TerritoryDrawingTool from './components/territory/TerritoryDrawingTool';
import TerritoryManager from './components/territory/TerritoryManager';
import RouteOptimizer from './components/route/RouteOptimizer';
import Leaderboard from './components/gamification/Leaderboard';
import CanvassingDashboard from './components/analytics/CanvassingDashboard';

/**
 * CanvassingViewEnhanced - Complete Phase 2 Implementation
 * Combines all canvassing features into comprehensive interface
 */
const CanvassingViewEnhanced = ({ leads }) => {
  const [activePanel, setActivePanel] = useState(null); // 'territory', 'route', 'leaderboard', 'analytics'
  const [showDrawingTool, setShowDrawingTool] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);

  const panels = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'territory', label: 'Territories', icon: Map },
    { id: 'route', label: 'Routes', icon: Route },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  return (
    <div className="flex h-full">
      {/* Main Map View */}
      <div className="flex-1 relative">
        <CanvassingView leads={leads} onMapLoad={setMapInstance} />

        {/* Drawing Tool Overlay */}
        {showDrawingTool && mapInstance && (
          <TerritoryDrawingTool
            map={mapInstance}
            onClose={() => setShowDrawingTool(false)}
          />
        )}

        {/* Panel Toggle Buttons */}
        <div className="absolute top-4 left-4 flex flex-col space-y-2 z-10">
          {panels.map((panel) => {
            const Icon = panel.icon;
            return (
              <button
                key={panel.id}
                onClick={() => setActivePanel(activePanel === panel.id ? null : panel.id)}
                className={`p-3 rounded-lg shadow-lg transition-all ${
                  activePanel === panel.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                title={panel.label}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Side Panel */}
      {activePanel && (
        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto shadow-xl">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
            <h2 className="text-lg font-bold text-gray-900">
              {panels.find((p) => p.id === activePanel)?.label}
            </h2>
            <button
              onClick={() => setActivePanel(null)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="p-4">
            {activePanel === 'analytics' && <CanvassingDashboard />}
            {activePanel === 'territory' && (
              <TerritoryManager onDrawNew={() => setShowDrawingTool(true)} />
            )}
            {activePanel === 'route' && mapInstance && <RouteOptimizer map={mapInstance} />}
            {activePanel === 'leaderboard' && <Leaderboard />}
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvassingViewEnhanced;
