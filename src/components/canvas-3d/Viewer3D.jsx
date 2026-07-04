import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

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

/**
 * 构建 T-slot 铝型材截面 Shape
 * 截面是 40×40 的正方形，4 条边各有 1 条 T 型凹槽
 *
 * 凹槽结构（俯视）：
 *   ┌──────────┬──────────┐
 *   │ ─slot─   │   ─slot─ │   ← T 槽（窄颈宽底）
 *   │ │        │        │ │
 *   │ │        │        │ │
 *   │ ─slot─   │   ─slot─ │
 *   └──────────┴──────────┘
 */
function buildProfileShape(widthMm, heightMm) {
  const w = widthMm * SCALE
  const h = heightMm * SCALE

  const shape = new THREE.Shape()

  // 从左上角开始顺时针绘制
  // 外部矩形
  shape.moveTo(-w / 2, h / 2)
  shape.lineTo(w / 2, h / 2)
  shape.lineTo(w / 2, -h / 2)
  shape.lineTo(-w / 2, -h / 2)
  shape.lineTo(-w / 2, h / 2)

  // 4 条 T 形凹槽（每边中央）
  // 凹槽尺寸（米）：颈宽 2mm，槽宽 6mm，槽深 4mm
  const neckW = 2 * SCALE
  const slotW = 6 * SCALE
  const slotDepth = 4 * SCALE

  const holes = []

  // 顶边凹槽（从外往里挖）
  // T 形：颈宽 2mm、底部宽 6mm、深度 4mm
  const topSlot = new THREE.Path()
  topSlot.moveTo(-neckW / 2, h / 2)
  topSlot.lineTo(neckW / 2, h / 2)
  topSlot.lineTo(neckW / 2, h / 2 - slotDepth / 2)
  topSlot.lineTo(slotW / 2, h / 2 - slotDepth)
  topSlot.lineTo(-slotW / 2, h / 2 - slotDepth)
  topSlot.lineTo(-neckW / 2, h / 2 - slotDepth / 2)
  topSlot.lineTo(-neckW / 2, h / 2)
  holes.push(topSlot)

  // 底边凹槽
  const botSlot = new THREE.Path()
  botSlot.moveTo(-neckW / 2, -h / 2)
  botSlot.lineTo(neckW / 2, -h / 2)
  botSlot.lineTo(neckW / 2, -h / 2 + slotDepth / 2)
  botSlot.lineTo(slotW / 2, -h / 2 + slotDepth)
  botSlot.lineTo(-slotW / 2, -h / 2 + slotDepth)
  botSlot.lineTo(-neckW / 2, -h / 2 + slotDepth / 2)
  botSlot.lineTo(-neckW / 2, -h / 2)
  holes.push(botSlot)

  // 左边凹槽（X 朝外，Z 方向）
  // 注：因为是 2D 截面，Z 是挤出方向。ProfileBeam 拉伸沿 Z 轴。
  // 所以截面是 X-Y 平面上的剖面图。
  // 铝型材实际是：截面为 T 槽型，沿长度方向（Z 轴）拉伸。
  // X 轴：水平；Y 轴：垂直
  const leftSlot = new THREE.Path()
  leftSlot.moveTo(-w / 2, neckW / 2)
  leftSlot.lineTo(-w / 2, -neckW / 2)
  leftSlot.lineTo(-w / 2 + slotDepth / 2, -neckW / 2)
  leftSlot.lineTo(-w / 2 + slotDepth, -slotW / 2)
  leftSlot.lineTo(-w / 2 + slotDepth, slotW / 2)
  leftSlot.lineTo(-w / 2 + slotDepth / 2, neckW / 2)
  leftSlot.lineTo(-w / 2, neckW / 2)
  holes.push(leftSlot)

  // 右边凹槽
  const rightSlot = new THREE.Path()
  rightSlot.moveTo(w / 2, neckW / 2)
  rightSlot.lineTo(w / 2, -neckW / 2)
  rightSlot.lineTo(w / 2 - slotDepth / 2, -neckW / 2)
  rightSlot.lineTo(w / 2 - slotDepth, -slotW / 2)
  rightSlot.lineTo(w / 2 - slotDepth, slotW / 2)
  rightSlot.lineTo(w / 2 - slotDepth / 2, neckW / 2)
  rightSlot.lineTo(w / 2, neckW / 2)
  holes.push(rightSlot)

  shape.holes = holes
  return shape
}

