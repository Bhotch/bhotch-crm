import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  PerspectiveCamera,
  SpotLight,
  useHelper,
  Sphere,
  Cylinder,
  Line,
  Html,
  ContactShadows
} from '@react-three/drei';
// import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import Draggable from 'react-draggable';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  Zap,
  Sun,
  Moon,
  Sparkles,
  Palette,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Download,
  Copy,
  Trash2,
  Plus,
  Grid3x3,
  Move
} from 'lucide-react';

// Rime Lighting Product Catalog
const RIME_PRODUCTS = {
  track: {
    name: 'Rime Track Lighting',
    type: 'track',
    power: 24, // Watts per foot
    lumens: 300, // Lumens per foot
    colorTemp: [2700, 3000, 4000, 5000, 6500], // Kelvin options
    pricePerFoot: 28,
    description: 'Flexible LED track system for architectural lighting',
    features: ['IP65 Rated', 'Dimmable', 'Smart Control Compatible']
  },
  spotlight: {
    name: 'Rime Accent Spot',
    type: 'spot',
    power: 12,
    lumens: 800,
    beamAngle: 25,
    priceEach: 85,
    description: 'Precision spotlight for highlighting features',
    features: ['Adjustable Beam', 'RGBW Color', 'DMX Compatible']
  },
  floodlight: {
    name: 'Rime Flood Wash',
    type: 'flood',
    power: 30,
    lumens: 2400,
    beamAngle: 120,
    priceEach: 125,
    description: 'Wide-angle flood for wall washing',
    features: ['Wide Coverage', 'Weather Resistant', 'Long-throw Capability']
  },
  uplighter: {
    name: 'Rime Ground Uplight',
    type: 'uplight',
    power: 15,
    lumens: 1200,
    beamAngle: 45,
    priceEach: 95,
    description: 'In-ground uplight for dramatic effects',
    features: ['Buried Installation', 'Heavy-duty Housing', 'Landscape Integration']
  }
};

// Lighting patterns presets
const LIGHTING_PATTERNS = {
  uniform: { name: 'Uniform Spacing', spacing: 12, description: 'Even distribution' },
  dramatic: { name: 'Dramatic Accent', spacing: 24, description: 'Bold focal points' },
  architectural: { name: 'Architectural', spacing: 18, description: 'Highlight structure' },
  ambient: { name: 'Ambient Wash', spacing: 8, description: 'Soft overall glow' },
  custom: { name: 'Custom Pattern', spacing: 12, description: 'Manual placement' }
};

// 3D Light Fixture Component
const LightFixture = ({
  position,
  type = 'spot',
  color = '#FFE5B4',
  intensity = 1,
  angle = 0.5,
  distance = 10,
  isSelected,
  onSelect,
  id
}) => {
  const lightRef = useRef();
  const [hovered, setHovered] = useState(false);

  // Animate light intensity
  useFrame((state) => {
    if (lightRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 0.9;
      lightRef.current.intensity = intensity * pulse;
    }
  });

  return (
    <group position={position}>
      {/* Physical fixture */}
      <mesh
        onClick={onSelect}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        scale={hovered || isSelected ? 1.2 : 1}
      >
        <Cylinder args={[0.1, 0.15, 0.3, 16]}>
          <meshStandardMaterial
            color={isSelected ? '#4F46E5' : '#1F2937'}
            metalness={0.8}
            roughness={0.2}
          />
        </Cylinder>
      </mesh>

      {/* Light source */}
      <spotLight
        ref={lightRef}
        color={color}
        intensity={intensity * 5}
        angle={angle}
        penumbra={0.5}
        distance={distance}
        castShadow
        shadow-mapSize={[512, 512]}
      />

      {/* Visual beam indicator */}
      {isSelected && (
        <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[Math.tan(angle) * 2, 2, 16, 1, true]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Label */}
      {(hovered || isSelected) && (
        <Html position={[0, 0.5, 0]} center>
          <div className="bg-slate-800 text-white px-3 py-1 rounded-lg text-xs whitespace-nowrap shadow-lg border border-slate-600">
            {type.charAt(0).toUpperCase() + type.slice(1)} Light #{id}
          </div>
        </Html>
      )}
    </group>
  );
};

// House Model Placeholder
const HouseModel = () => {
  return (
    <group position={[0, -1, 0]}>
      {/* Simplified house structure */}
      <mesh position={[0, 1, 0]} receiveShadow>
        <boxGeometry args={[6, 2, 4]} />
        <meshStandardMaterial color="#E5E7EB" roughness={0.8} />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 2.5, 0]} rotation={[0, Math.PI / 4, 0]} receiveShadow>
        <coneGeometry args={[4.5, 1.5, 4]} />
        <meshStandardMaterial color="#8B7355" roughness={0.85} />
      </mesh>

      {/* Ground plane */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#2F3E46" roughness={0.9} />
      </mesh>
    </group>
  );
};

