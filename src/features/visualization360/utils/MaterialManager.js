import * as THREE from 'three';

/**
 * Material Manager for Shingles, Lighting, and Textures
 */

// Malarkey Shingle Color Palette - Highlander & Vista Series (8 Colors)
export const MALARKEY_COLORS = {
  // Highlander Series - Premium Impact-Resistant Shingles
  'antique-slate': {
    name: 'Highlander® Antique Slate',
    series: 'Highlander',
    hex: '#4A5358',
    baseColor: new THREE.Color(0x4A5358),
    roughness: 0.84,
    metalness: 0.0,
    warranty: 'Lifetime Limited',
    windRating: '130 MPH',
    impactRating: 'Class 4 (UL 2218)',
  },
  'black-oak': {
    name: 'Highlander® Black Oak',
    series: 'Highlander',
    hex: '#2B2520',
    baseColor: new THREE.Color(0x2B2520),
    roughness: 0.86,
    metalness: 0.0,
    warranty: 'Lifetime Limited',
    windRating: '130 MPH',
    impactRating: 'Class 4 (UL 2218)',
  },
  'weathered-wood': {
    name: 'Highlander® Weathered Wood',
    series: 'Highlander',
    hex: '#8B7355',
    baseColor: new THREE.Color(0x8B7355),
    roughness: 0.85,
    metalness: 0.0,
    warranty: 'Lifetime Limited',
    windRating: '130 MPH',
    impactRating: 'Class 4 (UL 2218)',
  },
  'storm-grey': {
    name: 'Highlander® Storm Grey',
    series: 'Highlander',
    hex: '#6D7278',
    baseColor: new THREE.Color(0x6D7278),
    roughness: 0.83,
    metalness: 0.0,
    warranty: 'Lifetime Limited',
    windRating: '130 MPH',
    impactRating: 'Class 4 (UL 2218)',
  },
  // Vista Series - Architectural Shingles
  'midnight-black': {
    name: 'Vista® Midnight Black',
    series: 'Vista',
    hex: '#1C1C1C',
    baseColor: new THREE.Color(0x1C1C1C),
    roughness: 0.82,
    metalness: 0.0,
    warranty: 'Limited Lifetime',
    windRating: '110 MPH',
    impactRating: 'Class 3',
  },
  'driftwood': {
    name: 'Vista® Driftwood',
    series: 'Vista',
    hex: '#A89B8F',
    baseColor: new THREE.Color(0xA89B8F),
    roughness: 0.84,
    metalness: 0.0,
    warranty: 'Limited Lifetime',
    windRating: '110 MPH',
    impactRating: 'Class 3',
  },
  'terra-cotta': {
    name: 'Vista® Terra Cotta',
    series: 'Vista',
    hex: '#C87854',
    baseColor: new THREE.Color(0xC87854),
    roughness: 0.85,
    metalness: 0.0,
    warranty: 'Limited Lifetime',
    windRating: '110 MPH',
    impactRating: 'Class 3',
  },
  'desert-tan': {
    name: 'Vista® Desert Tan',
    series: 'Vista',
    hex: '#D4B896',
    baseColor: new THREE.Color(0xD4B896),
    roughness: 0.83,
    metalness: 0.0,
    warranty: 'Limited Lifetime',
    windRating: '110 MPH',
    impactRating: 'Class 3',
  },
};

// Rime Lighting Track Colors
export const RIME_TRACK_COLORS = {
  'white': { name: 'White', hex: '#FFFFFF', color: new THREE.Color(0xFFFFFF) },
  'black': { name: 'Black', hex: '#000000', color: new THREE.Color(0x000000) },
  'bronze': { name: 'Bronze', hex: '#CD7F32', color: new THREE.Color(0xCD7F32) },
  'silver': { name: 'Silver', hex: '#C0C0C0', color: new THREE.Color(0xC0C0C0) },
  'charcoal': { name: 'Charcoal', hex: '#36454F', color: new THREE.Color(0x36454F) },
  'brown': { name: 'Brown', hex: '#8B4513', color: new THREE.Color(0x8B4513) },
  'beige': { name: 'Beige', hex: '#F5F5DC', color: new THREE.Color(0xF5F5DC) },
  'gray': { name: 'Gray', hex: '#808080', color: new THREE.Color(0x808080) },
};

