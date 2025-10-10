import React, { Suspense, useEffect, useState, useRef } from 'react';
import { Canvas, useThree, useFrame, useLoader } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  ContactShadows,
  useGLTF,
  useTexture,
  Html,
  Sky,
  Stars
} from '@react-three/drei';
import * as THREE from 'three';
import { useVisualizationStore } from '../../store/visualizationStore';
import { AlertTriangle, Loader2 } from 'lucide-react';

/**
 * House3DModel Component
 * Advanced 3D/4D realistic house model viewer
 * Renders photogrammetry-generated models with realistic materials
 */

/**
 * Realistic House Model Component
 * Loads and renders the 3D model with PBR materials
 */
function RealisticHouseModel({ modelUrl, modelType = 'glb' }) {
  const modelRef = useRef();
  const [error, setError] = useState(null);

  // Load the model based on format
  let model = null;
  try {
    if (modelType === 'glb' || modelType === 'gltf') {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      model = useGLTF(modelUrl);
    }
  } catch (err) {
    console.error('Model loading error:', err);
    setError(err.message);
  }

  // Rotate model slightly for better presentation
  useFrame(() => {
    if (modelRef.current) {
      // Optional: Add subtle animation
      // modelRef.current.rotation.y += 0.001;
    }
  });

  useEffect(() => {
    if (model?.scene) {
      // Center the model
      const box = new THREE.Box3().setFromObject(model.scene);
      const center = box.getCenter(new THREE.Vector3());
      model.scene.position.sub(center);

      // Scale the model appropriately
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 20 / maxDim; // Normalize to reasonable size
      model.scene.scale.setScalar(scale);

      // Apply realistic materials
      model.scene.traverse((child) => {
        if (child.isMesh) {
          // Enable shadows
          child.castShadow = true;
          child.receiveShadow = true;

          // Enhance materials
          if (child.material) {
            child.material.envMapIntensity = 1.5;
            child.material.roughness = 0.8;
            child.material.metalness = 0.1;
          }
        }
      });
    }
  }, [model]);

  if (error) {
    return (
      <Html center>
        <div className="bg-red-50 p-4 rounded-lg max-w-md text-center">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      </Html>
    );
  }

  if (!model) {
    return (
      <Html center>
        <div className="bg-white p-4 rounded-lg">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 mt-2">Loading 3D Model...</p>
        </div>
      </Html>
    );
  }

  return <primitive ref={modelRef} object={model.scene} />;
}

/**
 * Point Cloud Renderer
 * For displaying preview point clouds
 */
function PointCloudRenderer({ points }) {
  const pointsRef = useRef();

  useEffect(() => {
    if (!pointsRef.current || !points) return;

    const positions = new Float32Array(points.length * 3);
    const colors = new Float32Array(points.length * 3);

    points.forEach((point, i) => {
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;

      // Color based on height (y-axis)
      const color = new THREE.Color();
      const hue = (point.y + 50) / 100; // Normalize to 0-1
      color.setHSL(hue, 0.8, 0.5);

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    });

    pointsRef.current.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    pointsRef.current.geometry.setAttribute(
      'color',
      new THREE.BufferAttribute(colors, 3)
    );
  }, [points]);

  return (
    <points ref={pointsRef}>
      <bufferGeometry />
      <pointsMaterial
        size={0.5}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation={true}
      />
    </points>
  );
}

/**
 * Procedural House Model
 * Generates a basic house structure when no model is available
 */
function ProceduralHouseModel() {
  return (
    <group>
      {/* Main house body */}
      <mesh castShadow receiveShadow position={[0, 2, 0]}>
        <boxGeometry args={[10, 4, 8]} />
        <meshStandardMaterial
          color="#E8E4D9"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Roof */}
      <mesh castShadow receiveShadow position={[0, 5, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[7, 3, 4]} />
        <meshStandardMaterial
          color="#8B4513"
          roughness={0.95}
          metalness={0}
        />
      </mesh>

      {/* Door */}
      <mesh castShadow position={[0, 1, 4.01]}>
        <boxGeometry args={[1.5, 2.5, 0.1]} />
        <meshStandardMaterial color="#654321" roughness={0.7} />
      </mesh>

      {/* Windows */}
      <mesh castShadow position={[-3, 2.5, 4.01]}>
        <boxGeometry args={[1.5, 1.5, 0.1]} />
        <meshStandardMaterial
          color="#87CEEB"
          roughness={0.1}
          metalness={0.5}
          transparent
          opacity={0.6}
        />
      </mesh>
      <mesh castShadow position={[3, 2.5, 4.01]}>
        <boxGeometry args={[1.5, 1.5, 0.1]} />
        <meshStandardMaterial
          color="#87CEEB"
          roughness={0.1}
          metalness={0.5}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Ground plane */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#90EE90" roughness={0.8} />
      </mesh>
    </group>
  );
}