// Main Lighting Scene
const LightingScene = ({ lights, selectedLightId, onSelectLight, showGrid }) => {
  return (
    <>
      <PerspectiveCamera makeDefault position={[8, 6, 8]} fov={60} />
      <OrbitControls
        enablePan
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2}
        minDistance={5}
        maxDistance={30}
      />

      <ambientLight intensity={0.1} />

      {showGrid && (
        <gridHelper args={[20, 20, '#4B5563', '#374151']} position={[0, -1, 0]} />
      )}

      <HouseModel />

      {lights.map((light) => (
        <LightFixture
          key={light.id}
          id={light.id}
          position={light.position}
          type={light.type}
          color={light.color}
          intensity={light.intensity}
          angle={light.angle}
          distance={light.distance}
          isSelected={selectedLightId === light.id}
          onSelect={() => onSelectLight(light.id)}
        />
      ))}

      <Environment preset="night" />
      <ContactShadows
        position={[0, -1, 0]}
        opacity={0.6}
        scale={20}
        blur={2}
        far={4}
      />

      {/* Post-processing effects removed for React 18 compatibility */}
    </>
  );
};

// Color Picker Component
const ColorPicker = ({ value, onChange, label }) => {
  const presetColors = [
    { name: 'Warm White', value: '#FFE5B4', temp: '2700K' },
    { name: 'Soft White', value: '#FFF8DC', temp: '3000K' },
    { name: 'Cool White', value: '#F0F8FF', temp: '4000K' },
    { name: 'Daylight', value: '#E6F2FF', temp: '5000K' },
    { name: 'Blue', value: '#4F46E5', temp: 'RGB' },
    { name: 'Green', value: '#10B981', temp: 'RGB' },
    { name: 'Red', value: '#EF4444', temp: 'RGB' },
    { name: 'Purple', value: '#A855F7', temp: 'RGB' }
  ];

  return (
    <div className="space-y-2">
      <label className="text-sm text-slate-400">{label}</label>
      <div className="grid grid-cols-4 gap-2">
        {presetColors.map((preset) => (
          <button
            key={preset.value}
            onClick={() => onChange(preset.value)}
            className={`h-10 rounded-lg border-2 transition ${
              value === preset.value ? 'border-blue-500 scale-110' : 'border-slate-600'
            }`}
            style={{ backgroundColor: preset.value }}
            title={`${preset.name} (${preset.temp})`}
          />
        ))}
      </div>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-lg cursor-pointer"
      />
    </div>
  );
};

