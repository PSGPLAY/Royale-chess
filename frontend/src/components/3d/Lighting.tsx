import type { FC } from 'react'
import { useRef } from 'react'
import * as THREE from 'three'

/**
 * Lighting rig tuned to match the warm, vibrant pirate cove in the reference image:
 * High quality directional sunlight casting soft shadows, warm ambient fill,
 * and hemisphere sky-ground illumination.
 */
export const Lighting: FC = () => {
  const dirLightRef = useRef<THREE.DirectionalLight>(null)

  return (
    <>
      {/* 1. Global warm ambient light */}
      <ambientLight color="#fffaed" intensity={0.7} />

      {/* 2. Hemisphere light: warm sky blue above, warm earth brown below */}
      <hemisphereLight
        color="#87ceeb"
        groundColor="#5c3c21"
        intensity={0.65}
      />

      {/* 3. Main Sun Key Light casting crisp, soft shadows onto the board */}
      <directionalLight
        ref={dirLightRef}
        position={[8, 16, 10]}
        intensity={1.9}
        color="#fff8eb"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={45}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0003}
      />

      {/* 4. Subtle cool rim/fill light from the opposite side */}
      <directionalLight
        position={[-8, 10, -10]}
        intensity={0.4}
        color="#a0c4ff"
      />
    </>
  )
}
