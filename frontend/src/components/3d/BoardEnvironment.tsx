import type { FC } from 'react'
import * as THREE from 'three'
import { BOARD_SIZE } from '../../utils/boardCoordinates'

/**
 * Procedural stylized environment matching the pirate cove dock from the reference:
 * - Sandy island base
 * - Wooden dock boardwalk planks
 * - Wooden mooring posts
 * - Ropes connecting the posts
 * - Barrels, cannonball stacks, and a pirate cutlass
 */
export const BoardEnvironment: FC = () => {
  // Moorings layout: 10 posts around the perimeter oval
  const posts = [
    { x: -6.5, z: -4.8, rot: 0.1 },
    { x: -6.8, z: 0.0, rot: -0.05 },
    { x: -6.4, z: 4.8, rot: 0.15 },
    { x: -3.8, z: 6.6, rot: 0.2 },
    { x: 3.8, z: 6.6, rot: -0.1 },
    { x: 6.4, z: 4.8, rot: -0.15 },
    { x: 6.8, z: 0.0, rot: 0.05 },
    { x: 6.5, z: -4.8, rot: -0.2 },
    { x: 3.2, z: -6.5, rot: 0.1 },
    { x: -3.2, z: -6.5, rot: -0.1 },
  ]

  return (
    <group position={[0, -0.2, 0]}>
      {/* 1. Main Sandy Arena Base (Under the 8x8 squares) */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        {/* Foundation underneath the board */}
        <cylinderGeometry args={[BOARD_SIZE * 0.8, BOARD_SIZE * 0.86, 0.2, 48]} />
        <meshStandardMaterial
          color="#dcc9a4"
          roughness={0.95}
          metalness={0.02}
        />
      </mesh>

      {/* 2. Outer Wooden Dock Rim / Border */}
      <mesh position={[0, -0.3, 0]} receiveShadow>
        <cylinderGeometry args={[BOARD_SIZE * 0.98, BOARD_SIZE * 1.05, 0.25, 48]} />
        <meshStandardMaterial
          color="#422513"
          roughness={0.8}
          metalness={0.05}
        />
      </mesh>

      {/* 3. Wooden Dock Floor Planks (Side Walkways) */}
      <DockPlanks />

      {/* 4. Mooring Posts along the perimeter */}
      {posts.map((post, idx) => (
        <MooringPost key={`post-${idx}`} x={post.x} z={post.z} rot={post.rot} />
      ))}

      {/* 5. Nautical Ropes strung between the posts */}
      {posts.map((post, idx) => {
        const nextPost = posts[(idx + 1) % posts.length]
        return (
          <RopeSegment
            key={`rope-${idx}`}
            p1={[post.x, 0.6, post.z]}
            p2={[nextPost.x, 0.6, nextPost.z]}
          />
        )
      })}

      {/* 6. Environmental Props from Reference Image */}
      {/* Stack of cannonballs bottom-left */}
      <CannonballStack position={[-6.2, -0.05, 5.2]} />
      <CannonballStack position={[-6.6, -0.05, 5.8]} />

      {/* Wooden Barrels */}
      <WoodenBarrel position={[-6.8, -0.05, 4.2]} rotation={[0, 0.4, 0]} />
      <WoodenBarrel position={[-6.2, -0.05, 3.4]} rotation={[0, -0.2, 0]} />
      <WoodenBarrel position={[6.5, -0.05, -3.8]} rotation={[0, 0.8, 0]} />
      <WoodenBarrel position={[6.9, -0.05, -4.6]} rotation={[0, 0.3, 0]} />

      {/* Crates with Golden Oranges/Treasure */}
      <TreasureCrate position={[6.6, -0.05, 5.2]} />

      {/* Pirate Cutlass stuck into the ground (top-left, as seen in reference image) */}
      <PirateCutlass position={[-2.8, 0.0, -5.6]} rotation={[0.4, 0.6, -0.5]} />
    </group>
  )
}

/**
 * Wooden dock planks that surround the sandy arena.
 */
function DockPlanks() {
  const planks = []
  const count = 18

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    const radius = 7.4
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    const isDarker = i % 2 === 0

    planks.push(
      <mesh
        key={`plank-${i}`}
        position={[x, -0.12, z]}
        rotation={[0, -angle + Math.PI / 2, 0]}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[1.2, 0.16, 2.4]} />
        <meshStandardMaterial
          color={isDarker ? '#5e381e' : '#6f4325'}
          roughness={0.75}
          metalness={0.05}
        />
      </mesh>
    )
  }

  return <group>{planks}</group>
}

