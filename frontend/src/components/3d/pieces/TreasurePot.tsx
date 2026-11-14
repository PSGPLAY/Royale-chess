import type { FC } from 'react'

interface TreasurePotProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
}

/**
 * 3D Treasure Pot / Gold Coin Cauldron
 * Directly inspired by the gold pots at E1, C7, F4 in the reference image.
 */
export const TreasurePot: FC<TreasurePotProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}) => {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* 1. Pot Base Disc */}
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.28, 0.12, 18]} />
        <meshStandardMaterial color="#22262c" roughness={0.7} metalness={0.4} />
      </mesh>

      {/* 2. Bulging Belly of Cauldron */}
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.42, 18, 18]} />
        <meshStandardMaterial color="#2b3038" roughness={0.6} metalness={0.5} />
      </mesh>

      {/* 3. Upper Rim of Pot */}
      <mesh position={[0, 0.44, 0]} castShadow>
        <torusGeometry args={[0.38, 0.05, 12, 20]} />
        <meshStandardMaterial color="#1a1d22" roughness={0.5} metalness={0.6} />
      </mesh>

      {/* 4. Side Iron Loop Handles */}
      <mesh position={[-0.44, 0.32, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <torusGeometry args={[0.09, 0.025, 8, 16]} />
        <meshStandardMaterial color="#1a1d22" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.44, 0.32, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <torusGeometry args={[0.09, 0.025, 8, 16]} />
        <meshStandardMaterial color="#1a1d22" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* 5. Glowing Golden Coins Mound Inside */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <sphereGeometry args={[0.34, 16, 12]} />
        <meshStandardMaterial
          color="#f59e0b"
          metalness={0.85}
          roughness={0.25}
          emissive="#d97706"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* A few individual shining gold coins on top */}
      {[-0.1, 0.08, -0.04].map((cx, i) => (
        <mesh
          key={`coin-${i}`}
          position={[cx, 0.52, (i - 1) * 0.08]}
          rotation={[0.3 * (i - 1), 0.5 * i, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.06, 0.06, 0.02, 10]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  )
}

