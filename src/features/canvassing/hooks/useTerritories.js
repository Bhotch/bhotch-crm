import { useCallback } from 'react';
import { useCanvassingStore } from '../store/canvassingStore';
import { calculateTerritoryArea, getTerritoryCenter, doTerritoriesOverlap } from '../utils/geoUtils';

/**
 * Custom hook for territory management operations
 */
export const useTerritories = () => {
  const {
    territories,
    selectedTerritory,
    addTerritory,
    updateTerritory,
    deleteTerritory,
    selectTerritory,
    getPropertiesInTerritory,
  } = useCanvassingStore();

  /**
   * Create a new territory with validation
   */
  const createTerritory = useCallback((territoryData) => {
    const { name, coordinates, assignedReps, color, description } = territoryData;

    // Validation
    if (!name || !coordinates || coordinates.length < 3) {
      throw new Error('Territory must have a name and at least 3 coordinate points');
    }

    // Calculate area
    const area = calculateTerritoryArea(coordinates);

    // Get center point
    const center = getTerritoryCenter(coordinates);

    // Check for overlaps with existing territories
    const overlaps = territories.filter(t =>
      doTerritoriesOverlap(coordinates, t.coordinates)
    );

    const newTerritory = {
      name,
      coordinates,
      assignedReps: assignedReps || [],
      color: color || getRandomTerritoryColor(),
      description: description || '',
      area,
      center,
      overlaps: overlaps.map(t => t.id),
      stats: {
        totalProperties: 0,
        contactedProperties: 0,
        conversionRate: 0,
      },
    };

    addTerritory(newTerritory);
    return newTerritory;
  }, [territories, addTerritory]);

  /**
   * Update existing territory
   */
  const modifyTerritory = useCallback((territoryId, updates) => {
    const territory = territories.find(t => t.id === territoryId);
    if (!territory) {
      throw new Error('Territory not found');
    }

    // Recalculate area if coordinates changed
    if (updates.coordinates) {
      updates.area = calculateTerritoryArea(updates.coordinates);
      updates.center = getTerritoryCenter(updates.coordinates);
    }

    updateTerritory(territoryId, updates);
  }, [territories, updateTerritory]);

  /**
   * Remove territory with confirmation
   */
  const removeTerritory = useCallback((territoryId) => {
    const territory = territories.find(t => t.id === territoryId);
    if (!territory) {
      throw new Error('Territory not found');
    }

    // Get properties in territory
    const properties = getPropertiesInTerritory(territoryId);

    if (properties.length > 0) {
      const confirmed = window.confirm(
        `This territory contains ${properties.length} properties. Are you sure you want to delete it?`
      );
      if (!confirmed) return false;
    }

    deleteTerritory(territoryId);
    return true;
  }, [territories, deleteTerritory, getPropertiesInTerritory]);

  /**
   * Assign reps to territory
   */
  const assignReps = useCallback((territoryId, repIds) => {
    updateTerritory(territoryId, {
      assignedReps: repIds,
    });
  }, [updateTerritory]);

  /**
   * Get territories assigned to a specific rep
   */
  const getRepTerritories = useCallback((repId) => {
    return territories.filter(t => t.assignedReps?.includes(repId));
  }, [territories]);

  /**
   * Get territory statistics
   */
  const getTerritoryStats = useCallback((territoryId) => {
    const properties = getPropertiesInTerritory(territoryId);

    const stats = {
      totalProperties: properties.length,
      contactedProperties: properties.filter(p => p.status !== 'not_contacted').length,
      interestedProperties: properties.filter(p => p.status === 'interested').length,
      appointments: properties.filter(p => p.status === 'appointment').length,
      sold: properties.filter(p => p.status === 'sold').length,
      dnc: properties.filter(p => p.status === 'dnc').length,
      conversionRate: 0,
    };

    if (stats.contactedProperties > 0) {
      stats.conversionRate = ((stats.sold / stats.contactedProperties) * 100).toFixed(1);
    }

    return stats;
  }, [getPropertiesInTerritory]);

  /**
   * Find overlapping territories
   */
  const findOverlappingTerritories = useCallback((territoryId) => {
    const territory = territories.find(t => t.id === territoryId);
    if (!territory) return [];

    return territories.filter(t =>
      t.id !== territoryId &&
      doTerritoriesOverlap(territory.coordinates, t.coordinates)
    );
  }, [territories]);

  /**
   * Get all territories with their stats
   */
  const getTerritoriesWithStats = useCallback(() => {
    return territories.map(territory => ({
      ...territory,
      stats: getTerritoryStats(territory.id),
    }));
  }, [territories, getTerritoryStats]);

  return {
    territories,
    selectedTerritory,
    createTerritory,
    modifyTerritory,
    removeTerritory,
    selectTerritory,
    assignReps,
    getRepTerritories,
    getTerritoryStats,
    findOverlappingTerritories,
    getTerritoriesWithStats,
  };
};

/**
 * Generate random color for territory
 */
const getRandomTerritoryColor = () => {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};
