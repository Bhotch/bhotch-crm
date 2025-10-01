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
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 8,
        padding: 20,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        maxWidth: 350,
        maxHeight: 'calc(100vh - 200px)',
        overflowY: 'auto'
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: 18, fontWeight: 600 }}>360° House Visualization</h3>

        {/* Image Upload Section */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Images</h4>
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
            style={{
              width: '100%',
              padding: '8px 12px',
              marginBottom: 8,
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: uploadingImage ? 'not-allowed' : 'pointer',
              fontSize: 13
            }}
          >
            {uploadingImage ? 'Uploading...' : beforeImage ? 'Change Image' : 'Upload House Photo'}
          </button>
          {beforeImage && (
            <div style={{ fontSize: 12, color: '#666', marginTop: 5 }}>
              ✓ Image loaded
            </div>
          )}
        </div>

        {/* View Mode Selector */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>View Mode</h4>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setViewMode('before')}
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: viewMode === 'before' ? '#2196F3' : '#f0f0f0',
                color: viewMode === 'before' ? 'white' : '#333',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              Before
            </button>
            <button
              onClick={() => setViewMode('after')}
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: viewMode === 'after' ? '#2196F3' : '#f0f0f0',
                color: viewMode === 'after' ? 'white' : '#333',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              After
            </button>
            <button
              onClick={() => setViewMode('compare')}
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: viewMode === 'compare' ? '#2196F3' : '#f0f0f0',
                color: viewMode === 'compare' ? 'white' : '#333',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              Compare
            </button>
          </div>
        </div>

        {/* Roof Products Section */}
        {viewMode !== 'before' && (
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Roof Products</h4>
            <select
              value={selectedRoofStyle}
              onChange={(e) => setSelectedRoofStyle(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: 8,
                border: '1px solid #ddd',
                borderRadius: 4,
                fontSize: 13
              }}
            >
              <option value="ridge-vent">Ridge Vent</option>
              <option value="intake-vent">Intake Vent</option>
              <option value="turbine">Turbine Vent</option>
              <option value="solar-panel">Solar Panel</option>
            </select>
            <button
              onClick={addRoofProduct}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 13
              }}
            >
              Add Roof Product
            </button>
            {roofProducts.length > 0 && (
              <div style={{ marginTop: 10 }}>
                {roofProducts.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 8px',
                      backgroundColor: '#f9f9f9',
                      marginBottom: 4,
                      borderRadius: 4,
                      fontSize: 12
                    }}
                  >
                    <span>{product.style.replace('-', ' ').toUpperCase()}</span>
                    <button
                      onClick={() => removeProduct(product.id)}
                      style={{
                        padding: '2px 8px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: 3,
                        cursor: 'pointer',
                        fontSize: 11
                      }}
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
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Outdoor Lighting (Jellyfish)</h4>
            <button
              onClick={generateDefaultLighting}
              style={{
                width: '100%',
                padding: '8px 12px',
                marginBottom: 8,
                backgroundColor: '#9C27B0',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 13
              }}
            >
              Generate Lighting Design
            </button>
            <button
              onClick={() => addLightingFixture()}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#673AB7',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 13
              }}
            >
              Add Single Light
            </button>
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={lightingConfig.enabled}
                  onChange={(e) => setLightingConfig({ ...lightingConfig, enabled: e.target.checked })}
                  style={{ marginRight: 8 }}
                />
                Show Lighting
              </label>
            </div>
            {lightingConfig.lights.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>
                  {lightingConfig.lights.length} light fixture(s)
                </div>
                {lightingConfig.lights.map((light) => (
                  <div
                    key={light.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 8px',
                      backgroundColor: '#f9f9f9',
                      marginBottom: 4,
                      borderRadius: 4,
                      fontSize: 12
                    }}
                  >
                    <span>Light @ {light.position.map(n => n.toFixed(0)).join(', ')}</span>
                    <button
                      onClick={() => removeLight(light.id)}
                      style={{
                        padding: '2px 8px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: 3,
                        cursor: 'pointer',
                        fontSize: 11
                      }}
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
        <div style={{ fontSize: 12, color: '#666', paddingTop: 10, borderTop: '1px solid #e0e0e0' }}>
          <strong>Controls:</strong>
          <ul style={{ margin: '5px 0', paddingLeft: 20 }}>
            <li>Click & drag to rotate view</li>
            <li>Scroll to zoom in/out</li>
            <li>Upload a 360° or wide-angle photo for best results</li>
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
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '30px 40px',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: 24, fontWeight: 600 }}>Welcome to 360° Visualization</h2>
          <p style={{ margin: 0, color: '#666', fontSize: 14 }}>Upload a house photo to begin</p>
        </div>
      )}
    </div>
  );
}
