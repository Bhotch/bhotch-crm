import React, { useState } from 'react';
import { Map, Edit, Trash2, Users, BarChart3, Plus, Eye, EyeOff } from 'lucide-react';
import { useTerritories } from '../../hooks/useTerritories';

/**
 * TerritoryManager Component
 * Manage, view, and assign territories
 */
const TerritoryManager = ({ onDrawNew }) => {
  const { territories, removeTerritory, selectTerritory, getTerritoryStats, selectedTerritory } = useTerritories();
  const [expandedId, setExpandedId] = useState(null);
  const [visibleTerritories, setVisibleTerritories] = useState(new Set(territories.map(t => t.id)));

  const toggleVisibility = (territoryId) => {
    setVisibleTerritories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(territoryId)) {
        newSet.delete(territoryId);
      } else {
        newSet.add(territoryId);
      }
      return newSet;
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <Map className="w-5 h-5 mr-2 text-blue-600" />
          Territory Manager
        </h3>
        <button
          onClick={onDrawNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Territory
        </button>
      </div>

      {territories.length === 0 ? (
        <div className="text-center py-8">
          <Map className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 mb-2">No territories created yet</p>
          <p className="text-sm text-gray-500 mb-4">Start by drawing your first territory on the map</p>
          <button
            onClick={onDrawNew}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create First Territory
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {territories.map((territory) => {
            const stats = getTerritoryStats(territory.id);
            const isExpanded = expandedId === territory.id;
            const isVisible = visibleTerritories.has(territory.id);

            return (
              <div
                key={territory.id}
                className={`border rounded-lg overflow-hidden transition-all ${
                  selectedTerritory?.id === territory.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: territory.color }}
                      />
                      <h4 className="font-semibold text-gray-900">{territory.name}</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleVisibility(territory.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                        title={isVisible ? 'Hide on map' : 'Show on map'}
                      >
                        {isVisible ? (
                          <Eye className="w-4 h-4 text-gray-600" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => selectTerritory(territory)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete territory "${territory.name}"?`)) {
                            removeTerritory(territory.id);
                          }
                        }}
                        className="p-1 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{stats.totalProperties}</div>
                      <div className="text-xs text-gray-600">Properties</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.sold}</div>
                      <div className="text-xs text-gray-600">Sold</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.conversionRate}%</div>
                      <div className="text-xs text-gray-600">Conv. Rate</div>
                    </div>
                  </div>

                  {territory.area && (
                    <div className="text-sm text-gray-600 mb-2">
                      Area: <strong>{territory.area} sq mi</strong>
                    </div>
                  )}

                  {territory.assignedReps && territory.assignedReps.length > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-1" />
                      {territory.assignedReps.length} rep(s) assigned
                    </div>
                  )}

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : territory.id)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center"
                  >
                    <BarChart3 className="w-4 h-4 mr-1" />
                    {isExpanded ? 'Hide' : 'Show'} Details
                  </button>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-gray-600">Contacted</div>
                        <div className="font-semibold">{stats.contactedProperties}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Interested</div>
                        <div className="font-semibold text-green-600">{stats.interestedProperties}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Appointments</div>
                        <div className="font-semibold text-blue-600">{stats.appointments}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">DNC</div>
                        <div className="font-semibold text-red-600">{stats.dnc}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TerritoryManager;
