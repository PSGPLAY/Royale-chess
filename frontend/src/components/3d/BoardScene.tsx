import type { FC } from 'react'
import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Chessboard } from './Chessboard'
import { Lighting } from './Lighting'
import { useMultiplayerStore } from '../../state/multiplayerStore'

/**
 * Fixed camera with a subtle tilt matching the reference image (~69° angle)
 * and increased height for clean board visibility and 3D piece depth.
 * No rotating, panning, or moving — completely stable like chess.com.
 * When playing online as Black, camera flips to face from Black's side.
 */
function FixedTopDownCamera() {
  const { camera, size } = useThree()
  const { isOnlineMatch, myRole } = useMultiplayerStore()
  const isFlipped = isOnlineMatch && myRole === 'b'

  useEffect(() => {
    const aspect = size.width / Math.max(size.height, 1)
    // PerspectiveCamera fov is vertical.
    // In landscape/desktop (aspect >= 1), baseline height 25.5 provides ideal 3D viewing.
    // In mobile portrait (aspect < 1), we scale camera distance so the entire 8x8 board fits horizontally with safe margins.
    const zoomMultiplier = aspect < 1 ? Math.max(1, 1.08 / aspect) : 1
    const targetY = 25.5 * zoomMultiplier
    const targetZ = (isFlipped ? -7.8 : 7.8) * zoomMultiplier

    camera.position.set(0, targetY, targetZ)
    camera.up.set(0, 1, 0)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [camera, size.width, size.height, isFlipped])

  return null
}

/**
 * Main 3D Canvas Scene for Royal Chess:
 * Elevated fixed camera with reference-accurate subtle tilt and increased height.
 */
export const BoardScene: FC = () => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Canvas
        shadows
        dpr={[1, 2]} // High-DPI support
        camera={{
          position: [0, 20.5, 7.8],
          fov: 38,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
      >
        {/* Warm ambient background */}
        <color attach="background" args={['#1c1311']} />

        {/* Ambient & Directional Lighting Rig */}
        <Lighting />

        {/* Fixed Top-Down Camera Lock */}
        <FixedTopDownCamera />

        {/* The 3D Checkered Board & Environment */}
        <Chessboard />
      </Canvas>
    </div>
  )
}
