import React, { useState, useRef, useEffect, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sphere, useTexture, Html } from '@react-three/drei';

// 360° Panorama Sphere Component
function PanoramaSphere({ imageUrl, opacity = 1 }) {
  const texture = useTexture(imageUrl);

  useEffect(() => {
    if (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.colorSpace = THREE.SRGBColorSpace;
    }
  }, [texture]);

  return (
    <Sphere args={[500, 60, 40]} scale={[-1, 1, 1]}>
      <meshBasicMaterial
        map={texture}
        side={THREE.BackSide}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </Sphere>
  );
}

// Roof Overlay Component with realistic blending
function RoofOverlay({ roofStyle, position, scale, rotation }) {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const roofTextures = {
      'ridge-vent': '/assets/roof-ridge-vent.png',
      'intake-vent': '/assets/roof-intake-vent.png',
      'turbine': '/assets/roof-turbine.png',
      'solar-panel': '/assets/roof-solar.png',
      'custom': null
    };

    if (roofTextures[roofStyle]) {
      loader.load(roofTextures[roofStyle], (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        setTexture(tex);
      });
    }
  }, [roofStyle]);

  if (!texture) return null;

  return (
    <mesh position={position} scale={scale} rotation={rotation}>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial
        map={texture}
        transparent
        opacity={0.95}
        side={THREE.DoubleSide}
        blending={THREE.NormalBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

// Lighting Overlay Component (Jellyfish outdoor lighting)
function LightingOverlay({ lights, enabled }) {
  if (!enabled) return null;

  return (
    <group>
      {lights.map((light, index) => (
        <group key={index} position={light.position}>
          {/* Glow effect */}
          <pointLight
            color={light.color}
            intensity={light.intensity}
            distance={light.range}
            decay={2}
          />
          {/* Visible light fixture */}
          <mesh>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial color={light.color} />
          </mesh>
          {/* Light beam effect */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[light.beamWidth, light.beamLength, 32, 1, true]} />
            <meshBasicMaterial
              color={light.color}
              transparent
              opacity={0.15}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Scene Controller Component
function SceneController({ beforeImage, afterImage, showAfter, roofProducts, lightingConfig }) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, 0.1);
  }, [camera]);

  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />

      {/* Before image (base panorama) */}
      {beforeImage && !showAfter && (
        <PanoramaSphere imageUrl={beforeImage} opacity={1} />
      )}

      {/* After image with modifications */}
      {afterImage && showAfter && (
        <>
          <PanoramaSphere imageUrl={afterImage || beforeImage} opacity={1} />

          {/* Roof product overlays */}
          {roofProducts.map((product, index) => (
            <RoofOverlay
              key={index}
              roofStyle={product.style}
              position={product.position}
              scale={product.scale}
              rotation={product.rotation}
            />
          ))}

          {/* Outdoor lighting overlays */}
          <LightingOverlay
            lights={lightingConfig.lights}
            enabled={lightingConfig.enabled}
          />
        </>
      )}

      {/* Comparison mode - split view */}
      {showAfter === 'compare' && beforeImage && afterImage && (
        <>
          <PanoramaSphere imageUrl={beforeImage} opacity={0.5} />
          <PanoramaSphere imageUrl={afterImage} opacity={0.5} />
        </>
      )}
    </>
  );
}

// Main House Visualization Component
export default function HouseVisualization({ leadId }) {
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);
  const [viewMode, setViewMode] = useState('before'); // 'before', 'after', 'compare'
  const [roofProducts, setRoofProducts] = useState([]);
  const [lightingConfig, setLightingConfig] = useState({
    enabled: false,
    lights: []
  });
  const [selectedRoofStyle, setSelectedRoofStyle] = useState('ridge-vent');
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef();

  // Handle image upload and conversion to equirectangular
  const handleImageUpload = async (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingImage(true);

    try {
      // Create local URL for the uploaded image
      const imageUrl = URL.createObjectURL(file);

      // Store in state
      if (type === 'before') {
        setBeforeImage(imageUrl);
      } else {
        setAfterImage(imageUrl);
      }

      // TODO: Upload to server/cloud storage
      // const formData = new FormData();
      // formData.append('image', file);
      // formData.append('leadId', leadId);
      // await fetch('/api/upload-house-image', { method: 'POST', body: formData });

    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Add roof product to scene
  const addRoofProduct = () => {
    const newProduct = {
      id: Date.now(),
      style: selectedRoofStyle,
      position: [0, 20, -50],
      scale: [5, 5, 1],
      rotation: [0, 0, 0]
    };
    setRoofProducts([...roofProducts, newProduct]);
  };

  // Add lighting fixture
  const addLightingFixture = (position) => {
    const newLight = {
      id: Date.now(),
      position: position || [-10, 5, -20],
      color: '#ffffff',
      intensity: 2,
      range: 15,
      beamWidth: 2,
      beamLength: 10
    };

    setLightingConfig({
      enabled: true,
      lights: [...lightingConfig.lights, newLight]
    });
  };

  // Generate default lighting pattern
  const generateDefaultLighting = () => {
    const defaultLights = [
      { position: [-15, 8, -25], color: '#fff8dc', intensity: 2.5, range: 18, beamWidth: 2.5, beamLength: 12 },
      { position: [15, 8, -25], color: '#fff8dc', intensity: 2.5, range: 18, beamWidth: 2.5, beamLength: 12 },
      { position: [-10, 4, -20], color: '#fffacd', intensity: 2, range: 15, beamWidth: 2, beamLength: 10 },
      { position: [10, 4, -20], color: '#fffacd', intensity: 2, range: 15, beamWidth: 2, beamLength: 10 },
      { position: [0, 3, -18], color: '#ffffff', intensity: 1.8, range: 12, beamWidth: 1.8, beamLength: 8 }
    ];

    setLightingConfig({
      enabled: true,
      lights: defaultLights
    });
  };

  // Remove product
  const removeProduct = (productId) => {
    setRoofProducts(roofProducts.filter(p => p.id !== productId));
  };

  // Remove light
  const removeLight = (lightId) => {
    setLightingConfig({
      ...lightingConfig,
      lights: lightingConfig.lights.filter(l => l.id !== lightId)
    });
  };

  return (
    <div className="house-visualization-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Control Panel */}
      <div className="absolute top-3 left-3 lg:top-5 lg:left-5 z-10 bg-white/95 rounded-lg p-3 lg:p-5 shadow-lg w-[calc(100%-24px)] sm:w-80 lg:w-[350px] max-h-[calc(100vh-150px)] lg:max-h-[calc(100vh-200px)] overflow-y-auto">
        <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4">360° House Visualization</h3>

        {/* Image Upload Section */}
        <div className="mb-4 lg:mb-5">
          <h4 className="text-xs lg:text-sm font-semibold mb-2 lg:mb-2.5">Images</h4>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={(e) => handleImageUpload(e, 'before')}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className="w-full py-2 lg:py-2.5 px-3 lg:px-4 mb-2 bg-green-600 text-white rounded text-xs lg:text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploadingImage ? 'Uploading...' : beforeImage ? 'Change Image' : 'Upload House Photo'}
          </button>
          {beforeImage && (
            <div className="text-xs text-gray-600 mt-1">
              ✓ Image loaded
            </div>
          )}
        </div>

        {/* View Mode Selector */}
        <div className="mb-4 lg:mb-5">
          <h4 className="text-xs lg:text-sm font-semibold mb-2 lg:mb-2.5">View Mode</h4>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('before')}
              className={`flex-1 py-2 px-2 lg:px-3 rounded text-xs lg:text-sm font-medium transition-colors ${
                viewMode === 'before' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Before
            </button>
            <button
              onClick={() => setViewMode('after')}
              className={`flex-1 py-2 px-2 lg:px-3 rounded text-xs lg:text-sm font-medium transition-colors ${
                viewMode === 'after' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              After
            </button>
            <button
              onClick={() => setViewMode('compare')}
              className={`flex-1 py-2 px-2 lg:px-3 rounded text-xs lg:text-sm font-medium transition-colors ${
                viewMode === 'compare' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Compare
            </button>
          </div>
        </div>

        {/* Roof Products Section */}
        {viewMode !== 'before' && (
          <div className="mb-4 lg:mb-5">
            <h4 className="text-xs lg:text-sm font-semibold mb-2 lg:mb-2.5">Roof Products</h4>
            <select
              value={selectedRoofStyle}
              onChange={(e) => setSelectedRoofStyle(e.target.value)}
              className="w-full p-2 mb-2 border border-gray-300 rounded text-xs lg:text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="ridge-vent">Ridge Vent</option>
              <option value="intake-vent">Intake Vent</option>
              <option value="turbine">Turbine Vent</option>
              <option value="solar-panel">Solar Panel</option>
            </select>
            <button
              onClick={addRoofProduct}
              className="w-full py-2 lg:py-2.5 px-3 lg:px-4 bg-orange-600 text-white rounded text-xs lg:text-sm font-medium hover:bg-orange-700 transition-colors"
            >
              Add Roof Product
            </button>
            {roofProducts.length > 0 && (
              <div className="mt-2 lg:mt-2.5">
                {roofProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex justify-between items-center p-2 bg-gray-100 mb-1 rounded text-xs lg:text-sm"
                  >
                    <span>{product.style.replace('-', ' ').toUpperCase()}</span>
                    <button
                      onClick={() => removeProduct(product.id)}
                      className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Outdoor Lighting Section */}
        {viewMode !== 'before' && (
          <div className="mb-4 lg:mb-5">
            <h4 className="text-xs lg:text-sm font-semibold mb-2 lg:mb-2.5">Outdoor Lighting (Jellyfish)</h4>
            <button
              onClick={generateDefaultLighting}
              className="w-full py-2 lg:py-2.5 px-3 lg:px-4 mb-2 bg-purple-700 text-white rounded text-xs lg:text-sm font-medium hover:bg-purple-800 transition-colors"
            >
              Generate Lighting Design
            </button>
            <button
              onClick={() => addLightingFixture()}
              className="w-full py-2 lg:py-2.5 px-3 lg:px-4 bg-purple-600 text-white rounded text-xs lg:text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              Add Single Light
            </button>
            <div className="mt-2">
              <label className="flex items-center text-xs lg:text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={lightingConfig.enabled}
                  onChange={(e) => setLightingConfig({ ...lightingConfig, enabled: e.target.checked })}
                  className="mr-2 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                Show Lighting
              </label>
            </div>
            {lightingConfig.lights.length > 0 && (
              <div className="mt-2 lg:mt-2.5">
                <div className="text-xs text-gray-600 mb-1.5">
                  {lightingConfig.lights.length} light fixture(s)
                </div>
                {lightingConfig.lights.map((light) => (
                  <div
                    key={light.id}
                    className="flex justify-between items-center p-2 bg-gray-100 mb-1 rounded text-xs lg:text-sm"
                  >
                    <span>Light @ {light.position.map(n => n.toFixed(0)).join(', ')}</span>
                    <button
                      onClick={() => removeLight(light.id)}
                      className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-600 pt-2 lg:pt-2.5 border-t border-gray-300">
          <strong>Controls:</strong>
          <ul className="my-1 pl-5 space-y-0.5">
            <li>Click & drag to rotate view</li>
            <li>Scroll to zoom in/out</li>
            <li className="hidden sm:list-item">Upload a 360° or wide-angle photo for best results</li>
          </ul>
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: false }}
      >
        <PerspectiveCamera makeDefault fov={75} position={[0, 0, 0.1]} />
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          enableDamping={true}
          dampingFactor={0.05}
          rotateSpeed={-0.5}
          minDistance={0.1}
          maxDistance={100}
        />
        <Suspense fallback={
          <Html center>
            <div style={{ color: 'white', fontSize: 18 }}>Loading visualization...</div>
          </Html>
        }>
          <SceneController
            beforeImage={beforeImage}
            afterImage={afterImage}
            showAfter={viewMode === 'after' ? true : viewMode === 'compare' ? 'compare' : false}
            roofProducts={roofProducts}
            lightingConfig={lightingConfig}
          />
        </Suspense>
      </Canvas>

      {/* Loading Overlay */}
      {!beforeImage && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center bg-white/90 p-6 lg:p-10 rounded-lg shadow-lg">
          <h2 className="text-lg lg:text-2xl font-semibold mb-2 lg:mb-2.5">Welcome to 360° Visualization</h2>
          <p className="text-sm lg:text-base text-gray-600">Upload a house photo to begin</p>
        </div>
      )}
    </div>
  );
}
