import React from 'react';
import * as THREE from 'three';
import { createShingleMaterial } from '../../utils/MaterialManager';

/**
 * Product Overlay Component
 * Renders product overlays (shingles, vents, etc.) on the 360° view
 */
export default function ProductOverlay({ type, data }) {
  if (type === 'shingle') {
    const material = createShingleMaterial(data.color, data.opacity);

    return (
      <mesh
        position={data.position || [0, 20, -50]}
        scale={data.scale || [10, 10, 1]}
        rotation={data.rotation || [0, 0, 0]}
      >
        <planeGeometry args={[1, 1]} />
        <primitive object={material} attach="material" />
      </mesh>
    );
  }

  if (type === 'roof-product') {
    return (
      <mesh
        position={data.position || [0, 15, -40]}
        scale={data.scale || [5, 5, 1]}
        rotation={data.rotation || [0, 0, 0]}
      >
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          color={new THREE.Color(0x888888)}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
    );
  }

  return null;
}
