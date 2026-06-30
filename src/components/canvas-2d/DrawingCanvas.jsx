import { useRef, useEffect, useState, useCallback } from 'react'

// 2D绘图画布 - 支持线段绘制、网格背景、工具切换
export default function DrawingCanvas({ elements, onAddElement, onSelectElement, selectedId, currentTool, currentProfile, gridSize = 10 }) {
  const canvasRef = useRef(null)
  const [drawing, setDrawing] = useState(null)  // 当前正在绘制的临时数据
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // 吸附到网格
  const snapToGrid = useCallback((val) => {
    return Math.round(val / gridSize) * gridSize
  }, [gridSize])

  // 计算线段长度（像素→毫米，1px = 1mm简化）
  const calcLength = useCallback((x1, y1, x2, y2) => {
    return Math.round(Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2))
  }, [])

  // 绘制网格背景
  const drawGrid = useCallback((ctx, width, height) => {
    ctx.strokeStyle = '#1a2a3e'
    ctx.lineWidth = 0.5

    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // 每100px绘制粗线
    ctx.strokeStyle = '#2a3a4e'
    ctx.lineWidth = 1
    for (let x = 0; x < width; x += 100) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    for (let y = 0; y < height; y += 100) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }, [gridSize])

  // 绘制所有图元
  const drawElements = useCallback((ctx) => {
    elements.forEach(el => {
      const isSelected = el.id === selectedId
      ctx.strokeStyle = isSelected ? '#00d4ff' : '#e0e0e0'
      ctx.lineWidth = isSelected ? 3 : 2

      if (el.type === 'line') {
        ctx.beginPath()
        ctx.moveTo(el.x1, el.y1)
        ctx.lineTo(el.x2, el.y2)
        ctx.stroke()

        // 端点标记
        ctx.fillStyle = isSelected ? '#00d4ff' : '#888'
        ctx.beginPath()
        ctx.arc(el.x1, el.y1, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(el.x2, el.y2, 4, 0, Math.PI * 2)
        ctx.fill()

        // 长度标注
        const midX = (el.x1 + el.x2) / 2
        const midY = (el.y1 + el.y2) / 2
        ctx.fillStyle = '#00d4ff'
        ctx.font = '12px sans-serif'
        ctx.fillText(`${el.length}mm`, midX + 8, midY - 8)
      } else if (el.type === 'rect') {
        ctx.beginPath()
        ctx.rect(el.x, el.y, el.w, el.h)
        ctx.stroke()
      }
    })
  }, [elements, selectedId])

  // 绘制正在绘制中的临时图元
  const drawDrawing = useCallback((ctx) => {
    if (!drawing) return
    ctx.strokeStyle = '#00d4ff'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])

    if (drawing.type === 'line') {
      ctx.beginPath()
      ctx.moveTo(drawing.x1, drawing.y1)
      ctx.lineTo(drawing.x2, drawing.y2)
      ctx.stroke()
    }

    ctx.setLineDash([])
  }, [drawing])

  // 完整重绘
  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    drawGrid(ctx, canvas.width, canvas.height)
    drawElements(ctx)
    drawDrawing(ctx)
  }, [drawGrid, drawElements, drawDrawing])

  useEffect(() => {
    redraw()
  }, [redraw])

  // Canvas尺寸自适应
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    canvas.width = parent.clientWidth
    canvas.height = parent.clientHeight
    redraw()
  }, [redraw])

  // 鼠标事件处理
  const handleClick = useCallback((e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const rawX = e.clientX - rect.left
    const rawY = e.clientY - rect.top
    const x = snapToGrid(rawX)
    const y = snapToGrid(rawY)

    if (currentTool === 'line') {
      if (!drawing) {
        // 第一次点击：设置起点
        setDrawing({ type: 'line', x1: x, y1: y, x2: x, y2: y })
      } else {
        // 第二次点击：完成线段
        const length = calcLength(drawing.x1, drawing.y1, x, y)
        if (length > 0) {
          onAddElement({
            id: 'el-' + Date.now(),
            type: 'line',
            x1: drawing.x1,
            y1: drawing.y1,
            x2: x,
            y2: y,
            length,
            profileSpec: currentProfile,
          })
        }
        setDrawing(null)
      }
    } else if (currentTool === 'select') {
      // 选择模式：查找最近的图元
      let found = null
      let minDist = 10
      elements.forEach(el => {
        if (el.type === 'line') {
          const midX = (el.x1 + el.x2) / 2
          const midY = (el.y1 + el.y2) / 2
          const dist = Math.sqrt((rawX - midX) ** 2 + (rawY - midY) ** 2)
          if (dist < minDist) {
            minDist = dist
            found = el.id
          }
        }
      })
      onSelectElement(found)
    } else if (currentTool === 'delete') {
      // 删除模式：点击删除最近图元
      let found = null
      let minDist = 15
      elements.forEach(el => {
        if (el.type === 'line') {
          const midX = (el.x1 + el.x2) / 2
          const midY = (el.y1 + el.y2) / 2
          const dist = Math.sqrt((rawX - midX) ** 2 + (rawY - midY) ** 2)
          if (dist < minDist) {
            minDist = dist
            found = el.id
          }
        }
      })
      if (found) {
        onAddElement(null, found)  // null表示删除
      }
    }
  }, [currentTool, drawing, currentProfile, elements, snapToGrid, calcLength, onAddElement, onSelectElement])

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = snapToGrid(e.clientX - rect.left)
    const y = snapToGrid(e.clientY - rect.top)
    setMousePos({ x, y })

    if (drawing && currentTool === 'line') {
      setDrawing(prev => ({ ...prev, x2: x, y2: y }))
    }
  }, [drawing, currentTool, snapToGrid])

  // 右键或Escape取消绘制
  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    setDrawing(null)
  }, [])

  return (
    <div className="relative w-full h-full bg-bg overflow-hidden">
      <canvas
        ref={canvasRef}
        className="cursor-crosshair"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onContextMenu={handleContextMenu}
      />
      {/* 坐标提示 */}
      <div className="absolute bottom-2 left-2 text-xs text-text-secondary bg-card px-2 py-1 rounded">
        X: {mousePos.x} Y: {mousePos.y}
      </div>
      {/* 绘制提示 */}
      {drawing && currentTool === 'line' && (
        <div className="absolute top-2 left-2 text-xs text-accent bg-card px-2 py-1 rounded">
          点击终点完成线段 · 右键取消
        </div>
      )}
    </div>
  )
}