/**
 * Sturdy wooden mooring post with carved rope grooves and beveled top.
 */
function MooringPost({ x, z, rot }: { x: number; z: number; rot: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      {/* Main wooden post */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.38, 0.42, 1.1, 16]} />
        <meshStandardMaterial color="#4c2c19" roughness={0.8} />
      </mesh>
      {/* Top cap */}
      <mesh position={[0, 1.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.38, 0.15, 16]} />
        <meshStandardMaterial color="#3d2111" roughness={0.7} />
      </mesh>
      {/* Rope ring around the post */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <torusGeometry args={[0.41, 0.08, 10, 20]} />
        <meshStandardMaterial color="#cfba93" roughness={0.9} />
      </mesh>
    </group>
  )
}

/**
 * Hanging nautical rope between two mooring posts.
 */
function RopeSegment({ p1, p2 }: { p1: [number, number, number]; p2: [number, number, number] }) {
  // Create catenary / sagging curve using QuadraticBezierCurve3
  const midX = (p1[0] + p2[0]) / 2
  const midY = (p1[1] + p2[1]) / 2 - 0.28 // Rope sag
  const midZ = (p1[2] + p2[2]) / 2

  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(...p1),
    new THREE.Vector3(midX, midY, midZ),
    new THREE.Vector3(...p2)
  )

  const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.045, 8, false)

  return (
    <mesh geometry={tubeGeo} castShadow receiveShadow>
      <meshStandardMaterial color="#d4c29e" roughness={0.9} />
    </mesh>
  )
}

/**
 * Stylized wooden barrel with iron bands.
 */
function WoodenBarrel({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Barrel wood body */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.42, 1.0, 18]} />
        <meshStandardMaterial color="#6a3e21" roughness={0.7} />
      </mesh>
      {/* Top and bottom iron hoops */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.435, 0.435, 0.08, 18]} />
        <meshStandardMaterial color="#2d3238" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.435, 0.435, 0.08, 18]} />
        <meshStandardMaterial color="#2d3238" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Middle iron hoop */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.44, 0.44, 0.08, 18]} />
        <meshStandardMaterial color="#2d3238" metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  )
}

/**
 * Stack of iron cannonballs.
 */
function CannonballStack({ position }: { position: [number, number, number] }) {
  const r = 0.16
  return (
    <group position={position}>
      {/* Base 3 balls */}
      <mesh position={[-r * 0.9, r, -r * 0.5]} castShadow receiveShadow>
        <sphereGeometry args={[r, 16, 16]} />
        <meshStandardMaterial color="#1e2328" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[r * 0.9, r, -r * 0.5]} castShadow receiveShadow>
        <sphereGeometry args={[r, 16, 16]} />
        <meshStandardMaterial color="#1e2328" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, r, r * 0.9]} castShadow receiveShadow>
        <sphereGeometry args={[r, 16, 16]} />
        <meshStandardMaterial color="#1e2328" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Top ball */}
      <mesh position={[0, r * 2.3, 0]} castShadow receiveShadow>
        <sphereGeometry args={[r, 16, 16]} />
        <meshStandardMaterial color="#1e2328" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}

/**
 * Wooden crate filled with golden coins or oranges as in the reference.
 */
function TreasureCrate({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Wooden box */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.5, 0.9]} />
        <meshStandardMaterial color="#543017" roughness={0.8} />
      </mesh>
      {/* Golden contents mound */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <sphereGeometry args={[0.35, 12, 12]} />
        <meshStandardMaterial color="#e59824" metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  )
}

/**
 * Pirate cutlass stuck into the ground (directly inspired by reference top-left blade).
 */
function PirateCutlass({
  position,
  rotation,
}: {
  position: [number, number, number]
  rotation: [number, number, number]
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Steel blade */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.04, 1.4, 0.18]} />
        <meshStandardMaterial color="#dcdde1" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Golden handguard */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.05, 12]} />
        <meshStandardMaterial color="#e1b12c" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Leather grip */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.35, 8]} />
        <meshStandardMaterial color="#442813" roughness={0.9} />
      </mesh>
      {/* Pommel skull or ball */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color="#e1b12c" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}
