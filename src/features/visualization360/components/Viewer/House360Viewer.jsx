import React, { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sphere, useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useVisualizationStore } from '../../store/visualizationStore';
import ProductOverlay from './ProductOverlay';
import LightingOverlay from './LightingOverlay';

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

  return (
    <div className={`house-360-viewer w-full h-full relative ${className}`}>
      <Canvas
        gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
        dpr={[1, 2]}
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