/**
 * 共享几何：根据规格缓存截面几何，避免重复创建
 */
const geometryCache = new Map()
function getProfileGeometry(widthMm, heightMm, lengthM) {
  const key = `${widthMm}-${heightMm}-${lengthM.toFixed(4)}`
  if (geometryCache.has(key)) return geometryCache.get(key)

  const shape = buildProfileShape(widthMm, heightMm)
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: lengthM,
    bevelEnabled: true,
    bevelThickness: 0.0005,
    bevelSize: 0.0005,
    bevelSegments: 1,
  })
  // Extrude 默认沿 +Z 挤出，居中
  geom.translate(0, 0, -lengthM / 2)
  geometryCache.set(key, geom)
  return geom
}

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

  const geom = useMemo(
    () => getProfileGeometry(profile.width, profile.height, Math.max(length3d, 0.001)),
    [profile.width, profile.height, length3d]
  )

  return (
    <mesh
      position={[midX, midY, 0]}
      rotation={[0, 0, -angleZ]}
      geometry={geom}
      castShadow
      receiveShadow
    >
      {/* T14: 真实铝型材材质 — 高金属度、低粗糙度，带细微颜色变化 */}
      <meshStandardMaterial
        color="#B8B8C0"
        metalness={0.92}
        roughness={0.22}
        envMapIntensity={1.0}
      />
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
      <Canvas
        camera={{ position: [0.8, 0.8, 0.8], fov: 50 }}
        shadows
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        {/* T14: 改进光照 — 半球光增加立体感，环境光柔和补光 */}
        <ambientLight intensity={0.35} />
        <hemisphereLight args={['#C8D8FF', '#2A1F1F', 0.5]} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-3, 2, -3]} intensity={0.4} />
        <directionalLight position={[0, -3, 3]} intensity={0.25} color="#FFD9B8" />

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
            {/* Default placeholder frame — 用 T-slot 截面 */}
            <DefaultFrame />
          </group>
        )}

        {/* Ground grid */}
        <gridHelper args={[2, 10, '#2A2A3E', '#1E1E2E']} />
        {/* 接收阴影的地面 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
          <planeGeometry args={[2, 2]} />
          <shadowMaterial opacity={0.4} />
        </mesh>

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

/**
 * 默认占位框（用 T-slot 截面，让用户即便无元素时也能预览真实外观）
 */
function DefaultFrame() {
  const geom = useMemo(() => getProfileGeometry(40, 40, 0.5), [])
  return (
    <group>
      {[0, 0.5].map((y) => (
        <group key={y}>
          <mesh position={[-0.25, y, 0]} geometry={geom}>
            <meshStandardMaterial color="#B8B8C0" metalness={0.92} roughness={0.22} />
          </mesh>
          <mesh position={[0.25, y, 0]} geometry={geom}>
            <meshStandardMaterial color="#B8B8C0" metalness={0.92} roughness={0.22} />
          </mesh>
          <mesh position={[0, y, -0.25]} rotation={[Math.PI / 2, 0, 0]} geometry={geom}>
            <meshStandardMaterial color="#B8B8C0" metalness={0.92} roughness={0.22} />
          </mesh>
          <mesh position={[0, y, 0.25]} rotation={[Math.PI / 2, 0, 0]} geometry={geom}>
            <meshStandardMaterial color="#B8B8C0" metalness={0.92} roughness={0.22} />
          </mesh>
        </group>
      ))}
    </group>
  )
}