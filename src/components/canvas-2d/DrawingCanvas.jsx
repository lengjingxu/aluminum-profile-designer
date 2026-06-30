import { useRef, useEffect, useState, useCallback } from 'react'

export default function DrawingCanvas({ elements, onAddElement, onSelectElement, selectedId, currentTool, currentProfile, gridSize = 10, isMobile = false }) {
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

  // Draw grid with new design colors
  const drawGrid = useCallback((ctx, width, height) => {
    ctx.strokeStyle = '#1E1E2E'
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
    ctx.strokeStyle = '#2A2A3E'
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

  // Draw elements with new design colors
  const drawElements = useCallback((ctx) => {
    elements.forEach(el => {
      const isSelected = el.id === selectedId
      ctx.strokeStyle = isSelected ? '#3B82F6' : '#F0F0F5'
      ctx.lineWidth = isSelected ? 3 : 2

      if (el.type === 'line') {
        ctx.beginPath()
        ctx.moveTo(el.x1, el.y1)
        ctx.lineTo(el.x2, el.y2)
        ctx.stroke()

        // Endpoints
        ctx.fillStyle = isSelected ? '#3B82F6' : '#8888A0'
        ctx.beginPath()
        ctx.arc(el.x1, el.y1, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(el.x2, el.y2, 4, 0, Math.PI * 2)
        ctx.fill()

        // Length label
        const midX = (el.x1 + el.x2) / 2
        const midY = (el.y1 + el.y2) / 2
        ctx.fillStyle = '#3B82F6'
        ctx.font = '12px "SF Mono", "Menlo", monospace'
        ctx.fillText(`${el.length}mm`, midX + 8, midY - 8)
      } else if (el.type === 'rect') {
        ctx.beginPath()
        ctx.rect(el.x, el.y, el.w, el.h)
        ctx.stroke()
      }
    })
  }, [elements, selectedId])

  // Draw in-progress element
  const drawDrawing = useCallback((ctx) => {
    if (!drawing) return
    ctx.strokeStyle = '#3B82F6'
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
    } else if (currentTool === 'select') {
      let found = null
      let minDist = isMobile ? 20 : 10 // larger hit area on mobile
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
      let found = null
      let minDist = isMobile ? 25 : 15
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
        onAddElement(null, found)
      }
    }
  }, [currentTool, drawing, currentProfile, elements, isMobile, snapToGrid, calcLength, onAddElement, onSelectElement, getCoords])

  // Handle mouse/touch move
  const handlePointerMove = useCallback((e) => {
    const { x, y } = getCoords(e)
    setMousePos({ x, y })

    if (drawing && currentTool === 'line') {
      setDrawing(prev => ({ ...prev, x2: x, y2: y }))
    }
  }, [drawing, currentTool, getCoords])

  // Cancel drawing
  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    setDrawing(null)
  }, [])

  // Touch cancel (double tap to cancel)
  const handleTouchCancel = useCallback(() => {
    setDrawing(null)
  }, [])

  return (
    <div ref={containerRef} style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      background: '#0A0A0F',
      overflow: 'hidden',
      touchAction: 'none', // prevent browser gestures on canvas
    }}>
      <canvas
        ref={canvasRef}
        style={{
          cursor: currentTool === 'select' ? 'pointer' : 'crosshair',
          display: 'block',
          width: '100%',
          height: '100%',
        }}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onContextMenu={handleContextMenu}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handleTouchCancel}
      />
      {/* Coordinate display */}
      <div style={{
        position: 'absolute', bottom: 8, left: 8,
        fontSize: 12, color: '#8888A0',
        background: 'rgba(20,20,31,0.8)',
        padding: '4px 8px',
        borderRadius: 6,
        fontFamily: '"SF Mono", "Menlo", monospace',
      }}>
        X: {mousePos.x} Y: {mousePos.y}
      </div>
      {/* Drawing hint */}
      {drawing && currentTool === 'line' && (
        <div style={{
          position: 'absolute', top: 8, left: 8,
          fontSize: 14, color: '#3B82F6',
          background: 'rgba(20,20,31,0.8)',
          padding: '4px 8px',
          borderRadius: 6,
        }}>
          点击终点完成线段 · 右键取消
        </div>
      )}
    </div>
  )
}