/**
 * Scene Controller for 3D Model
 */
function Scene3DController({ modelData, viewMode }) {
  const { camera } = useThree();

  useEffect(() => {
    // Position camera for best view
    camera.position.set(15, 10, 15);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <>
      {/* Lighting Setup - Realistic outdoor lighting */}
      <ambientLight intensity={0.4} />

      {/* Sun light */}
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      {/* Fill light */}
      <directionalLight position={[-10, 5, -10]} intensity={0.3} />

      {/* Render the model */}
      {modelData ? (
        modelData.type === 'pointCloud' ? (
          <PointCloudRenderer points={modelData.points} />
        ) : modelData.type === 'glb' ? (
          <RealisticHouseModel modelUrl={modelData.url} modelType="glb" />
        ) : (
          <ProceduralHouseModel />
        )
      ) : (
        <ProceduralHouseModel />
      )}

      {/* Ground contact shadows */}
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.5}
        scale={30}
        blur={2}
        far={10}
      />
    </>
  );
}

/**
 * Main House 3D Model Component
 */
export default function House3DModel({ modelData, className = '', showEnvironment = true }) {
  const { ui } = useVisualizationStore();
  const [webglError, setWebglError] = useState(false);
  const canvasRef = useRef(null);

  // Handle WebGL context lost/restored
  useEffect(() => {
    const handleContextLost = (event) => {
      event.preventDefault();
      console.warn('WebGL context lost. Attempting to restore...');
      setWebglError(true);
    };

    const handleContextRestored = () => {
      console.log('WebGL context restored');
      setWebglError(false);
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('webglcontextlost', handleContextLost, false);
      canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

      return () => {
        canvas.removeEventListener('webglcontextlost', handleContextLost);
        canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      };
    }
  }, []);

  if (webglError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">3D Rendering Paused</h3>
          <p className="text-sm text-yellow-800 mb-4">
            The 3D renderer encountered an issue. This may happen if your device has limited graphics resources.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`house-3d-model w-full h-full relative ${className}`} ref={canvasRef}>
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          // Suppress THREE.js context lost warnings in console
          gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault());
        }}
      >
        <PerspectiveCamera makeDefault fov={50} position={[15, 10, 15]} />

        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableDamping={true}
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2}
        />

        {/* HDR Environment for realistic reflections */}
        {showEnvironment && (
          <Environment preset="sunset" background={false} />
        )}

        {/* Sky and Stars */}
        {showEnvironment && (
          <>
            <Sky
              distance={450000}
              sunPosition={[10, 20, 10]}
              inclination={0.6}
              azimuth={0.25}
            />
            <Stars
              radius={100}
              depth={50}
              count={5000}
              factor={4}
              saturation={0}
              fade
              speed={1}
            />
          </>
        )}

        <Suspense
          fallback={
            <Html center>
              <div className="text-white text-lg font-medium bg-gray-900 bg-opacity-75 px-4 py-2 rounded">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading 3D model...
              </div>
            </Html>
          }
        >
          <Scene3DController modelData={modelData} viewMode={ui.activePanel} />
        </Suspense>
      </Canvas>

      {/* Controls Overlay */}
      {modelData && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white px-4 py-2 rounded-lg text-sm pointer-events-none">
          Click & drag to rotate • Right-click to pan • Scroll to zoom
        </div>
      )}

      {/* Model Info */}
      {modelData && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 text-sm">
          <h4 className="font-semibold text-gray-800 mb-1">3D Model Info</h4>
          <div className="text-gray-600 space-y-0.5">
            <div>Type: {modelData.type || 'Generated'}</div>
            {modelData.points && <div>Points: {modelData.points.length}</div>}
            {modelData.vertices && <div>Vertices: {modelData.vertices.length}</div>}
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {ui.isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="text-gray-800 font-medium">Processing 3D Model...</span>
            {ui.uploadProgress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${ui.uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