// Main Component
const RimeLightingDesigner = () => {
  const [lights, setLights] = useState([]);
  const [selectedLightId, setSelectedLightId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState('track');
  const [selectedPattern, setSelectedPattern] = useState('uniform');
  const [isPlaying, setIsPlaying] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [globalSettings, setGlobalSettings] = useState({
    intensity: 1,
    color: '#FFE5B4',
    timeOfDay: 'night'
  });

  const selectedLight = useMemo(
    () => lights.find((l) => l.id === selectedLightId),
    [lights, selectedLightId]
  );

  // Add new light
  const handleAddLight = useCallback((type = selectedProduct) => {
    const newLight = {
      id: Date.now(),
      type,
      position: [Math.random() * 4 - 2, 2, Math.random() * 4 - 2],
      color: globalSettings.color,
      intensity: globalSettings.intensity,
      angle: type === 'spot' ? 0.4 : 0.8,
      distance: 10
    };
    setLights((prev) => [...prev, newLight]);
    setSelectedLightId(newLight.id);
  }, [selectedProduct, globalSettings]);

  // Auto-place lights in pattern
  const handleApplyPattern = useCallback(() => {
    const pattern = LIGHTING_PATTERNS[selectedPattern];
    const spacing = pattern.spacing / 12; // Convert to 3D units
    const newLights = [];

    // Create perimeter lighting
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = 5;
      newLights.push({
        id: Date.now() + i,
        type: selectedProduct,
        position: [Math.cos(angle) * radius, 2, Math.sin(angle) * radius],
        color: globalSettings.color,
        intensity: globalSettings.intensity,
        angle: 0.6,
        distance: 10
      });
    }

    setLights(newLights);
  }, [selectedPattern, selectedProduct, globalSettings]);

  // Update selected light
  const handleUpdateLight = useCallback((updates) => {
    setLights((prev) =>
      prev.map((light) =>
        light.id === selectedLightId ? { ...light, ...updates } : light
      )
    );
  }, [selectedLightId]);

  // Delete light
  const handleDeleteLight = useCallback(() => {
    setLights((prev) => prev.filter((light) => light.id !== selectedLightId));
    setSelectedLightId(null);
  }, [selectedLightId]);

  // Duplicate light
  const handleDuplicateLight = useCallback(() => {
    if (selectedLight) {
      const newLight = {
        ...selectedLight,
        id: Date.now(),
        position: [
          selectedLight.position[0] + 1,
          selectedLight.position[1],
          selectedLight.position[2] + 1
        ]
      };
      setLights((prev) => [...prev, newLight]);
      setSelectedLightId(newLight.id);
    }
  }, [selectedLight]);

  // Calculate cost estimate
  const costEstimate = useMemo(() => {
    const lightCosts = lights.reduce((total, light) => {
      const product = RIME_PRODUCTS[light.type];
      const cost = product.priceEach || product.pricePerFoot * 10;
      return total + cost;
    }, 0);

    const installation = lights.length * 75; // $75 per fixture installation
    const controller = 350; // Smart controller
    const powerSupply = 200;

    return {
      materials: lightCosts,
      installation,
      controller,
      powerSupply,
      total: lightCosts + installation + controller + powerSupply
    };
  }, [lights]);

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-6 h-6 text-yellow-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Rime Lighting Designer</h2>
              <p className="text-sm text-slate-400">
                {lights.length} fixtures • Est. ${costEstimate.total.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-4 py-2 rounded-lg transition ${
                showGrid ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'
              } text-white`}
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setLights([])}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Products & Patterns */}
        <div className="w-80 bg-slate-800/50 border-r border-slate-700 overflow-y-auto p-4">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Lighting Products
          </h3>

          <div className="space-y-3 mb-6">
            {Object.entries(RIME_PRODUCTS).map(([key, product]) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedProduct(key)}
                className={`w-full p-4 rounded-lg border-2 transition text-left ${
                  selectedProduct === key
                    ? 'border-yellow-500 bg-yellow-500/10'
                    : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                }`}
              >
                <h4 className="text-white font-medium text-sm mb-1">{product.name}</h4>
                <p className="text-slate-400 text-xs mb-2">{product.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{product.power}W • {product.lumens}lm</span>
                  <span className="text-green-400 font-semibold">
                    ${product.priceEach || product.pricePerFoot + '/ft'}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>

          <button
            onClick={() => handleAddLight()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center justify-center gap-2 mb-6"
          >
            <Plus className="w-5 h-5" />
            Add Light
          </button>

          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Lighting Patterns
          </h3>

          <div className="space-y-2 mb-6">
            {Object.entries(LIGHTING_PATTERNS).map(([key, pattern]) => (
              <button
                key={key}
                onClick={() => setSelectedPattern(key)}
                className={`w-full p-3 rounded-lg border transition text-left ${
                  selectedPattern === key
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                }`}
              >
                <div className="text-white font-medium text-sm">{pattern.name}</div>
                <div className="text-slate-400 text-xs">{pattern.description}</div>
              </button>
            ))}
          </div>

          <button
            onClick={handleApplyPattern}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
          >
            Apply Pattern
          </button>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <h3 className="text-white font-semibold mb-4">Global Settings</h3>

            <ColorPicker
              value={globalSettings.color}
              onChange={(color) => setGlobalSettings((prev) => ({ ...prev, color }))}
              label="Default Color"
            />

            <div className="mt-4">
              <label className="text-sm text-slate-400 block mb-2">Default Intensity</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={globalSettings.intensity}
                onChange={(e) =>
                  setGlobalSettings((prev) => ({ ...prev, intensity: parseFloat(e.target.value) }))
                }
                className="w-full"
              />
              <div className="text-center text-white text-sm mt-1">
                {(globalSettings.intensity * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        {/* Center - 3D Viewer */}
        <div className="flex-1 relative">
          <Canvas shadows>
            <LightingScene
              lights={lights}
              selectedLightId={selectedLightId}
              onSelectLight={setSelectedLightId}
              showGrid={showGrid}
            />
          </Canvas>

          {/* Overlay controls */}
          <div className="absolute top-4 left-4 bg-slate-800/80 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              <span className="font-semibold">Scene Stats</span>
            </div>
            <div className="text-slate-300 space-y-1 text-xs">
              <div>Fixtures: {lights.length}</div>
              <div>Total Power: {lights.reduce((sum, l) => sum + (RIME_PRODUCTS[l.type]?.power || 0), 0)}W</div>
              <div>Total Lumens: {lights.reduce((sum, l) => sum + (RIME_PRODUCTS[l.type]?.lumens || 0), 0).toLocaleString()}lm</div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Light Properties */}
        {selectedLight && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="w-80 bg-slate-800/50 border-l border-slate-700 overflow-y-auto p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Light Properties
              </h3>
              <div className="flex gap-1">
                <button
                  onClick={handleDuplicateLight}
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={handleDeleteLight}
                  className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">Type</label>
                <select
                  value={selectedLight.type}
                  onChange={(e) => handleUpdateLight({ type: e.target.value })}
                  className="w-full bg-slate-700 text-white rounded-lg px-3 py-2"
                >
                  {Object.entries(RIME_PRODUCTS).map(([key, product]) => (
                    <option key={key} value={key}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <ColorPicker
                value={selectedLight.color}
                onChange={(color) => handleUpdateLight({ color })}
                label="Light Color"
              />

              <div>
                <label className="text-sm text-slate-400 block mb-2">Intensity</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={selectedLight.intensity}
                  onChange={(e) => handleUpdateLight({ intensity: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="text-center text-white text-sm mt-1">
                  {(selectedLight.intensity * 100).toFixed(0)}%
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Beam Angle</label>
                <input
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.1"
                  value={selectedLight.angle}
                  onChange={(e) => handleUpdateLight({ angle: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="text-center text-white text-sm mt-1">
                  {((selectedLight.angle * 180) / Math.PI).toFixed(0)}°
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Distance</label>
                <input
                  type="range"
                  min="5"
                  max="20"
                  step="1"
                  value={selectedLight.distance}
                  onChange={(e) => handleUpdateLight({ distance: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="text-center text-white text-sm mt-1">
                  {selectedLight.distance.toFixed(1)}m
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <h4 className="text-white font-semibold mb-3">Position</h4>
                <div className="grid grid-cols-3 gap-2">
                  {['X', 'Y', 'Z'].map((axis, idx) => (
                    <div key={axis}>
                      <label className="text-xs text-slate-400 block mb-1">{axis}</label>
                      <input
                        type="number"
                        step="0.5"
                        value={selectedLight.position[idx].toFixed(1)}
                        onChange={(e) => {
                          const newPos = [...selectedLight.position];
                          newPos[idx] = parseFloat(e.target.value) || 0;
                          handleUpdateLight({ position: newPos });
                        }}
                        className="w-full bg-slate-700 text-white rounded px-2 py-1 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer - Cost Summary */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-t border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-slate-400">Materials:</span>
              <span className="text-white font-semibold ml-2">
                ${costEstimate.materials.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Installation:</span>
              <span className="text-white font-semibold ml-2">
                ${costEstimate.installation.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Total:</span>
              <span className="text-green-400 font-bold ml-2 text-lg">
                ${costEstimate.total.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Design
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Apply to Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RimeLightingDesigner;
export { RIME_PRODUCTS, LIGHTING_PATTERNS };
