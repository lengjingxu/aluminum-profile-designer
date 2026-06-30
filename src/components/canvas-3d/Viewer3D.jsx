import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'

// 单根铝型材3D模型 - 沿Z轴拉伸
function ProfileBeam({ element, profileSpec, offset = [0, 0, 0] }) {
  const profile = profileSpec || { width: 40, height: 40 }

  // 从2D线段计算3D位置和方向
  const startX = (element.x1 || 0) - 500  // 屏幕坐标偏移到3D中心
  const startY = 0
  const endX = (element.x2 || 0) - 500
  const endY = 0

  // 计算长度和方向
  const dx = endX - startX
  const length = element.length || Math.abs(dx) || 100

  // 计算中点和旋转
  const midX = (startX + endX) / 2
  const rotationY = dx !== 0 ? 0 : Math.PI / 2

  // 银色金属材质
  return (
    <mesh position={[midX, startY, offset[2] || 0]} rotation={[0, rotationY, 0]}>
      <boxGeometry args={[profile.width / 1000, profile.height / 1000, length / 1000]} />
      <meshStandardMaterial
        color="#c0c0c0"
        metalness={0.8}
        roughness={0.3}
      />
    </mesh>
  )
}

// 3D视图 - 从2D线段数据生成3D模型
export default function Viewer3D({ elements, profileSpecs }) {
  const beams = useMemo(() => {
    return elements.map((el, idx) => {
      const spec = profileSpecs?.[el.profileSpec] || { width: 40, height: 40 }
      return { element: el, spec, idx }
    })
  }, [elements, profileSpecs])

  // 如果没有图元，显示示例框架
  const hasElements = elements && elements.length > 0

  return (
    <div className="w-full h-full bg-bg">
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
          // 默认示例：简单方框
          <group>
            {/* 底框 */}
            <mesh position={[-0.3, 0, 0]}>
              <boxGeometry args={[0.04, 0.04, 0.6]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0.3, 0, 0]}>
              <boxGeometry args={[0.04, 0.04, 0.6]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* 横梁 */}
            <mesh position={[0, 0, -0.3]}>
              <boxGeometry args={[0.6, 0.04, 0.04]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.3]}>
              <boxGeometry args={[0.6, 0.04, 0.04]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* 立柱 */}
            <mesh position={[-0.3, 0.3, 0]}>
              <boxGeometry args={[0.04, 0.6, 0.04]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0.3, 0.3, 0]}>
              <boxGeometry args={[0.04, 0.6, 0.04]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* 顶框 */}
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

        {/* 地面参考 */}
        <gridHelper args={[2, 10, '#2a3a4e', '#1a2a3e']} />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={false}
        />
      </Canvas>
    </div>
  )
}
