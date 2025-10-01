import React, { useState, useMemo, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  PerspectiveCamera,
  useTexture,
  BakeShadows,
  ContactShadows,
  Float,
  Text3D,
  Center
} from '@react-three/drei';
// import { EffectComposer, Bloom, SSAO, ToneMapping } from '@react-three/postprocessing';
import { useDrag } from '@use-gesture/react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Palette,
  Layers,
  Ruler,
  Download,
  RotateCcw,
  ZoomIn,
  Info,
  CheckCircle2
} from 'lucide-react';

// Malarkey Roofing Products - Premium Collection
const MALARKEY_SHINGLES = {
  weatheredWood: {
    name: 'Legacy® Weathered Wood',
    color: '#8B7355',
    basePrice: 125,
    warranty: 'Lifetime Limited',
    windRating: '130 MPH',
    hailRating: 'Class 4',
    texture: '/assets/textures/shingles/weathered-wood.jpg',
    normalMap: '/assets/textures/shingles/weathered-wood-normal.jpg',
    roughness: 0.85,
    description: 'Rustic charm with modern durability',
    features: ['Scotchgard™ Protector', 'Zone Technology®', '3M Smog-reducing Granules']
  },
  stonewood: {
    name: 'Vista® Stonewood',
    color: '#6B5D54',
    basePrice: 115,
    warranty: 'Lifetime Limited',
    windRating: '110 MPH',
    hailRating: 'Class 4',
    texture: '/assets/textures/shingles/stonewood.jpg',
    normalMap: '/assets/textures/shingles/stonewood-normal.jpg',
    roughness: 0.8,
    description: 'Multi-dimensional stone-cut appearance',
    features: ['Scotchgard™ Protector', 'NEX® Polymer Technology']
  },
  midnightBlack: {
    name: 'Highland® Midnight Black',
    color: '#1A1A1A',
    basePrice: 135,
    warranty: 'Lifetime Limited',
    windRating: '130 MPH',
    hailRating: 'Class 4',
    texture: '/assets/textures/shingles/midnight-black.jpg',
    normalMap: '/assets/textures/shingles/midnight-black-normal.jpg',
    roughness: 0.75,
    description: 'Deep, rich color with superior protection',
    features: ['Scotchgard™ Protector', 'Zone Technology®', 'Cool Roof Rating']
  },
  driftwood: {
    name: 'Highlander® Driftwood',
    color: '#A89B8F',
    basePrice: 145,
    warranty: 'Lifetime Limited',
    windRating: '130 MPH',
    hailRating: 'Class 4',
    texture: '/assets/textures/shingles/driftwood.jpg',
    normalMap: '/assets/textures/shingles/driftwood-normal.jpg',
    roughness: 0.82,
    description: 'Natural wood-grain aesthetic',
    features: ['Scotchgard™ Protector', 'Zone Technology®', 'Upcycled Rubber Content']
  },
  charcoal: {
    name: 'Windsor® Charcoal',
    color: '#3C3C3C',
    basePrice: 105,
    warranty: 'Limited Lifetime',
    windRating: '110 MPH',
    hailRating: 'Class 3',
    texture: '/assets/textures/shingles/charcoal.jpg',
    normalMap: '/assets/textures/shingles/charcoal-normal.jpg',
    roughness: 0.8,
    description: 'Classic dark tones for timeless appeal',
    features: ['Scotchgard™ Protector', 'NEX® Polymer Technology']
  },
  terracotta: {
    name: 'Legacy® Terra Cotta',
    color: '#C87854',
    basePrice: 130,
    warranty: 'Lifetime Limited',
    windRating: '130 MPH',
    hailRating: 'Class 4',
    texture: '/assets/textures/shingles/terracotta.jpg',
    normalMap: '/assets/textures/shingles/terracotta-normal.jpg',
    roughness: 0.85,
    description: 'Warm Mediterranean-inspired color',
    features: ['Scotchgard™ Protector', 'Zone Technology®', 'Cool Roof Rating']
  },
  stormGrey: {
    name: 'Vista® Storm Grey',
    color: '#6D7278',
    basePrice: 120,
    warranty: 'Lifetime Limited',
    windRating: '110 MPH',
    hailRating: 'Class 4',
    texture: '/assets/textures/shingles/storm-grey.jpg',
    normalMap: '/assets/textures/shingles/storm-grey-normal.jpg',
    roughness: 0.78,
    description: 'Contemporary grey with depth',
    features: ['Scotchgard™ Protector', 'NEX® Polymer Technology', '3M Smog-reducing Granules']
  }
};

