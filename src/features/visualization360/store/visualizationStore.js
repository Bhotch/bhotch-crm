import { create } from 'zustand';

/**
 * Zustand Store for 360° Visualization State Management
 * Manages all state related to house visualization, products, and UI
 */
export const useVisualizationStore = create((set, get) => ({
  // ========== IMAGE STATE ==========
  images: {
    before: null,
    after: null,
    captured: [], // Array of 8 captured photos
    panorama: null,
  },

  // ========== 3D MODEL STATE ==========
  model3D: {
    data: null, // 3D model data (GLB, point cloud, etc.)
    type: null, // 'glb', 'pointCloud', 'procedural'
    url: null, // Model URL
    isGenerated: false,
    generationMethod: null, // 'photogrammetry', 'ai-depth', 'procedural'
    quality: null,
  },

  set3DModel: (modelData) => set({ model3D: modelData }),

  clear3DModel: () => set({
    model3D: {
      data: null,
      type: null,
      url: null,
      isGenerated: false,
      generationMethod: null,
      quality: null,
    }
  }),

  setBeforeImage: (imageUrl) => set((state) => ({
    images: { ...state.images, before: imageUrl }
  })),

  setAfterImage: (imageUrl) => set((state) => ({
    images: { ...state.images, after: imageUrl }
  })),

  addCapturedImage: (image) => set((state) => ({
    images: {
      ...state.images,
      captured: [...state.images.captured, image]
    }
  })),

  clearCapturedImages: () => set((state) => ({
    images: { ...state.images, captured: [] }
  })),

  // ========== VIEW MODE ==========
  viewMode: 'before', // 'before', 'after', 'compare', 'split'

  setViewMode: (mode) => set({ viewMode: mode }),

  // ========== MALARKEY SHINGLES ==========
  shingles: {
    selectedColor: 'weathered-wood',
    appliedRegions: [], // Array of { id, color, mask, position }
    opacity: 0.95,
  },

  setShingleColor: (color) => set((state) => ({
    shingles: { ...state.shingles, selectedColor: color }
  })),

  addShingleRegion: (region) => set((state) => ({
    shingles: {
      ...state.shingles,
      appliedRegions: [...state.shingles.appliedRegions, region]
    }
  })),

  removeShingleRegion: (regionId) => set((state) => ({
    shingles: {
      ...state.shingles,
      appliedRegions: state.shingles.appliedRegions.filter(r => r.id !== regionId)
    }
  })),

  setShingleOpacity: (opacity) => set((state) => ({
    shingles: { ...state.shingles, opacity }
  })),

  // ========== RIME LIGHTING ==========
  lighting: {
    enabled: false,
    trackColor: 'white', // Aluminum track color
    lights: [], // Array of light fixtures
    pattern: 'solid', // 'solid', 'chase', 'fade', 'holiday'
    color: '#ffffff',
    brightness: 100,
  },

  toggleLighting: () => set((state) => ({
    lighting: { ...state.lighting, enabled: !state.lighting.enabled }
  })),

  setLightingEnabled: (enabled) => set((state) => ({
    lighting: { ...state.lighting, enabled }
  })),

  setTrackColor: (color) => set((state) => ({
    lighting: { ...state.lighting, trackColor: color }
  })),

  addLight: (light) => set((state) => ({
    lighting: {
      ...state.lighting,
      lights: [...state.lighting.lights, { ...light, id: Date.now() }]
    }
  })),

  removeLight: (lightId) => set((state) => ({
    lighting: {
      ...state.lighting,
      lights: state.lighting.lights.filter(l => l.id !== lightId)
    }
  })),

  updateLight: (lightId, updates) => set((state) => ({
    lighting: {
      ...state.lighting,
      lights: state.lighting.lights.map(l =>
        l.id === lightId ? { ...l, ...updates } : l
      )
    }
  })),

  setLightingPattern: (pattern) => set((state) => ({
    lighting: { ...state.lighting, pattern }
  })),

  setLightingColor: (color) => set((state) => ({
    lighting: { ...state.lighting, color }
  })),

  setLightingBrightness: (brightness) => set((state) => ({
    lighting: { ...state.lighting, brightness }
  })),

  generateDefaultLighting: () => set((state) => ({
    lighting: {
      ...state.lighting,
      enabled: true,
      lights: [
        {
          id: Date.now() + 1,
          position: [-15, 8, -25],
          color: '#fff8dc',
          intensity: 2.5,
          range: 18,
          beamWidth: 2.5,
          beamLength: 12
        },
        {
          id: Date.now() + 2,
          position: [15, 8, -25],
          color: '#fff8dc',
          intensity: 2.5,
          range: 18,
          beamWidth: 2.5,
          beamLength: 12
        },
        {
          id: Date.now() + 3,
          position: [-10, 4, -20],
          color: '#fffacd',
          intensity: 2,
          range: 15,
          beamWidth: 2,
          beamLength: 10
        },
        {
          id: Date.now() + 4,
          position: [10, 4, -20],
          color: '#fffacd',
          intensity: 2,
          range: 15,
          beamWidth: 2,
          beamLength: 10
        },
        {
          id: Date.now() + 5,
          position: [0, 3, -18],
          color: '#ffffff',
          intensity: 1.8,
          range: 12,
          beamWidth: 1.8,
          beamLength: 8
        }
      ]
    }
  })),

  // ========== ROOF PRODUCTS ==========
  roofProducts: [],

  addRoofProduct: (product) => set((state) => ({
    roofProducts: [...state.roofProducts, { ...product, id: Date.now() }]
  })),

  removeRoofProduct: (productId) => set((state) => ({
    roofProducts: state.roofProducts.filter(p => p.id !== productId)
  })),

  updateRoofProduct: (productId, updates) => set((state) => ({
    roofProducts: state.roofProducts.map(p =>
      p.id === productId ? { ...p, ...updates } : p
    )
  })),

  // ========== PHOTO CAPTURE STATE ==========
  photoCapture: {
    isCapturing: false,
    currentStep: 0,
    requiredPhotos: [
      { id: 1, name: 'Front Left Corner', angle: 'front-left', captured: false },
      { id: 2, name: 'Front Right Corner', angle: 'front-right', captured: false },
      { id: 3, name: 'Left Side Elevation', angle: 'left-side', captured: false },
      { id: 4, name: 'Right Side Elevation', angle: 'right-side', captured: false },
      { id: 5, name: 'Back Left Corner', angle: 'back-left', captured: false },
      { id: 6, name: 'Back Right Corner', angle: 'back-right', captured: false },
      { id: 7, name: 'Overhead/Drone View', angle: 'overhead', captured: false },
      { id: 8, name: 'Roof Detail Close-up', angle: 'detail', captured: false },
    ],
    capturedPhotos: [],
  },

  startPhotoCapture: () => set((state) => ({
    photoCapture: { ...state.photoCapture, isCapturing: true, currentStep: 0 }
  })),

  stopPhotoCapture: () => set((state) => ({
    photoCapture: { ...state.photoCapture, isCapturing: false }
  })),

  nextCaptureStep: () => set((state) => ({
    photoCapture: {
      ...state.photoCapture,
      currentStep: Math.min(state.photoCapture.currentStep + 1, 7)
    }
  })),

  capturePhoto: (photoData) => set((state) => {
    const updatedRequired = [...state.photoCapture.requiredPhotos];
    updatedRequired[state.photoCapture.currentStep].captured = true;

    return {
      photoCapture: {
        ...state.photoCapture,
        requiredPhotos: updatedRequired,
        capturedPhotos: [...state.photoCapture.capturedPhotos, photoData]
      }
    };
  }),

  // ========== UI STATE ==========
  ui: {
    activePanel: 'products', // 'products', 'lighting', 'capture', 'export'
    showControls: true,
    isLoading: false,
    uploadProgress: 0,
  },

  setActivePanel: (panel) => set((state) => ({
    ui: { ...state.ui, activePanel: panel }
  })),

  toggleControls: () => set((state) => ({
    ui: { ...state.ui, showControls: !state.ui.showControls }
  })),

  setLoading: (isLoading) => set((state) => ({
    ui: { ...state.ui, isLoading }
  })),

  setUploadProgress: (progress) => set((state) => ({
    ui: { ...state.ui, uploadProgress: progress }
  })),

  // ========== 3D SCENE STATE ==========
  scene: {
    cameraPosition: [0, 0, 0.1],
    fov: 75,
    controls: {
      enableZoom: true,
      enablePan: false,
      enableRotate: true,
    },
  },

  setCameraPosition: (position) => set((state) => ({
    scene: { ...state.scene, cameraPosition: position }
  })),

  setFov: (fov) => set((state) => ({
    scene: { ...state.scene, fov }
  })),

  // ========== MEASUREMENTS & CALCULATIONS ==========
  measurements: {
    roofArea: 0,
    perimeter: 0,
    pitch: 0,
    sqFt: 0,
  },

  setMeasurements: (measurements) => set({ measurements }),

  // ========== EXPORT STATE ==========
  export: {
    format: 'png', // 'png', 'jpg', 'pdf'
    quality: 0.95,
    includeWatermark: false,
  },

  setExportFormat: (format) => set((state) => ({
    export: { ...state.export, format }
  })),

  setExportQuality: (quality) => set((state) => ({
    export: { ...state.export, quality }
  })),

  // ========== RESET FUNCTIONS ==========
  resetAll: () => set({
    images: {
      before: null,
      after: null,
      captured: [],
      panorama: null,
    },
    viewMode: 'before',
    shingles: {
      selectedColor: 'weathered-wood',
      appliedRegions: [],
      opacity: 0.95,
    },
    lighting: {
      enabled: false,
      trackColor: 'white',
      lights: [],
      pattern: 'solid',
      color: '#ffffff',
      brightness: 100,
    },
    roofProducts: [],
    ui: {
      activePanel: 'products',
      showControls: true,
      isLoading: false,
      uploadProgress: 0,
    },
  }),
}));
