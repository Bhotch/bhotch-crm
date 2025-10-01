import React, { Suspense, useEffect, useState, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sphere, useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useVisualizationStore } from '../../store/visualizationStore';
import ProductOverlay from './ProductOverlay';
import LightingOverlay from './LightingOverlay';
import { AlertTriangle } from 'lucide-react';

/**
 * Panorama Sphere Component
 * Renders the 360° house image as an inverted sphere
 */
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

/**
 * Scene Controller
 * Manages 3D scene elements based on view mode
 */
function SceneController() {
  const { camera } = useThree();
  const { images, viewMode, shingles, lighting, roofProducts } = useVisualizationStore();

  useEffect(() => {
    camera.position.set(0, 0, 0.1);
  }, [camera]);

  const showBefore = viewMode === 'before' || viewMode === 'compare';
  const showAfter = viewMode === 'after' || viewMode === 'compare';
  const beforeOpacity = viewMode === 'compare' ? 0.5 : 1;
  const afterOpacity = viewMode === 'compare' ? 0.5 : 1;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />

      {/* Before Image */}
      {showBefore && images.before && (
        <PanoramaSphere imageUrl={images.before} opacity={beforeOpacity} />
      )}

      {/* After Image with Products */}
      {showAfter && images.before && (
        <>
          <PanoramaSphere imageUrl={images.after || images.before} opacity={afterOpacity} />

          {/* Shingle Overlays */}
          {shingles.appliedRegions.map((region) => (
            <ProductOverlay
              key={region.id}
              type="shingle"
              data={region}
            />
          ))}

          {/* Roof Products */}
          {roofProducts.map((product) => (
            <ProductOverlay
              key={product.id}
              type="roof-product"
              data={product}
            />
          ))}

          {/* Lighting System */}
          {lighting.enabled && <LightingOverlay lights={lighting.lights} />}
        </>
      )}
    </>
  );
}

/**
 * Main House 360 Viewer Component
 */
export default function House360Viewer({ className = '' }) {
  const { images } = useVisualizationStore();
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
    <div className={`house-360-viewer w-full h-full relative ${className}`} ref={canvasRef}>
      <Canvas
        gl={{
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false
        }}
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          // Suppress THREE.js context lost warnings in console
          gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault());
        }}
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
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
        />
        <Suspense
          fallback={
            <Html center>
              <div className="text-white text-lg font-medium bg-gray-900 bg-opacity-75 px-4 py-2 rounded">
                Loading visualization...
              </div>
            </Html>
          }
        >
          {images.before ? (
            <SceneController />
          ) : (
            <Html center>
              <div className="text-center bg-white bg-opacity-90 p-6 rounded-lg shadow-lg max-w-sm">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Upload a Photo to Begin
                </h3>
                <p className="text-sm text-gray-600">
                  Upload a 360° panorama or standard house photo to start visualizing products
                </p>
              </div>
            </Html>
          )}
        </Suspense>
      </Canvas>

      {/* Instructions Overlay */}
      {images.before && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white px-4 py-2 rounded-lg text-sm pointer-events-none">
          Click & drag to rotate • Scroll to zoom
        </div>
      )}
    </div>
  );
}