// 3D Shingle Component with realistic rendering
const Shingle3D = ({ position, rotation, color, texture, normalMap, roughness, scale = 1 }) => {
  const [hovered, setHovered] = useState(false);

  // Load textures with fallback to color
  const textures = useTexture(
    {
      map: texture || null,
      normalMap: normalMap || null
    },
    (textures) => {
      if (textures.map) {
        textures.map.wrapS = textures.map.wrapT = THREE.RepeatWrapping;
        textures.map.repeat.set(1, 0.33); // Shingle aspect ratio
      }
      if (textures.normalMap) {
        textures.normalMap.wrapS = textures.normalMap.wrapT = THREE.RepeatWrapping;
        textures.normalMap.repeat.set(1, 0.33);
      }
    }
  );

  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={hovered ? [scale * 1.05, scale * 1.05, scale * 1.05] : [scale, scale, scale]}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1.2, 0.4, 0.05]} />
      <meshStandardMaterial
        color={color}
        map={textures.map}
        normalMap={textures.normalMap}
        roughness={roughness}
        metalness={0.1}
        normalScale={new THREE.Vector2(1.5, 1.5)}
      />
    </mesh>
  );
};

// Shingle Array Display
const ShingleArray = ({ shingleData, rows = 6, cols = 8 }) => {
  const shingles = useMemo(() => {
    const array = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const offset = row % 2 === 0 ? 0 : 0.6; // Staggered pattern
        array.push({
          position: [col * 1.3 - cols * 0.65 + offset, row * -0.35, 0],
          rotation: [0, 0, 0],
          key: `shingle-${row}-${col}`
        });
      }
    }
    return array;
  }, [rows, cols]);

  return (
    <group>
      {shingles.map((shingle) => (
        <Shingle3D
          key={shingle.key}
          position={shingle.position}
          rotation={shingle.rotation}
          color={shingleData.color}
          texture={shingleData.texture}
          normalMap={shingleData.normalMap}
          roughness={shingleData.roughness}
        />
      ))}
    </group>
  );
};

// 3D Scene Component
const ShingleScene = ({ selectedShingle }) => {
  const shingleData = MALARKEY_SHINGLES[selectedShingle];

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={50} />
      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
        minDistance={8}
        maxDistance={20}
      />

      <ambientLight intensity={0.3} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-10, 5, -5]} intensity={0.5} />

      <Suspense fallback={null}>
        <ShingleArray shingleData={shingleData} rows={6} cols={8} />
        <Environment preset="sunset" />
        <ContactShadows
          position={[0, -2.5, 0]}
          opacity={0.4}
          scale={20}
          blur={2}
          far={4}
        />
      </Suspense>

      {/* Post-processing effects removed for React 18 compatibility */}

      <BakeShadows />
    </>
  );
};