/**
 * Create shingle material with realistic properties
 */
export const createShingleMaterial = (colorKey, opacity = 0.95) => {
  const colorData = MALARKEY_COLORS[colorKey] || MALARKEY_COLORS['weathered-wood'];

  const material = new THREE.MeshStandardMaterial({
    color: colorData.baseColor,
    roughness: colorData.roughness,
    metalness: colorData.metalness,
    transparent: opacity < 1,
    opacity,
    side: THREE.DoubleSide,
  });

  return material;
};

/**
 * Create procedural shingle texture
 */
export const createProceduralShingleTexture = (color, width = 512, height = 512) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Base color
  ctx.fillStyle = color.hex;
  ctx.fillRect(0, 0, width, height);

  // Add shingle pattern
  const shingleWidth = width / 8;
  const shingleHeight = height / 12;

  ctx.strokeStyle = `rgba(0, 0, 0, 0.2)`;
  ctx.lineWidth = 2;

  // Draw horizontal shingle lines
  for (let y = 0; y < height; y += shingleHeight) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();

    // Draw vertical offset lines
    const offset = (y / shingleHeight) % 2 === 0 ? 0 : shingleWidth / 2;
    for (let x = offset; x < width; x += shingleWidth) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + shingleHeight);
      ctx.stroke();
    }
  }

  // Add texture variation
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const variation = (Math.random() - 0.5) * 20;
    data[i] = Math.max(0, Math.min(255, data[i] + variation));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + variation));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + variation));
  }

  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);

  return texture;
};

/**
 * Create aluminum track material for Rime lighting
 */
export const createTrackMaterial = (colorKey = 'white') => {
  const colorData = RIME_TRACK_COLORS[colorKey] || RIME_TRACK_COLORS['white'];

  return new THREE.MeshStandardMaterial({
    color: colorData.color,
    roughness: 0.3,
    metalness: 0.8,
    envMapIntensity: 1.0,
  });
};

/**
 * Create LED light material
 */
export const createLEDMaterial = (color = '#ffffff', intensity = 1.0) => {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    emissive: new THREE.Color(color),
    emissiveIntensity: intensity,
    transparent: true,
    opacity: 0.9,
  });
};

/**
 * Create light beam material
 */
export const createLightBeamMaterial = (color = '#ffffff', opacity = 0.15) => {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
};

/**
 * Create normal map for enhanced shingle detail
 */
export const createShingleNormalMap = (width = 512, height = 512) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Create bump pattern
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#8080ff');
  gradient.addColorStop(0.5, '#ffffff');
  gradient.addColorStop(1, '#8080ff');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  return texture;
};

/**
 * Create overlay material for product placement
 */
export const createOverlayMaterial = (texture, opacity = 0.9) => {
  return new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
};

/**
 * Get all shingle colors for palette
 */
export const getShinglePalette = () => {
  return Object.entries(MALARKEY_COLORS).map(([key, data]) => ({
    id: key,
    name: data.name,
    hex: data.hex,
    color: data.baseColor,
  }));
};

/**
 * Get all track colors for palette
 */
export const getTrackPalette = () => {
  return Object.entries(RIME_TRACK_COLORS).map(([key, data]) => ({
    id: key,
    name: data.name,
    hex: data.hex,
    color: data.color,
  }));
};

/**
 * Create panorama sphere material
 */
export const createPanoramaMaterial = (texture) => {
  return new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
  });
};

/**
 * Update material properties
 */
export const updateMaterialProperties = (material, properties) => {
  Object.keys(properties).forEach((key) => {
    if (material[key] !== undefined) {
      material[key] = properties[key];
    }
  });
  material.needsUpdate = true;
};
