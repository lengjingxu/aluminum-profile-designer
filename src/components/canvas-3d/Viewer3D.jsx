import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

// 坐标转换：画布像素 → 3D 米制
// canvas: 原点左上角, Y 向下
// 3D: 原点中心, Y 向上
const SCALE = 0.001  // 1px = 1mm
const CANVAS_CENTER_X = 500
const CANVAS_CENTER_Y = 400

const to3D = (x, y) => ({
  x: (x - CANVAS_CENTER_X) * SCALE,
  y: -(y - CANVAS_CENTER_Y) * SCALE, // Y轴反转
  z: 0
})

function ProfileBeam({ element, profileSpec }) {
  const profile = profileSpec || { width: 40, height: 40 }

  const p1 = to3D(element.x1, element.y1)
  const p2 = to3D(element.x2, element.y2)

  const length3d = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
  const midX = (p1.x + p2.x) / 2
  const midY = (p1.y + p2.y) / 2

  // 计算3D中线段在XY平面的角度
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const angleZ = Math.atan2(dy, dx) // Z轴旋转角度

  const w = profile.width * SCALE
  const h = profile.height * SCALE

  return (
    <mesh position={[midX, midY, 0]} rotation={[0, 0, -angleZ]}>
      <boxGeometry args={[w, h, Math.max(length3d, 0.001)]} />
      <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.3} />
    </mesh>
  )
}

function RectBeams({ element, profileSpecs }) {
  const spec = profileSpecs?.[element.profileSpec] || { width: 40, height: 40 }
  const x1 = Math.min(element.x1, element.x2)
  const y1 = Math.min(element.y1, element.y2)
  const x2 = Math.max(element.x1, element.x2)
  const y2 = Math.max(element.y1, element.y2)

  // 4 sides of the rectangle
  const sides = [
    { type: 'line', x1: x1, y1: y1, x2: x2, y2: y1, profileSpec: element.profileSpec },
    { type: 'line', x1: x2, y1: y1, x2: x2, y2: y2, profileSpec: element.profileSpec },
    { type: 'line', x1: x2, y1: y2, x2: x1, y2: y2, profileSpec: element.profileSpec },
    { type: 'line', x1: x1, y1: y2, x2: x1, y2: y1, profileSpec: element.profileSpec },
  ]

  return sides.map((side, i) => (
    <ProfileBeam key={`rect-${element.id || 'r'}-${i}`} element={side} profileSpec={spec} />
  ))
}

export default function Viewer3D({ elements, profileSpecs }) {
  const beams = useMemo(() => {
    const result = []
    elements.forEach((el) => {
      const spec = profileSpecs?.[el.profileSpec] || { width: 40, height: 40 }
      if (el.type === 'rect') {
        result.push({ element: el, spec, type: 'rect' })
      } else {
        result.push({ element: el, spec, type: 'line' })
      }
    })
    return result
  }, [elements, profileSpecs])

  const hasElements = elements && elements.length > 0

  return (
    <div style={{ width: '100%', height: '100%', background: '#0A0A0F' }}>
      <Canvas camera={{ position: [0.8, 0.8, 0.8], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-3, -3, -3]} intensity={0.3} />

        {hasElements ? (
          beams.map(({ element, spec, type }) => {
            if (type === 'rect') {
              return (
                <RectBeams
                  key={element.id || 'rect-' + element.x1}
                  element={element}
                  profileSpecs={profileSpecs}
                />
              )
            }
            return (
              <ProfileBeam
                key={element.id || 'line-' + element.x1}
                element={element}
                profileSpec={spec}
              />
            )
          })
        ) : (
          <group>
            {/* Default placeholder frame */}
            <mesh position={[-0.25, 0, 0]}>
              <boxGeometry args={[0.04, 0.04, 0.5]} />
              <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0.25, 0, 0]}>
              <boxGeometry args={[0.04, 0.04, 0.5]} />
              <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, -0.25]}>
              <boxGeometry args={[0.5, 0.04, 0.04]} />
              <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.25]}>
              <boxGeometry args={[0.5, 0.04, 0.04]} />
              <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[-0.25, 0.5, 0]}>
              <boxGeometry args={[0.04, 0.04, 0.5]} />
              <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0.25, 0.5, 0]}>
              <boxGeometry args={[0.04, 0.04, 0.5]} />
              <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.5, -0.25]}>
              <boxGeometry args={[0.5, 0.04, 0.04]} />
              <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.5, 0.25]}>
              <boxGeometry args={[0.5, 0.04, 0.04]} />
              <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>
        )}

        {/* Ground grid */}
        <gridHelper args={[2, 10, '#2A2A3E', '#1E1E2E']} />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={false}
          touches={{
            ONE: 0,
            TWO: 2,
          }}
        />
      </Canvas>
    </div>
  )
}