// Main Component
const MalarkeyShingleSystem = ({ onSelectShingle, selectedShingle = 'weatheredWood' }) => {
  const [viewMode, setViewMode] = useState('3d'); // '3d', 'swatch', 'details'
  const [showSpecs, setShowSpecs] = useState(false);

  const currentShingle = MALARKEY_SHINGLES[selectedShingle];

  const handleShingleSelect = useCallback((shingleKey) => {
    onSelectShingle?.(shingleKey);
  }, [onSelectShingle]);

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Malarkey Roofing Products</h2>
              <p className="text-sm text-slate-400">Premium Architectural Shingles</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('3d')}
              className={`px-4 py-2 rounded-lg transition ${
                viewMode === '3d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              3D View
            </button>
            <button
              onClick={() => setViewMode('swatch')}
              className={`px-4 py-2 rounded-lg transition ${
                viewMode === 'swatch'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Palette className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowSpecs(!showSpecs)}
              className={`px-4 py-2 rounded-lg transition ${
                showSpecs
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Color Palette Sidebar */}
        <div className="w-80 bg-slate-800/50 border-r border-slate-700 overflow-y-auto p-4">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Available Colors
          </h3>

          <div className="space-y-3">
            {Object.entries(MALARKEY_SHINGLES).map(([key, shingle]) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleShingleSelect(key)}
                className={`w-full p-4 rounded-lg border-2 transition text-left ${
                  selectedShingle === key
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-12 h-12 rounded-lg shadow-lg border-2 border-slate-600"
                    style={{ backgroundColor: shingle.color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-medium text-sm">{shingle.name}</h4>
                      {selectedShingle === key && (
                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                    <p className="text-slate-400 text-xs">{shingle.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>${shingle.basePrice}/square</span>
                  <span className="text-green-400">{shingle.windRating}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Main Viewer */}
        <div className="flex-1 relative">
          {viewMode === '3d' && (
            <Canvas shadows gl={{ antialias: true, alpha: false }}>
              <ShingleScene selectedShingle={selectedShingle} />
            </Canvas>
          )}

          {viewMode === 'swatch' && (
            <div className="w-full h-full flex items-center justify-center p-8">
              <div className="max-w-4xl w-full">
                <div className="grid grid-cols-3 gap-6">
                  {Object.entries(MALARKEY_SHINGLES).map(([key, shingle]) => (
                    <motion.div
                      key={key}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => handleShingleSelect(key)}
                      className={`cursor-pointer rounded-xl overflow-hidden shadow-xl border-4 ${
                        selectedShingle === key ? 'border-blue-500' : 'border-transparent'
                      }`}
                    >
                      <div
                        className="h-48"
                        style={{ backgroundColor: shingle.color }}
                      />
                      <div className="bg-slate-800 p-4">
                        <h4 className="text-white font-semibold">{shingle.name}</h4>
                        <p className="text-slate-400 text-sm mt-1">{shingle.hailRating}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Specs Overlay */}
          <AnimatePresence>
            {showSpecs && (
              <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                className="absolute top-0 right-0 w-96 h-full bg-slate-800/95 backdrop-blur-sm border-l border-slate-700 p-6 overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Specifications</h3>
                  <button
                    onClick={() => setShowSpecs(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-white font-semibold mb-2">{currentShingle.name}</h4>
                    <p className="text-slate-400 text-sm">{currentShingle.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700/50 p-4 rounded-lg">
                      <div className="text-slate-400 text-xs mb-1">Base Price</div>
                      <div className="text-white font-bold text-lg">
                        ${currentShingle.basePrice}
                      </div>
                      <div className="text-slate-500 text-xs">per square</div>
                    </div>

                    <div className="bg-slate-700/50 p-4 rounded-lg">
                      <div className="text-slate-400 text-xs mb-1">Wind Rating</div>
                      <div className="text-green-400 font-bold text-lg">
                        {currentShingle.windRating}
                      </div>
                    </div>

                    <div className="bg-slate-700/50 p-4 rounded-lg">
                      <div className="text-slate-400 text-xs mb-1">Hail Rating</div>
                      <div className="text-blue-400 font-bold text-lg">
                        {currentShingle.hailRating}
                      </div>
                    </div>

                    <div className="bg-slate-700/50 p-4 rounded-lg">
                      <div className="text-slate-400 text-xs mb-1">Warranty</div>
                      <div className="text-purple-400 font-bold text-sm">
                        {currentShingle.warranty}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-white font-semibold mb-3">Key Features</h5>
                    <ul className="space-y-2">
                      {currentShingle.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-slate-700">
                    <h5 className="text-white font-semibold mb-3">Environmental Benefits</h5>
                    <div className="space-y-2 text-sm text-slate-300">
                      <p>✓ 3M Smog-reducing Granules</p>
                      <p>✓ Upcycled Rubber Content</p>
                      <p>✓ Cool Roof Technology</p>
                      <p>✓ ENERGY STAR® Rated</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-t border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Selected: <span className="text-white font-semibold">{currentShingle.name}</span>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2">
              <Download className="w-4 h-4" />
              Apply to Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MalarkeyShingleSystem;
export { MALARKEY_SHINGLES };
