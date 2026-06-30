import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'

function ProfileBeam({ element, profileSpec, offset = [0, 0, 0] }) {
  const profile = profileSpec || { width: 40, height: 40 }

  const startX = (element.x1 || 0) - 500
  const endX = (element.x2 || 0) - 500
  const dx = endX - startX
  const length = element.length || Math.abs(dx) || 100
  const midX = (startX + endX) / 2
  const rotationY = dx !== 0 ? 0 : Math.PI / 2

  return (
    <mesh position={[midX, 0, offset[2] || 0]} rotation={[0, rotationY, 0]}>
      <boxGeometry args={[profile.width / 1000, profile.height / 1000, length / 1000]} />
      <meshStandardMaterial
        color="#c0c0c0"
        metalness={0.8}
        roughness={0.3}
      />
    </mesh>
  )
}

export default function Viewer3D({ elements, profileSpecs }) {
  const beams = useMemo(() => {
    return elements.map((el, idx) => {
      const spec = profileSpecs?.[el.profileSpec] || { width: 40, height: 40 }
      return { element: el, spec, idx }
    })
  }, [elements, profileSpecs])

  const hasElements = elements && elements.length > 0

  return (
    <div style={{ width: '100%', height: '100%', background: '#0A0A0F' }}>
      <Canvas camera={{ position: [3, 3, 3], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-3, -3, -3]} intensity={0.3} />

        {hasElements ? (
          beams.map(({ element, spec, idx }) => (
            <ProfileBeam
              key={element.id || idx}
              element={element}
              profileSpec={spec}
              offset={[0, 0, idx * 0.05]}
            />
          ))
        ) : (
          <group>
            {/* Bottom frame */}
            <mesh position={[-0.3, 0, 0]}>
              <boxGeometry args={[0.04, 0.04, 0.6]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0.3, 0, 0]}>
              <boxGeometry args={[0.04, 0.04, 0.6]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Cross beams */}
            <mesh position={[0, 0, -0.3]}>
              <boxGeometry args={[0.6, 0.04, 0.04]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.3]}>
              <boxGeometry args={[0.6, 0.04, 0.04]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Columns */}
            <mesh position={[-0.3, 0.3, 0]}>
              <boxGeometry args={[0.04, 0.6, 0.04]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0.3, 0.3, 0]}>
              <boxGeometry args={[0.04, 0.6, 0.04]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Top frame */}
            <mesh position={[-0.3, 0.6, 0]}>
              <boxGeometry args={[0.04, 0.04, 0.6]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0.3, 0.6, 0]}>
              <boxGeometry args={[0.04, 0.04, 0.6]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.6, -0.3]}>
              <boxGeometry args={[0.6, 0.04, 0.04]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.6, 0.3]}>
              <boxGeometry args={[0.6, 0.04, 0.04]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>
        )}

        {/* Ground grid with new design colors */}
        <gridHelper args={[2, 10, '#2A2A3E', '#1E1E2E']} />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={false}
          touches={{
            ONE: 0, // rotate with one finger
            TWO: 2, // zoom/pan with two fingers
          }}
        />
      </Canvas>
    </div>
  )
}
