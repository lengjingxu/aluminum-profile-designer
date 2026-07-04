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

  // T10: Viewport state for zoom (zoom level) and pan (offset)
  const [viewport, setViewport] = useState({ zoom: 1, panX: 0, panY: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [spacePressed, setSpacePressed] = useState(false)
  const panStateRef = useRef(null) // { startX, startY, startPanX, startPanY }

  const snapToGrid = useCallback((val) => {
    return Math.round(val / gridSize) * gridSize
  }, [gridSize])

  const calcLength = useCallback((x1, y1, x2, y2) => {
    return Math.round(Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2))
  }, [])

  // T10: Transform world coords -> screen coords
  const worldToScreen = useCallback((wx, wy) => {
    return {
      x: (wx + viewport.panX) * viewport.zoom,
      y: (wy + viewport.panY) * viewport.zoom,
    }
  }, [viewport])

  // T10: Transform screen coords -> world coords (raw, before snap)
  const screenToWorld = useCallback((sx, sy) => {
    return {
      x: sx / viewport.zoom - viewport.panX,
      y: sy / viewport.zoom - viewport.panY,
    }
  }, [viewport])

  // Draw profile cross section at midpoint of a line segment
  const drawProfileCrossSection = useCallback((ctx, x1, y1, x2, y2, profile, isSelected, scale = 1) => {
    // Convert to screen coords first
    const s1 = worldToScreen(x1, y1)
    const s2 = worldToScreen(x2, y2)
    const midX = (s1.x + s2.x) / 2
    const midY = (s1.y + s2.y) / 2
    const w = profile.width * scale * viewport.zoom
    const h = profile.height * scale * viewport.zoom
    const groove = profile.grooveWidth * scale * viewport.zoom

    // Calculate angle (screen-space)
    const angle = Math.atan2(s2.y - s1.y, s2.x - s1.x)

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
  }, [worldToScreen, viewport.zoom])

  // Draw grid with soft black-white colors (respects viewport)
  const drawGrid = useCallback((ctx, width, height) => {
    ctx.strokeStyle = '#181820'
    ctx.lineWidth = 0.5

    // Compute visible world-space bounds
    const w0 = screenToWorld(0, 0)
    const w1 = screenToWorld(width, height)
    const startX = Math.floor(w0.x / gridSize) * gridSize
    const endX = Math.ceil(w1.x / gridSize) * gridSize
    const startY = Math.floor(w0.y / gridSize) * gridSize
    const endY = Math.ceil(w1.y / gridSize) * gridSize

    for (let wx = startX; wx <= endX; wx += gridSize) {
      const sx = (wx + viewport.panX) * viewport.zoom
      ctx.beginPath()
      ctx.moveTo(sx, 0)
      ctx.lineTo(sx, height)
      ctx.stroke()
    }
    for (let wy = startY; wy <= endY; wy += gridSize) {
      const sy = (wy + viewport.panY) * viewport.zoom
      ctx.beginPath()
      ctx.moveTo(0, sy)
      ctx.lineTo(width, sy)
      ctx.stroke()
    }

    // Major grid lines every 100px (world units)
    ctx.strokeStyle = '#222230'
    ctx.lineWidth = 1
    const majorStep = 100
    const startMX = Math.floor(w0.x / majorStep) * majorStep
    const endMX = Math.ceil(w1.x / majorStep) * majorStep
    const startMY = Math.floor(w0.y / majorStep) * majorStep
    const endMY = Math.ceil(w1.y / majorStep) * majorStep
    for (let wx = startMX; wx <= endMX; wx += majorStep) {
      const sx = (wx + viewport.panX) * viewport.zoom
      ctx.beginPath()
      ctx.moveTo(sx, 0)
      ctx.lineTo(sx, height)
      ctx.stroke()
    }
    for (let wy = startMY; wy <= endMY; wy += majorStep) {
      const sy = (wy + viewport.panY) * viewport.zoom
      ctx.beginPath()
      ctx.moveTo(0, sy)
      ctx.lineTo(width, sy)
      ctx.stroke()
    }
  }, [gridSize, viewport, screenToWorld])

  // Draw elements with soft black-white colors
  const drawElements = useCallback((ctx) => {
    const selectedSet = new Set(selectedIdsProp && selectedIdsProp.length ? selectedIdsProp : (selectedId ? [selectedId] : []))
    elements.forEach(el => {
      const isSelected = selectedSet.has(el.id)
      // T04: Locked elements use a muted tone
      const baseStroke = el.locked ? '#9A9AA8' : '#D0D0D8'
      ctx.strokeStyle = isSelected ? '#FFFFFF' : baseStroke
      ctx.lineWidth = isSelected ? 3 : 2

      // T10: Convert world coords to screen coords
      const s1 = worldToScreen(el.x1, el.y1)
      const s2 = worldToScreen(el.x2, el.y2)

      if (el.type === 'line') {
        ctx.beginPath()
        ctx.moveTo(s1.x, s1.y)
        ctx.lineTo(s2.x, s2.y)
        ctx.stroke()

        // Endpoints
        ctx.fillStyle = isSelected ? '#FFFFFF' : '#888892'
        ctx.beginPath()
        ctx.arc(s1.x, s1.y, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(s2.x, s2.y, 4, 0, Math.PI * 2)
        ctx.fill()

        // Length label
        const midX = (s1.x + s2.x) / 2
        const midY = (s1.y + s2.y) / 2
        ctx.fillStyle = '#ECECEE'
        ctx.font = '12px "SF Mono", "Menlo", monospace'
        ctx.fillText(`${el.length}mm`, midX + 8, midY - 8)

        // Profile cross section visualization (only for lines > 60 world units)
        const worldLen = Math.sqrt((el.x2 - el.x1) ** 2 + (el.y2 - el.y1) ** 2)
        const profile = getProfile(el.profileSpec)
        if (profile && worldLen > 60) {
          const baseScale = Math.max(0.08, Math.min(0.22, Math.max(0.15, 30 / worldLen)))
          drawProfileCrossSection(ctx, el.x1, el.y1, el.x2, el.y2, profile, isSelected, baseScale)
        }
      } else if (el.type === 'rect') {
        const rx = Math.min(s1.x, s2.x)
        const ry = Math.min(s1.y, s2.y)
        const rw = Math.abs(s2.x - s1.x)
        const rh = Math.abs(s2.y - s1.y)

        ctx.strokeRect(rx, ry, rw, rh)

        // Endpoints (corners)
        ctx.fillStyle = isSelected ? '#FFFFFF' : '#888892'
        const corners = [
          [s1.x, s1.y], [s2.x, s1.y],
          [s1.x, s2.y], [s2.x, s2.y]
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

        // Profile cross section on top side of rect
        const profile = getProfile(el.profileSpec)
        if (profile) {
          const worldSideLen = Math.abs(el.x2 - el.x1)
          if (worldSideLen > 60) {
            const baseScale = Math.max(0.08, Math.min(0.22, Math.max(0.15, 30 / worldSideLen)))
            drawProfileCrossSection(ctx, el.x1, el.y1, el.x2, el.y1, profile, isSelected, baseScale)
          }
        }
      }

      // T05: Text label for the element (annotation like "支撑"/"上轨")
      if (el.label && el.label.trim()) {
        const midX = (s1.x + s2.x) / 2
        const midY = (s1.y + s2.y) / 2
        const labelText = el.label
        ctx.font = '13px Inter, -apple-system, sans-serif'
        const labelColor = el.labelColor || '#888892'
        // Draw subtle background pill for readability
        const padding = 4
        const textWidth = ctx.measureText(labelText).width
        ctx.fillStyle = 'rgba(26,26,31,0.85)'
        ctx.fillRect(midX + 8 - padding, midY - 22, textWidth + padding * 2, 18)
        ctx.strokeStyle = '#2E2E38'
        ctx.lineWidth = 1
        ctx.strokeRect(midX + 8 - padding, midY - 22, textWidth + padding * 2, 18)
        ctx.fillStyle = labelColor
        ctx.fillText(labelText, midX + 8, midY - 10)
      }

      // T04: Lock icon for locked elements
      if (el.locked) {
        const midX = (s1.x + s2.x) / 2
        const midY = (s1.y + s2.y) / 2
        const iconX = midX + 14
        const iconY = midY + 14
        // Background pill
        ctx.fillStyle = 'rgba(26,26,31,0.92)'
        ctx.strokeStyle = '#888892'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(iconX, iconY, 9, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        // Lock body (rectangle)
        ctx.fillStyle = '#ECECEE'
        ctx.fillRect(iconX - 4, iconY - 1, 8, 6)
        // Lock shackle (arc)
        ctx.strokeStyle = '#ECECEE'
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.arc(iconX, iconY - 1, 2.5, Math.PI, 0, false)
        ctx.stroke()
      }
    })
  }, [elements, selectedId, selectedIdsProp, drawProfileCrossSection, worldToScreen])

  // Draw in-progress element (uses world coords, transformed inside)
  const drawDrawing = useCallback((ctx) => {
    if (!drawing) return
    ctx.setLineDash([5, 5])

    // T10: Transform drawing points to screen space
    const s1 = worldToScreen(drawing.x1, drawing.y1)
    const s2 = worldToScreen(drawing.x2, drawing.y2)

    if (drawing.type === 'line') {
      ctx.strokeStyle = '#ECECEE'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(s1.x, s1.y)
      ctx.lineTo(s2.x, s2.y)
      ctx.stroke()
    } else if (drawing.type === 'rect') {
      const rx = Math.min(s1.x, s2.x)
      const ry = Math.min(s1.y, s2.y)
      const rw = Math.abs(s2.x - s1.x)
      const rh = Math.abs(s2.y - s1.y)

      // Semi-transparent fill
      ctx.fillStyle = 'rgba(236,236,238,0.06)'
      ctx.fillRect(rx, ry, rw, rh)

      // Dashed outline
      ctx.strokeStyle = '#ECECEE'
      ctx.lineWidth = 1
      ctx.strokeRect(rx, ry, rw, rh)
    } else if (drawing.type === 'selection') {
      // T02: Box selection preview
      const rx = Math.min(s1.x, s2.x)
      const ry = Math.min(s1.y, s2.y)
      const rw = Math.abs(s2.x - s1.x)
      const rh = Math.abs(s2.y - s1.y)

      ctx.fillStyle = 'rgba(236,236,238,0.06)'
      ctx.fillRect(rx, ry, rw, rh)
      ctx.strokeStyle = '#ECECEE'
      ctx.lineWidth = 1
      ctx.strokeRect(rx, ry, rw, rh)
    }

    ctx.setLineDash([])
  }, [drawing, worldToScreen])

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

  // T10: Mouse wheel zoom (Ctrl+wheel for fine control)
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    // Mouse position in screen-space (relative to canvas)
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    // Ctrl+wheel: zoom around mouse position
    // Without Ctrl: still allow zoom but with smaller step
    const isCtrl = e.ctrlKey || e.metaKey
    const factor = isCtrl ? (e.deltaY > 0 ? 0.9 : 1.111) : (e.deltaY > 0 ? 0.95 : 1.053)

    setViewport(prev => {
      const newZoom = Math.min(5, Math.max(0.2, prev.zoom * factor))
      // Zoom around mouse: keep world point under cursor stationary
      // screen = (world + pan) * zoom => world = screen/zoom - pan
      // After zoom, we want the same world point to be at the same screen pos:
      // worldAtMouse = mx / newZoom - newPanX  (must equal mx / prev.zoom - prev.panX)
      // => newPanX = mx / newZoom - (mx / prev.zoom - prev.panX)
      const newPanX = mx / newZoom - (mx / prev.zoom - prev.panX)
      const newPanY = my / newZoom - (my / prev.zoom - prev.panY)
      return { zoom: newZoom, panX: newPanX, panY: newPanY }
    })
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // T10: Spacebar to enable pan mode + keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.key === ' ' || e.code === 'Space') {
        if (!spacePressed) {
          e.preventDefault()
          setSpacePressed(true)
        }
      } else if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        // Ctrl+0: reset zoom
        e.preventDefault()
        setViewport({ zoom: 1, panX: 0, panY: 0 })
      }
    }
    const handleKeyUp = (e) => {
      if (e.key === ' ' || e.code === 'Space') {
        setSpacePressed(false)
        setIsPanning(false)
        panStateRef.current = null
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [spacePressed])

  // Get coordinates from mouse or touch event (returns world coords snapped to grid + raw screen)
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

    const rawScreenX = clientX - rect.left
    const rawScreenY = clientY - rect.top
    // Convert screen -> world
    const world = screenToWorld(rawScreenX, rawScreenY)
    return {
      rawScreenX, rawScreenY,
      rawX: world.x, rawY: world.y,
      x: snapToGrid(world.x), y: snapToGrid(world.y),
    }
  }, [snapToGrid, screenToWorld])

  // Handle click/tap
  const handlePointerDown = useCallback((e) => {
    const { rawScreenX, rawScreenY, rawX, rawY, x, y } = getCoords(e)

    // T10: Middle-click or Space+click → start panning
    if (e.button === 1 || spacePressed) {
      e.preventDefault()
      setIsPanning(true)
      panStateRef.current = {
        startScreenX: rawScreenX,
        startScreenY: rawScreenY,
        startPanX: viewport.panX,
        startPanY: viewport.panY,
      }
      return
    }

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
        // T04: Skip locked elements — cannot delete
        if (el.locked) return
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
  }, [currentTool, drawing, currentProfile, elements, isMobile, snapToGrid, calcLength, onAddElement, onSelectElement, getCoords, spacePressed, viewport])

  // Handle mouse/touch move
  const handlePointerMove = useCallback((e) => {
    const { x, y, rawScreenX, rawScreenY } = getCoords(e)
    setMousePos({ x, y })

    // T10: If panning, update pan offset based on screen-space delta
    if (isPanning && panStateRef.current) {
      const dx = (rawScreenX - panStateRef.current.startScreenX) / viewport.zoom
      const dy = (rawScreenY - panStateRef.current.startScreenY) / viewport.zoom
      setViewport(prev => ({
        ...prev,
        panX: panStateRef.current.startPanX + dx,
        panY: panStateRef.current.startPanY + dy,
      }))
      return
    }

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
  }, [drawing, currentTool, getCoords, isPanning, viewport])

  // T02: handlePointerUp - finalize box selection or pan
  const handlePointerUp = useCallback(() => {
    // End pan if active
    if (isPanning) {
      setIsPanning(false)
      panStateRef.current = null
      return
    }

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
          // T04: Skip locked elements from box selection
          if (el.locked) return false
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
  }, [drawing, elements, onSelectElement, isPanning])

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

  // T10: Reset viewport button handler
  const handleResetView = useCallback(() => {
    setViewport({ zoom: 1, panX: 0, panY: 0 })
  }, [])

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
          cursor: spacePressed
            ? (isPanning ? 'grabbing' : 'grab')
            : currentTool === 'select' ? 'pointer' : currentTool === 'delete' ? 'pointer' : 'crosshair',
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
      {/* T10: Zoom controls (bottom-right) */}
      <div style={{
        position: 'absolute', bottom: 8, right: 8,
        display: 'flex', alignItems: 'center', gap: 4,
        background: 'rgba(26,26,31,0.85)',
        padding: '4px 6px',
        borderRadius: 6,
        fontFamily: '"SF Mono", "Menlo", monospace',
        fontSize: 12, color: '#ECECEE',
      }}>
        <button
          onClick={() => setViewport(v => ({ ...v, zoom: Math.max(0.2, v.zoom * 0.8) }))}
          style={{
            background: '#111114', color: '#ECECEE',
            border: '1px solid #2E2E38',
            borderRadius: 4, padding: '2px 8px',
            cursor: 'pointer', fontSize: 14, lineHeight: 1,
          }}
          title="缩小"
        >−</button>
        <span style={{ minWidth: 48, textAlign: 'center', color: '#888892' }}>
          {Math.round(viewport.zoom * 100)}%
        </span>
        <button
          onClick={() => setViewport(v => ({ ...v, zoom: Math.min(5, v.zoom * 1.25) }))}
          style={{
            background: '#111114', color: '#ECECEE',
            border: '1px solid #2E2E38',
            borderRadius: 4, padding: '2px 8px',
            cursor: 'pointer', fontSize: 14, lineHeight: 1,
          }}
          title="放大"
        >+</button>
        <button
          onClick={handleResetView}
          style={{
            background: '#111114', color: '#ECECEE',
            border: '1px solid #2E2E38',
            borderRadius: 4, padding: '2px 8px',
            cursor: 'pointer', fontSize: 11, marginLeft: 4,
          }}
          title="重置视图 (Ctrl+0)"
        >重置</button>
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
      {/* T10: Pan mode indicator (top-right) */}
      {(spacePressed || isPanning) && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          fontSize: 12, color: '#0C0C0F',
          background: '#ECECEE',
          padding: '4px 10px',
          borderRadius: 6,
          fontWeight: 600,
        }}>
          ✋ 平移模式
        </div>
      )}
    </div>
  )
}