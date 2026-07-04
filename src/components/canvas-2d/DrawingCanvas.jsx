import { useRef, useEffect, useState, useCallback } from 'react'
import { getProfile } from '../../lib/aluminum-profiles'

// Distance from point (px, py) to segment (x1,y1)-(x2,y2)
const distToSegment = (px, py, x1, y1, x2, y2) => {
  const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1
  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1
  if (lenSq !== 0) param = dot / lenSq
  let xx, yy
  if (param < 0) { xx = x1; yy = y1 }
  else if (param > 1) { xx = x2; yy = y2 }
  else { xx = x1 + param * C; yy = y1 + param * D }
  return Math.sqrt((px - xx) ** 2 + (py - yy) ** 2)
}

export default function DrawingCanvas({ elements, onAddElement, onSelectElement, selectedId, selectedIds: selectedIdsProp, currentTool, currentProfile, gridSize = 10, isMobile = false }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [drawing, setDrawing] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  const snapToGrid = useCallback((val) => {
    return Math.round(val / gridSize) * gridSize
  }, [gridSize])

  const calcLength = useCallback((x1, y1, x2, y2) => {
    return Math.round(Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2))
  }, [])

  // Draw profile cross section at midpoint of a line segment
  const drawProfileCrossSection = useCallback((ctx, x1, y1, x2, y2, profile, isSelected, scale = 1) => {
    const midX = (x1 + x2) / 2
    const midY = (y1 + y2) / 2
    const w = profile.width * scale
    const h = profile.height * scale
    const groove = profile.grooveWidth * scale

    // Calculate angle
    const angle = Math.atan2(y2 - y1, x2 - x1)

    ctx.save()
    ctx.translate(midX, midY)
    // Rotate: cross section always perpendicular to line direction
    ctx.rotate(angle + Math.PI / 2)

    const lineW = 1
    const fillColor = isSelected ? 'rgba(236,236,238,0.15)' : 'rgba(236,236,238,0.08)'
    const strokeColor = isSelected ? '#ECECEE' : '#888892'

    // Outer rectangle (full cross section)
    ctx.fillStyle = fillColor
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = lineW
    ctx.beginPath()
    ctx.rect(-w / 2, -h / 2, w, h)
    ctx.fill()
    ctx.stroke()

    // T-slot groove (hollowed out center)
    const grooveH = groove
    const grooveFromTop = h / 2 - grooveH / 2
    ctx.fillStyle = '#111114'  // background color, simulating hollow
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = lineW
    ctx.beginPath()
    ctx.rect(-groove / 2, grooveFromTop, groove, grooveH)
    ctx.fill()
    ctx.stroke()

    ctx.restore()
  }, [])

  // Draw grid with soft black-white colors
  const drawGrid = useCallback((ctx, width, height) => {
    ctx.strokeStyle = '#181820'
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

    // Major grid lines every 100px
    ctx.strokeStyle = '#222230'
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

  // Draw elements with soft black-white colors
  const drawElements = useCallback((ctx) => {
    const selectedSet = new Set(selectedIdsProp && selectedIdsProp.length ? selectedIdsProp : (selectedId ? [selectedId] : []))
    elements.forEach(el => {
      const isSelected = selectedSet.has(el.id)
      ctx.strokeStyle = isSelected ? '#FFFFFF' : '#D0D0D8'
      ctx.lineWidth = isSelected ? 3 : 2

      if (el.type === 'line') {
        ctx.beginPath()
        ctx.moveTo(el.x1, el.y1)
        ctx.lineTo(el.x2, el.y2)
        ctx.stroke()

        // Endpoints
        ctx.fillStyle = isSelected ? '#FFFFFF' : '#888892'
        ctx.beginPath()
        ctx.arc(el.x1, el.y1, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(el.x2, el.y2, 4, 0, Math.PI * 2)
        ctx.fill()

        // Length label
        const midX = (el.x1 + el.x2) / 2
        const midY = (el.y1 + el.y2) / 2
        ctx.fillStyle = '#ECECEE'
        ctx.font = '12px "SF Mono", "Menlo", monospace'
        ctx.fillText(`${el.length}mm`, midX + 8, midY - 8)

        // Profile cross section visualization (only for lines > 60px)
        const lineLength = Math.sqrt((el.x2 - el.x1) ** 2 + (el.y2 - el.y1) ** 2)
        const profile = getProfile(el.profileSpec)
        if (profile && lineLength > 60) {
          const scale = Math.max(0.08, Math.min(0.22, Math.max(0.15, 30 / lineLength)))
          drawProfileCrossSection(ctx, el.x1, el.y1, el.x2, el.y2, profile, isSelected, scale)
        }
      } else if (el.type === 'rect') {
        const rx = Math.min(el.x1, el.x2)
        const ry = Math.min(el.y1, el.y2)
        const rw = Math.abs(el.x2 - el.x1)
        const rh = Math.abs(el.y2 - el.y1)

        ctx.strokeRect(rx, ry, rw, rh)

        // Endpoints (corners)
        ctx.fillStyle = isSelected ? '#FFFFFF' : '#888892'
        const corners = [
          [el.x1, el.y1], [el.x2, el.y1],
          [el.x1, el.y2], [el.x2, el.y2]
        ]
        corners.forEach(([cx, cy]) => {
          ctx.beginPath()
          ctx.arc(cx, cy, 4, 0, Math.PI * 2)
          ctx.fill()
        })

        // Length label (diagonal)
        const midX = rx + rw / 2
        const midY = ry + rh / 2
        ctx.fillStyle = '#ECECEE'
        ctx.font = '12px "SF Mono", "Menlo", monospace'
        ctx.fillText(`${el.length}mm`, midX + 8, midY - 8)

        // Profile cross section on one side of the rect
        const profile = getProfile(el.profileSpec)
        if (profile) {
          // Show cross section on top side of rectangle
          const topMidX = rx + rw / 2
          const topMidY = ry
          const sideLength = rw
          if (sideLength > 60) {
            const scale = Math.max(0.08, Math.min(0.22, Math.max(0.15, 30 / sideLength)))
            drawProfileCrossSection(ctx, rx, ry, rx + rw, ry, profile, isSelected, scale)
          }
        }
      }
    })
  }, [elements, selectedId, selectedIdsProp, drawProfileCrossSection])

  // Draw in-progress element
  const drawDrawing = useCallback((ctx) => {
    if (!drawing) return
    ctx.setLineDash([5, 5])

    if (drawing.type === 'line') {
      ctx.strokeStyle = '#ECECEE'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(drawing.x1, drawing.y1)
      ctx.lineTo(drawing.x2, drawing.y2)
      ctx.stroke()
    } else if (drawing.type === 'rect') {
      const rx = Math.min(drawing.x1, drawing.x2)
      const ry = Math.min(drawing.y1, drawing.y2)
      const rw = Math.abs(drawing.x2 - drawing.x1)
      const rh = Math.abs(drawing.y2 - drawing.y1)

      // Semi-transparent fill
      ctx.fillStyle = 'rgba(236,236,238,0.06)'
      ctx.fillRect(rx, ry, rw, rh)

      // Dashed outline
      ctx.strokeStyle = '#ECECEE'
      ctx.lineWidth = 1
      ctx.strokeRect(rx, ry, rw, rh)
    } else if (drawing.type === 'selection') {
      // T02: Box selection preview
      const rx = Math.min(drawing.x1, drawing.x2)
      const ry = Math.min(drawing.y1, drawing.y2)
      const rw = Math.abs(drawing.x2 - drawing.x1)
      const rh = Math.abs(drawing.y2 - drawing.y1)

      ctx.fillStyle = 'rgba(236,236,238,0.06)'
      ctx.fillRect(rx, ry, rw, rh)
      ctx.strokeStyle = '#ECECEE'
      ctx.lineWidth = 1
      ctx.strokeRect(rx, ry, rw, rh)
    }

    ctx.setLineDash([])
  }, [drawing])

  // Full redraw
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

  // Canvas resize — listen to window resize and container changes
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resizeCanvas = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      canvas.width = w
      canvas.height = h
      setCanvasSize({ width: w, height: h })
      redraw()
    }

    resizeCanvas()

    const resizeObserver = new ResizeObserver(resizeCanvas)
    resizeObserver.observe(container)

    window.addEventListener('resize', resizeCanvas)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [redraw])

  // Get coordinates from mouse or touch event
  const getCoords = useCallback((e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    let clientX, clientY

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX
      clientY = e.changedTouches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const rawX = clientX - rect.left
    const rawY = clientY - rect.top
    return { rawX, rawY, x: snapToGrid(rawX), y: snapToGrid(rawY) }
  }, [snapToGrid])

  // Handle click/tap
  const handlePointerDown = useCallback((e) => {
    const { rawX, rawY, x, y } = getCoords(e)

    if (currentTool === 'line') {
      if (!drawing) {
        setDrawing({ type: 'line', x1: x, y1: y, x2: x, y2: y })
      } else {
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
    } else if (currentTool === 'rect') {
      if (!drawing) {
        setDrawing({ type: 'rect', x1: x, y1: y, x2: x, y2: y })
      } else {
        const rw = Math.abs(x - drawing.x1)
        const rh = Math.abs(y - drawing.y1)
        const length = Math.round(Math.sqrt(rw ** 2 + rh ** 2))
        if (length > 0) {
          onAddElement({
            id: 'el-' + Date.now(),
            type: 'rect',
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
      let found = null
      let minDist = isMobile ? 20 : 10
      elements.forEach(el => {
        if (el.type === 'line') {
          const dist = distToSegment(rawX, rawY, el.x1, el.y1, el.x2, el.y2)
          if (dist < minDist) {
            minDist = dist
            found = el.id
          }
        } else if (el.type === 'rect') {
          const rx = Math.min(el.x1, el.x2)
          const ry = Math.min(el.y1, el.y2)
          const rw = Math.abs(el.x2 - el.x1)
          const rh = Math.abs(el.y2 - el.y1)
          // Check if click is inside or near the rect
          const inRect = rawX >= rx - 5 && rawX <= rx + rw + 5 && rawY >= ry - 5 && rawY <= ry + rh + 5
          // Also check distance to each side
          const distToTop = distToSegment(rawX, rawY, rx, ry, rx + rw, ry)
          const distToBottom = distToSegment(rawX, rawY, rx, ry + rh, rx + rw, ry + rh)
          const distToLeft = distToSegment(rawX, rawY, rx, ry, rx, ry + rh)
          const distToRight = distToSegment(rawX, rawY, rx + rw, ry, rx + rw, ry + rh)
          const minSideDist = Math.min(distToTop, distToBottom, distToLeft, distToRight)
          if (inRect || minSideDist < minDist) {
            minDist = inRect ? 0 : minSideDist
            found = el.id
          }
        }
      })
      if (found) {
        // Click on element: select single
        onSelectElement(found, [])
      } else {
        // T02: Click on empty area — start box selection
        setDrawing({ type: 'selection', x1: x, y1: y, x2: x, y2: y })
      }
    } else if (currentTool === 'delete') {
      let found = null
      let minDist = isMobile ? 20 : 12
      elements.forEach(el => {
        if (el.type === 'line') {
          const dist = distToSegment(rawX, rawY, el.x1, el.y1, el.x2, el.y2)
          if (dist < minDist) {
            minDist = dist
            found = el.id
          }
        } else if (el.type === 'rect') {
          const rx = Math.min(el.x1, el.x2)
          const ry = Math.min(el.y1, el.y2)
          const rw = Math.abs(el.x2 - el.x1)
          const rh = Math.abs(el.y2 - el.y1)
          const inRect = rawX >= rx - 5 && rawX <= rx + rw + 5 && rawY >= ry - 5 && rawY <= ry + rh + 5
          const distToTop = distToSegment(rawX, rawY, rx, ry, rx + rw, ry)
          const distToBottom = distToSegment(rawX, rawY, rx, ry + rh, rx + rw, ry + rh)
          const distToLeft = distToSegment(rawX, rawY, rx, ry, rx, ry + rh)
          const distToRight = distToSegment(rawX, rawY, rx + rw, ry, rx + rw, ry + rh)
          const minSideDist = Math.min(distToTop, distToBottom, distToLeft, distToRight)
          if (inRect || minSideDist < minDist) {
            minDist = inRect ? 0 : minSideDist
            found = el.id
          }
        }
      })
      if (found) {
        onAddElement(null, found)
      }
    }
  }, [currentTool, drawing, currentProfile, elements, isMobile, snapToGrid, calcLength, onAddElement, onSelectElement, getCoords])

  // Handle mouse/touch move
  const handlePointerMove = useCallback((e) => {
    const { x, y } = getCoords(e)
    setMousePos({ x, y })

    if (drawing) {
      if (currentTool === 'line') {
        setDrawing(prev => ({ ...prev, x2: x, y2: y }))
      } else if (currentTool === 'rect') {
        setDrawing(prev => ({ ...prev, x2: x, y2: y }))
      } else if (drawing.type === 'selection') {
        // T02: Update selection box endpoint
        setDrawing(prev => ({ ...prev, x2: x, y2: y }))
      }
    }
  }, [drawing, currentTool, getCoords])

  // T02: handlePointerUp - finalize box selection
  const handlePointerUp = useCallback((e) => {
    if (!drawing) return
    if (drawing.type !== 'selection') return

    const minX = Math.min(drawing.x1, drawing.x2)
    const maxX = Math.max(drawing.x1, drawing.x2)
    const minY = Math.min(drawing.y1, drawing.y2)
    const maxY = Math.max(drawing.y1, drawing.y2)

    // Only finalize if user actually dragged (selection box has size)
    const boxW = maxX - minX
    const boxH = maxY - minY
    if (boxW > 4 && boxH > 4) {
      const selected = elements
        .filter(el => {
          const midX = (el.x1 + el.x2) / 2
          const midY = (el.y1 + el.y2) / 2
          return midX >= minX && midX <= maxX && midY >= minY && midY <= maxY
        })
        .map(el => el.id)

      if (selected.length > 0) {
        // Pass array via second arg
        onSelectElement(selected[0], selected)
      } else {
        onSelectElement(null, [])
      }
    } else {
      // Tiny click on empty area: clear selection
      onSelectElement(null, [])
    }
    setDrawing(null)
  }, [drawing, elements, onSelectElement])

  // Cancel drawing
  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    setDrawing(null)
  }, [])

  // Touch cancel (double tap to cancel)
  const handleTouchCancel = useCallback(() => {
    setDrawing(null)
  }, [])

  // Drawing hint text based on tool
  const drawingHintText = drawing && currentTool === 'line'
    ? '点击终点完成线段 · 右键取消'
    : drawing && currentTool === 'rect'
    ? '点击终点完成矩形 · 右键取消'
    : drawing && drawing.type === 'selection'
    ? '拖动鼠标框选图元 · 松开完成选择'
    : null

  // T02: Box selection count badge
  const selectionCount = selectedIdsProp && selectedIdsProp.length ? selectedIdsProp.length : (selectedId ? 1 : 0)

  return (
    <div ref={containerRef} style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      background: '#0C0C0F',
      overflow: 'hidden',
      touchAction: 'none', // prevent browser gestures on canvas
    }}>
      <canvas
        ref={canvasRef}
        style={{
          cursor: currentTool === 'select' ? 'pointer' : currentTool === 'delete' ? 'pointer' : 'crosshair',
          display: 'block',
          width: '100%',
          height: '100%',
        }}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onContextMenu={handleContextMenu}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={(e) => { handlePointerUp(e); handleTouchCancel() }}
      />
      {/* Coordinate display */}
      <div style={{
        position: 'absolute', bottom: 8, left: 8,
        fontSize: 12, color: '#888892',
        background: 'rgba(26,26,31,0.85)',
        padding: '4px 8px',
        borderRadius: 6,
        fontFamily: '"SF Mono", "Menlo", monospace',
      }}>
        X: {mousePos.x} Y: {mousePos.y}
      </div>
      {/* Drawing hint */}
      {drawingHintText && (
        <div style={{
          position: 'absolute', top: 8, left: 8,
          fontSize: 14, color: '#ECECEE',
          background: 'rgba(26,26,31,0.85)',
          padding: '4px 8px',
          borderRadius: 6,
        }}>
          {drawingHintText}
        </div>
      )}
      {/* T02: Selection count badge */}
      {selectionCount > 1 && !drawingHintText && (
        <div style={{
          position: 'absolute', top: 8, left: 8,
          fontSize: 13, color: '#0C0C0F',
          background: '#ECECEE',
          padding: '4px 10px',
          borderRadius: 6,
          fontWeight: 600,
          fontFamily: '"SF Mono", "Menlo", monospace',
        }}>
          已选中 {selectionCount} 个图元
        </div>
      )}
    </div>
  )
}
