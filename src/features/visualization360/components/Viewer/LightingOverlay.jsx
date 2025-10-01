import React from 'react';
import * as THREE from 'three';

/**
 * Lighting Overlay Component
 * Renders Rime lighting fixtures and effects
 */
export default function LightingOverlay({ lights = [] }) {
  return (
    <group>
      {lights.map((light) => (
        <group key={light.id} position={light.position || [0, 5, -20]}>
          {/* Point Light */}
          <pointLight
            color={light.color || '#ffffff'}
            intensity={light.intensity || 2}
            distance={light.range || 15}
            decay={2}
          />

          {/* Visible Light Fixture */}
          <mesh>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial color={light.color || '#ffffff'} />
          </mesh>

          {/* Light Beam Effect */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry
              args={[
                light.beamWidth || 2,
                light.beamLength || 10,
                32,
                1,
                true,
              ]}
            />
            <meshBasicMaterial
              color={light.color || '#ffffff'}
              transparent
              opacity={0.15}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
