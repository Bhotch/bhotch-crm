import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Canvassing Store - Central state management for door-to-door canvassing
 * Manages territories, properties, routes, and real-time tracking
 */
export const useCanvassingStore = create(
  persist(
    (set, get) => ({
      // ==================== TERRITORIES ====================
      territories: [],
      selectedTerritory: null,

      addTerritory: (territory) => set((state) => ({
        territories: [...state.territories, {
          ...territory,
          id: territory.id || `territory_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }]
      })),

      updateTerritory: (territoryId, updates) => set((state) => {
        const index = state.territories.findIndex(t => t.id === territoryId);
        if (index !== -1) {
          const newTerritories = [...state.territories];
          newTerritories[index] = {
            ...newTerritories[index],
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          return { territories: newTerritories };
        }
        return state;
      }),

      deleteTerritory: (territoryId) => set((state) => ({
        territories: state.territories.filter(t => t.id !== territoryId),
        selectedTerritory: state.selectedTerritory?.id === territoryId ? null : state.selectedTerritory
      })),

      selectTerritory: (territory) => set({ selectedTerritory: territory }),

      // ==================== PROPERTIES ====================
      properties: [],
      selectedProperty: null,
      propertyFilter: {
        status: 'all', // all, not_contacted, interested, not_interested, callback, appointment, sold, dnc
        quality: 'all', // all, hot, warm, cold
        territory: 'all',
      },

      addProperty: (property) => set((state) => ({
        properties: [...state.properties, {
          ...property,
          id: property.id || `property_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          visits: property.visits || [],
        }]
      })),

      updateProperty: (propertyId, updates) => set((state) => {
        const index = state.properties.findIndex(p => p.id === propertyId);
        if (index !== -1) {
          const newProperties = [...state.properties];
          newProperties[index] = {
            ...newProperties[index],
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          return { properties: newProperties };
        }
        return state;
      }),

      deleteProperty: (propertyId) => set((state) => ({
        properties: state.properties.filter(p => p.id !== propertyId),
        selectedProperty: state.selectedProperty?.id === propertyId ? null : state.selectedProperty
      })),

      selectProperty: (property) => set({ selectedProperty: property }),

      setPropertyFilter: (filter) => set((state) => ({
        propertyFilter: { ...state.propertyFilter, ...filter }
      })),

      // Add visit to property
      addVisit: (propertyId, visit) => set((state) => {
        const index = state.properties.findIndex(p => p.id === propertyId);
        if (index !== -1) {
          const newProperties = [...state.properties];
          const property = newProperties[index];
          newProperties[index] = {
            ...property,
            visits: [...(property.visits || []), {
              ...visit,
              id: visit.id || `visit_${Date.now()}`,
              timestamp: new Date().toISOString(),
            }],
            updatedAt: new Date().toISOString(),
            lastVisitDate: new Date().toISOString(),
          };
          return { properties: newProperties };
        }
        return state;
      }),

      // ==================== ROUTES ====================
      routes: [],
      activeRoute: null,

      addRoute: (route) => set((state) => ({
        routes: [...state.routes, {
          ...route,
          id: route.id || `route_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }]
      })),

      updateRoute: (routeId, updates) => set((state) => {
        const index = state.routes.findIndex(r => r.id === routeId);
        if (index !== -1) {
          const newRoutes = [...state.routes];
          newRoutes[index] = {
            ...newRoutes[index],
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          return { routes: newRoutes };
        }
        return state;
      }),

      deleteRoute: (routeId) => set((state) => ({
        routes: state.routes.filter(r => r.id !== routeId),
        activeRoute: state.activeRoute?.id === routeId ? null : state.activeRoute
      })),

      setActiveRoute: (route) => set({ activeRoute: route }),

      // ==================== REAL-TIME TRACKING ====================
      repLocations: {}, // { repId: { lat, lng, timestamp, heading, speed } }
      trackingEnabled: false,
      currentLocation: null,

      updateRepLocation: (repId, location) => set((state) => ({
        repLocations: {
          ...state.repLocations,
          [repId]: {
            ...location,
            timestamp: new Date().toISOString(),
          }
        }
      })),

      setCurrentLocation: (location) => set({ currentLocation: location }),

      setTrackingEnabled: (enabled) => set({ trackingEnabled: enabled }),

      // ==================== ANALYTICS ====================
      analytics: {
        totalDoorsKnocked: 0,
        contactsMade: 0,
        appointmentsSet: 0,
        salesMade: 0,
        hoursWorked: 0,
      },

      updateAnalytics: (updates) => set((state) => ({
        analytics: { ...state.analytics, ...updates }
      })),

      incrementMetric: (metric, amount = 1) => set((state) => ({
        analytics: state.analytics[metric] !== undefined
          ? { ...state.analytics, [metric]: state.analytics[metric] + amount }
          : state.analytics
      })),

      // ==================== UI STATE ====================
      mapView: {
        center: { lat: 40.7608, lng: -111.8910 }, // Default to Salt Lake City
        zoom: 18, // Street-level zoom to show house numbers
        mapType: 'roadmap',
        showTraffic: false,
        showHeatmap: false,
        showTerritories: true,
        showRoutes: true,
      },

      updateMapView: (updates) => set((state) => ({
        mapView: { ...state.mapView, ...updates }
      })),

      // Drawing mode for territories
      drawingMode: null, // null, 'territory', 'route'
      setDrawingMode: (mode) => set({ drawingMode: mode }),

      // ==================== ERROR STATE ====================
      mapError: null,
      setMapError: (error) => set({ mapError: error }),
      clearMapError: () => set({ mapError: null }),

      // Recovery action
      recoverFromError: () => {
        set({
          mapError: null,
        });
        console.log('[Canvassing Store] Attempting error recovery...');
      },

      // ==================== UTILITY METHODS ====================
      getFilteredProperties: () => {
        const { properties, propertyFilter } = get();
        return properties.filter(property => {
          if (propertyFilter.status !== 'all' && property.status !== propertyFilter.status) {
            return false;
          }
          if (propertyFilter.quality !== 'all' && property.quality?.toLowerCase() !== propertyFilter.quality) {
            return false;
          }
          if (propertyFilter.territory !== 'all' && property.territoryId !== propertyFilter.territory) {
            return false;
          }
          return true;
        });
      },

      getTerritoriesForRep: (repId) => {
        const { territories } = get();
        return territories.filter(t => t.assignedReps?.includes(repId));
      },

      getPropertiesInTerritory: (territoryId) => {
        const { properties } = get();
        return properties.filter(p => p.territoryId === territoryId);
      },

      // Reset store (useful for testing/logout)
      resetStore: () => set({
        territories: [],
        selectedTerritory: null,
        properties: [],
        selectedProperty: null,
        routes: [],
        activeRoute: null,
        repLocations: {},
        currentLocation: null,
        analytics: {
          totalDoorsKnocked: 0,
          contactsMade: 0,
          appointmentsSet: 0,
          salesMade: 0,
          hoursWorked: 0,
        },
      }),
    }),
    {
      name: 'canvassing-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        territories: state.territories,
        properties: state.properties,
        routes: state.routes,
        analytics: state.analytics,
        mapView: state.mapView,
      }),
    }
  )
);

// Selectors for optimized re-renders
export const selectTerritories = (state) => state.territories;
export const selectProperties = (state) => state.properties;
export const selectFilteredProperties = (state) => state.getFilteredProperties();
export const selectActiveRoute = (state) => state.activeRoute;
export const selectAnalytics = (state) => state.analytics;
export const selectMapView = (state) => state.mapView;
