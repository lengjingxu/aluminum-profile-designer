import { useState, useCallback, useEffect, useRef } from 'react'
import Toolbar from '../../components/toolbar/Toolbar'
import DrawingCanvas from '../../components/canvas-2d/DrawingCanvas'
import Viewer3D from '../../components/canvas-3d/Viewer3D'
import PropertyPanel from '../../components/property-panel/PropertyPanel'
import MaterialList from '../../components/material-list/MaterialList'
import { ALUMINUM_PROFILES } from '../../lib/aluminum-profiles'
import { exportCanvasAsPNG } from '../../lib/exporter'
import { TEMPLATES, TEMPLATE_IDS, getTemplate, resolveTemplate } from '../../lib/templates'
import { saveDesign, generateId, saveDraft, loadDraft, clearDraft } from '../../utils/storage'
import { Save, Trash2, Layers, ClipboardList, X, Eye, Pencil, LayoutTemplate, ArrowLeft, ClipboardCopy, ClipboardPaste, AlignCenterHorizontal, AlignCenterVertical, Grid3x3, CloudCheck, CloudOff, ImageDown, Globe } from 'lucide-react'
import { t, loadLang, saveLang } from '../../lib/i18n'

export default function EditorPage({ isMobile }) {
  const [elements, setElements] = useState([])
  const [currentTool, setCurrentTool] = useState('line')
  const [currentProfile, setCurrentProfile] = useState('4040')
  const [selectedId, setSelectedId] = useState(null)
  const [selectedIds, setSelectedIds] = useState([]) // T02: box-selection array
  const [viewMode, setViewMode] = useState('2d')
  const [history, setHistory] = useState([])
  const [future, setFuture] = useState([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetTab, setSheetTab] = useState('property')
  const [mode, setMode] = useState('draw') // 'draw' | 'view'
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [clipboard, setClipboard] = useState([]) // T01: clipboard for copy/paste
  // T12: Grid size in pixels (10/20/50)
  const [gridSize, setGridSize] = useState(10)
  // T15: Auto-save draft state
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const [draftRestored, setDraftRestored] = useState(false)
  // T17: UI language (zh / en), persisted in localStorage
  const [lang, setLang] = useState(() => loadLang())

  useEffect(() => {
    saveLang(lang)
  }, [lang])

  // T16: Ref for DrawingCanvas imperative handle
  const canvasRef = useRef(null)

  // T16: Export canvas as PNG
  const handleExportPNG = useCallback(() => {
    const canvas = canvasRef.current?.getCanvas()
    if (!canvas) return
    exportCanvasAsPNG(canvas, { filename: `aluminum-design-${Date.now()}.png` })
  }, [])

  // T01: Copy selected element to clipboard
  const handleCopy = useCallback(() => {
    if (!selectedId) return
    const el = elements.find(x => x.id === selectedId)
    if (el) setClipboard([{ ...el, id: 'el-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6) }])
  }, [selectedId, elements])

  // T01: Paste clipboard contents
  const handlePaste = useCallback(() => {
    if (clipboard.length === 0) return
    const newEls = clipboard.map(el => ({
      ...el,
      id: 'el-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      x1: el.x1 + 20,
      y1: el.y1 + 20,
      x2: el.x2 + 20,
      y2: el.y2 + 20,
    }))
    setHistory(h => [...h, [...elements]])
    setFuture([])
    setElements(prev => [...prev, ...newEls])
    // Update clipboard to track pasted copy
    setClipboard(newEls.map(el => ({ ...el })))
  }, [clipboard, elements])

  // T01: Duplicate selected element in place (Ctrl+D)
  const handleDuplicate = useCallback(() => {
    if (!selectedId) return
    const el = elements.find(x => x.id === selectedId)
    if (!el) return
    const copy = {
      ...el,
      id: 'el-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      x1: el.x1 + 20,
      y1: el.y1 + 20,
      x2: el.x2 + 20,
      y2: el.y2 + 20,
    }
    handleAddElement(copy)
    setSelectedId(copy.id)
  }, [selectedId, elements, handleAddElement])

  // T01: Keyboard shortcuts for copy/paste/duplicate + T02: delete selected
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore when typing in input fields
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      // T11: Ctrl+Z undo / Ctrl+Y (or Ctrl+Shift+Z) redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      } else if ((e.ctrlKey || e.metaKey) && ((e.key === 'y' || e.key === 'Y') || ((e.key === 'z' || e.key === 'Z') && e.shiftKey))) {
        e.preventDefault()
        handleRedo()
      } else if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault()
        handleCopy()
      } else if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault()
        handlePaste()
      } else if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault()
        handleDuplicate()
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedId || selectedIds.length > 0)) {
        // T02: Delete key removes selection (single or multi)
        e.preventDefault()
        handleDeleteSelected()
      } else if ((e.key === 'l' || e.key === 'L') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // T04: L key toggles lock on selected element
        if (selectedId) {
          e.preventDefault()
          handleToggleLock()
        }
      } else if (e.key === 'Escape') {
        // T02: ESC clears selection / cancels drawing
        setSelectedId(null)
        setSelectedIds([])
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleCopy, handlePaste, handleDuplicate, handleDeleteSelected, handleToggleLock, handleUndo, handleRedo, selectedId, selectedIds])

  // T15: Auto-save draft to localStorage every 60 seconds
  useEffect(() => {
    if (draftRestored) return // wait until restoration attempt completes
    const interval = setInterval(() => {
      if (elements.length > 0) {
        const ts = saveDraft(elements, currentProfile)
        if (ts) setLastSavedAt(ts)
      } else {
        clearDraft()
        setLastSavedAt(null)
      }
    }, 60000)
    return () => clearInterval(interval)
  }, [elements, currentProfile, draftRestored])

  // T15: Restore draft on mount if no elements loaded
  useEffect(() => {
    const draft = loadDraft()
    if (draft && draft.elements && draft.elements.length > 0) {
      const ts = draft.updatedAt || Date.now()
      const confirmMsg = t('draftPrompt', lang, { time: new Date(ts).toLocaleString(), n: draft.elements.length })
      let restore = false
      try {
        restore = window.confirm(confirmMsg)
      } catch {
        restore = false
      }
      if (restore) {
        setElements(draft.elements)
        if (draft.currentProfile) setCurrentProfile(draft.currentProfile)
        setLastSavedAt(ts)
      } else {
        // User declined — drop the stale draft so it doesn't keep prompting
        clearDraft()
      }
    }
    setDraftRestored(true)
  }, [])

  const handleAddElement = useCallback((newElement, deleteId) => {
    if (deleteId) {
      const prev = [...elements]
      setHistory(h => [...h, prev])
      setFuture([])
      setElements(elements.filter(el => el.id !== deleteId))
    } else if (newElement) {
      const prev = [...elements]
      setHistory(h => [...h, prev])
      setFuture([])
      setElements([...elements, newElement])
    }
  }, [elements])

  const handleSelectElement = useCallback((id, idsArray) => {
    setSelectedId(id)
    setSelectedIds(idsArray || [])
    if (isMobile && id) {
      setSheetTab('property')
      setSheetOpen(true)
    }
  }, [isMobile])

  // T02: Delete all currently box-selected elements
  const handleDeleteSelected = useCallback(() => {
    const ids = selectedIds.length > 1 ? selectedIds : (selectedId ? [selectedId] : [])
    if (ids.length === 0) return
    // T04: Filter out locked elements — they cannot be deleted
    const lockedIds = elements.filter(el => ids.includes(el.id) && el.locked).map(el => el.id)
    const deletableIds = ids.filter(id => !lockedIds.includes(id))
    if (deletableIds.length === 0) {
      // All selected were locked — silently skip
      return
    }
    setHistory(h => [...h, [...elements]])
    setFuture([])
    setElements(prev => prev.filter(el => !deletableIds.includes(el.id)))
    setSelectedId(null)
    setSelectedIds([])
  }, [selectedIds, selectedId, elements])

  // T04: Update element (for lock toggle and future property edits)
  const handleUpdateElement = useCallback((id, updates) => {
    setHistory(h => [...h, [...elements]])
    setFuture([])
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el))
  }, [elements])

  // T13: Update a single coordinate (x1/y1/x2/y2). For lines, also recompute `length`.
  const handleUpdateCoordinate = useCallback((id, axis, value) => {
    const num = Number(value)
    if (Number.isNaN(num)) return
    setHistory(h => [...h, [...elements]])
    setFuture([])
    setElements(prev => prev.map(el => {
      if (el.id !== id) return el
      const next = { ...el, [axis]: num }
      // Recompute derived length for line elements
      if (el.type === 'line') {
        const dx = (next.x2 ?? el.x2) - (next.x1 ?? el.x1)
        const dy = (next.y2 ?? el.y2) - (next.y1 ?? el.y1)
        next.length = Math.round(Math.sqrt(dx * dx + dy * dy))
      }
      return next
    }))
  }, [elements])

  // T04: Toggle lock state of currently selected element
  const handleToggleLock = useCallback(() => {
    if (!selectedId) return
    const el = elements.find(x => x.id === selectedId)
    if (!el) return
    handleUpdateElement(selectedId, { locked: !el.locked })
  }, [selectedId, elements, handleUpdateElement])

  // T03: Align selected element(s) to canvas center (single) or distribute (multi)
  const CANVAS_CENTER_X = 500
  const CANVAS_CENTER_Y = 400
  const handleAlign = useCallback((type) => {
    const targetIds = selectedIds.length > 1 ? selectedIds : (selectedId ? [selectedId] : [])
    if (targetIds.length === 0) return
    setHistory(h => [...h, [...elements]])
    setFuture([])
    setElements(prev => prev.map(x => {
      if (!targetIds.includes(x.id)) return x
      if (type === 'centerH') {
        // Vertical center: align midpoint Y to CANVAS_CENTER_Y
        const midY = (x.y1 + x.y2) / 2
        const d = CANVAS_CENTER_Y - midY
        return { ...x, y1: x.y1 + d, y2: x.y2 + d }
      }
      if (type === 'centerV') {
        // Horizontal center: align midpoint X to CANVAS_CENTER_X
        const midX = (x.x1 + x.x2) / 2
        const d = CANVAS_CENTER_X - midX
        return { ...x, x1: x.x1 + d, x2: x.x2 + d }
      }
      if (type === 'distributeH') {
        // Equal horizontal spacing across selection (≥3 elements)
        if (targetIds.length < 3) return x
        const sorted = [...targetIds]
          .map(id => prev.find(p => p.id === id))
          .filter(Boolean)
          .sort((a, b) => ((a.x1 + a.x2) / 2) - ((b.x1 + b.x2) / 2))
        const first = sorted[0], last = sorted[sorted.length - 1]
        const firstMid = (first.x1 + first.x2) / 2
        const lastMid = (last.x1 + last.x2) / 2
        const step = (lastMid - firstMid) / (sorted.length - 1)
        const idx = sorted.findIndex(s => s.id === x.id)
        if (idx <= 0 || idx >= sorted.length - 1) return x
        const targetMid = firstMid + step * idx
        const curMid = (x.x1 + x.x2) / 2
        const d = targetMid - curMid
        return { ...x, x1: x.x1 + d, x2: x.x2 + d }
      }
      if (type === 'distributeV') {
        if (targetIds.length < 3) return x
        const sorted = [...targetIds]
          .map(id => prev.find(p => p.id === id))
          .filter(Boolean)
          .sort((a, b) => ((a.y1 + a.y2) / 2) - ((b.y1 + b.y2) / 2))
        const first = sorted[0], last = sorted[sorted.length - 1]
        const firstMid = (first.y1 + first.y2) / 2
        const lastMid = (last.y1 + last.y2) / 2
        const step = (lastMid - firstMid) / (sorted.length - 1)
        const idx = sorted.findIndex(s => s.id === x.id)
        if (idx <= 0 || idx >= sorted.length - 1) return x
        const targetMid = firstMid + step * idx
        const curMid = (x.y1 + x.y2) / 2
        const d = targetMid - curMid
        return { ...x, y1: x.y1 + d, y2: x.y2 + d }
      }
      return x
    }))
  }, [selectedId, selectedIds, elements])

  const handleUndo = useCallback(() => {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setHistory(h => h.slice(0, -1))
    setFuture(f => [...f, [...elements]])
    setElements(prev)
  }, [history, elements])

  const handleRedo = useCallback(() => {
    if (future.length === 0) return
    const next = future[future.length - 1]
    setFuture(f => f.slice(0, -1))
    setHistory(h => [...h, [...elements]])
    setElements(next)
  }, [future, elements])

  const selectedElement = elements.find(el => el.id === selectedId) || null

  const handleSave = useCallback(() => {
    const designData = {
      id: generateId(),
      name: '铝型材设计方案',
      elements,
      updatedAt: Date.now(),
    }
    saveDesign(designData)
    alert(t('saved', lang))
  }, [elements, lang])

  const handleClear = useCallback(() => {
    setHistory(h => [...h, [...elements]])
    setFuture([])
    setElements([])
    setSelectedId(null)
    setSelectedIds([])
    // T15: clearing elements also wipes the auto-saved draft
    clearDraft()
    setLastSavedAt(null)
    if (isMobile) setSheetOpen(false)
  }, [elements, isMobile])

  // T09: Load template with optional params for parameterized templates
  const handleLoadTemplate = useCallback((templateId, params = {}) => {
    const template = getTemplate(templateId)
    if (!template) return

    // Save current state to history
    setHistory(h => [...h, [...elements]])
    setFuture([])

    // Resolve template (handles parameterized templates via resolveTemplate)
    const resolved = resolveTemplate(templateId, params) || template
    const templateElements = resolved.elements || []

    // Load template elements with new IDs
    const newElements = templateElements.map(el => ({
      ...el,
      id: 'el-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
    }))

    setElements(newElements)
    setCurrentProfile(template.profile)
    setShowTemplateModal(false)
    setMode('draw')
  }, [elements])

  const toolHint =
    currentTool === 'line' ? t('hintLine', lang) :
    currentTool === 'select' ? t('hintSelect', lang) :
    currentTool === 'delete' ? t('hintDelete', lang) :
    currentTool === 'rect' ? t('hintRect', lang) : ''

  // T15: Human-readable "X 秒/分钟/小时前" relative time formatter (bilingual via lang)
  const formatDraftTime = (ts) => {
    if (!ts) return ''
    const diff = Date.now() - ts
    if (diff < 5000) return t('justNow', lang)
    if (diff < 60_000) return t('secondsAgo', lang, { n: Math.floor(diff / 1000) })
    if (diff < 3600_000) return t('minutesAgo', lang, { n: Math.floor(diff / 60_000) })
    return new Date(ts).toLocaleTimeString(lang === 'en' ? 'en-US' : 'zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  // ===== TEMPLATE MODAL =====
  // T09: Per-template parameter UI
  const [templateParams, setTemplateParams] = useState({})

  const handleSetParam = (templateId, paramKey, value) => {
    setTemplateParams(prev => ({
      ...prev,
      [templateId]: {
        ...(prev[templateId] || {}),
        [paramKey]: value,
      },
    }))
  }

  const handleApplyTemplate = (templateId, tpl) => {
    const stored = templateParams[templateId]
    // Build params object using stored values or defaults
    const paramConfig = tpl.params || {}
    const params = {}
    for (const key of Object.keys(paramConfig)) {
      params[key] = stored && stored[key] !== undefined && stored[key] !== ''
        ? Number(stored[key])
        : paramConfig[key].default
    }
    handleLoadTemplate(templateId, params)
  }

  const TemplateModal = () => (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 200,
        }}
        onClick={() => setShowTemplateModal(false)}
      />
      {/* Modal card */}
      <div
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          background: '#1A1A1F',
          border: '1px solid #2E2E38',
          borderRadius: 14,
          padding: 20,
          maxWidth: 440,
          width: '92%',
          maxHeight: '85dvh',
          overflowY: 'auto',
          zIndex: 201,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <LayoutTemplate size={20} style={{ color: '#ECECEE' }} />
          <span style={{ fontSize: 18, fontWeight: 600, color: '#ECECEE', marginLeft: 8 }}>
            {t('templateBtn', lang)}
          </span>
          <div style={{ flex: 1 }} />
          <button
            style={{ background: 'none', border: 'none', color: '#888892', cursor: 'pointer' }}
            onClick={() => setShowTemplateModal(false)}
          >
            <X size={20} />
          </button>
        </div>

        {TEMPLATE_IDS.map(id => {
          const t = TEMPLATES[id]
          const hasParams = !!t.params
          const paramEntries = hasParams ? Object.entries(t.params) : []
          return (
            <div
              key={id}
              style={{
                border: '1px solid #2E2E38',
                borderRadius: 10,
                padding: 14,
                marginBottom: 10,
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#ECECEE'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#2E2E38'}
            >
              <div style={{ fontSize: 15, fontWeight: 600, color: '#ECECEE' }}>
                {t.name}
              </div>
              <div style={{ fontSize: 12, color: '#888892', marginTop: 4 }}>
                {t.description}
              </div>
              <div style={{ fontSize: 11, color: '#555560', marginTop: 6 }}>
                {t('profile', lang)}: {t(`profile${tpl.profile}`, lang)}
              </div>

              {/* T09: Param inputs for parameterized templates */}
              {hasParams && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {paramEntries.map(([key, cfg]) => {
                    const stored = templateParams[id]?.[key]
                    const value = stored !== undefined && stored !== ''
                      ? stored
                      : String(cfg.default)
                    return (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <label style={{
                          flex: 1, fontSize: 12, color: '#888892',
                          fontFamily: '"SF Mono","Menlo",monospace',
                        }}>
                          {cfg.label}
                        </label>
                        <button
                          onClick={() => {
                            const cur = Number(value)
                            const next = Math.max(cfg.min, cur - cfg.step)
                            handleSetParam(id, key, String(next))
                          }}
                          style={{
                            background: '#111114', color: '#ECECEE',
                            border: '1px solid #2E2E38',
                            borderRadius: 6, padding: '4px 10px',
                            cursor: 'pointer', fontSize: 14,
                          }}
                        >−</button>
                        <input
                          type="number"
                          value={value}
                          min={cfg.min}
                          max={cfg.max}
                          step={cfg.step}
                          onChange={e => handleSetParam(id, key, e.target.value)}
                          style={{
                            width: 80,
                            background: '#111114',
                            color: '#ECECEE',
                            border: '1px solid #2E2E38',
                            borderRadius: 6,
                            padding: '6px 8px',
                            fontSize: 13,
                            fontFamily: '"SF Mono","Menlo",monospace',
                            textAlign: 'center',
                          }}
                        />
                        <button
                          onClick={() => {
                            const cur = Number(value)
                            const next = Math.min(cfg.max, cur + cfg.step)
                            handleSetParam(id, key, String(next))
                          }}
                          style={{
                            background: '#111114', color: '#ECECEE',
                            border: '1px solid #2E2E38',
                            borderRadius: 6, padding: '4px 10px',
                            cursor: 'pointer', fontSize: 14,
                          }}
                        >+</button>
                      </div>
                    )
                  })}
                </div>
              )}

              <button
                onClick={() => hasParams ? handleApplyTemplate(id, t) : handleLoadTemplate(id)}
                style={{
                  marginTop: 12,
                  width: '100%',
                  background: '#ECECEE', color: '#0C0C0F',
                  border: 'none', borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {hasParams ? '应用模板' : '加载模板'}
              </button>
            </div>
          )
        })}
      </div>
    </>
  )

  // ===== 3D VIEW TOP BAR =====
  const View3DTopBar = () => (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '8px 16px',
      background: '#1A1A1F',
      borderBottom: '1px solid #2E2E38',
      height: 44,
    }}>
      <Eye size={18} style={{ color: '#ECECEE' }} />
      <span style={{ fontSize: 15, fontWeight: 600, color: '#ECECEE', marginLeft: 8 }}>
        {t('preview3d', lang)}
      </span>
      <div style={{ flex: 1 }} />
      <button
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#ECECEE', color: '#0C0C0F',
          border: 'none', borderRadius: 8,
          padding: '6px 14px', fontSize: 13, fontWeight: 600,
          cursor: 'pointer',
        }}
        onClick={() => setMode('draw')}
      >
        <Pencil size={14} /> {t('editBtn', lang)}
      </button>
    </div>
  )

  // ===== DESKTOP LAYOUT =====
  if (!isMobile) {
    if (mode === 'view') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0C0C0F' }}>
          <View3DTopBar />
          <div style={{ flex: 1 }}>
            <Viewer3D elements={elements} profileSpecs={ALUMINUM_PROFILES} />
          </div>
        </div>
      )
    }

    return (
      <div className="desktop-layout">
        <Toolbar
          currentTool={currentTool}
          onToolChange={setCurrentTool}
          currentProfile={currentProfile}
          onProfileChange={setCurrentProfile}
          onUndo={handleUndo}
          onRedo={handleRedo}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          canUndo={history.length > 0}
          canRedo={future.length > 0}
          isMobile={false}
          mode={mode}
          onModeChange={setMode}
          onTemplateClick={() => setShowTemplateModal(true)}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onDuplicate={handleDuplicate}
          canCopy={!!selectedId}
          canPaste={clipboard.length > 0}
          lang={lang}
        />

        <div className="desktop-canvas-area">
          <div className="header-bar">
            <div className="header-title">{t('title', lang)}</div>
            <div className="flex-1" />
            <div className="header-stat">
              {t('elementsCount', lang)}: {elements.length}
            </div>
            {/* T17: language toggle (zh / en) */}
            <button
              className="header-btn"
              onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
              title={lang === 'zh' ? 'Switch to English' : '切换到中文'}
              style={{ fontFamily: '"SF Mono","Menlo",monospace', fontSize: 12 }}
            >
              <Globe size={16} /> {lang === 'zh' ? 'EN' : '中'}
            </button>
            <button className="header-btn" onClick={() => setShowTemplateModal(true)} title={t('templateBtn', lang)}>
              <LayoutTemplate size={16} /> {t('template', lang)}
            </button>
            <button className="header-btn header-btn-primary" onClick={handleSave}>
              <Save size={16} /> {t('save', lang)}
            </button>
            <button className="header-btn header-btn-danger" onClick={handleClear}>
              <Trash2 size={16} /> {t('clear', lang)}
            </button>
            <button className="header-btn" onClick={handleExportPNG} title={t('exportPng', lang)}>
              <ImageDown size={16} /> {t('exportPng', lang)}
            </button>
          </div>

          <div className="flex-1 relative">
            {viewMode === '2d' ? (
              <DrawingCanvas
                ref={canvasRef}
                elements={elements}
                onAddElement={handleAddElement}
                onSelectElement={handleSelectElement}
                selectedId={selectedId}
                selectedIds={selectedIds}
                currentTool={currentTool}
                currentProfile={currentProfile}
                gridSize={gridSize}
                isMobile={false}
              />
            ) : (
              <Viewer3D
                elements={elements}
                profileSpecs={ALUMINUM_PROFILES}
              />
            )}
          </div>

          <div className="status-bar">
            <span style={{ flex: 1 }}>{toolHint}</span>
            {/* T15: Auto-save status */}
            {lastSavedAt && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 12, color: '#888892',
              }} title="草稿已自动保存到本地">
                <CloudCheck size={13} style={{ color: '#4ADE80' }} />
                <span style={{ fontFamily: '"SF Mono","Menlo",monospace' }}>
                  {t('autoSavedAt', lang, { time: formatDraftTime(lastSavedAt) })}
                </span>
              </span>
            )}
            {!lastSavedAt && elements.length > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 12, color: '#888892',
              }} title="等待下次自动保存">
                <CloudOff size={13} style={{ color: '#888892' }} />
                <span style={{ fontFamily: '"SF Mono","Menlo",monospace' }}>{t('notAutoSaved', lang)}</span>
              </span>
            )}
            {/* T12: Grid size selector */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 12, color: '#888892',
            }}>
              <Grid3x3 size={13} style={{ color: '#888892' }} />
              <span style={{ fontFamily: '"SF Mono","Menlo",monospace' }}>{t('grid', lang)}</span>
              {[10, 20, 50].map(size => (
                <button
                  key={size}
                  onClick={() => setGridSize(size)}
                  style={{
                    background: gridSize === size ? '#ECECEE' : 'transparent',
                    color: gridSize === size ? '#0C0C0F' : '#888892',
                    border: '1px solid #2E2E38',
                    borderRadius: 4,
                    padding: '2px 8px',
                    fontSize: 11,
                    fontFamily: '"SF Mono","Menlo",monospace',
                    fontWeight: 600,
                    cursor: 'pointer',
                    minWidth: 32,
                  }}
                  title={`网格 ${size}px`}
                >
                  {size}
                </button>
              ))}
            </span>
          </div>
        </div>

        <div className="desktop-right-panel">
          <div style={{
            display: 'flex', alignItems: 'center',
            padding: '8px 12px',
            background: '#111114',
            borderBottom: '1px solid #2E2E38',
            gap: 8,
          }}>
            <Layers size={16} style={{ color: '#ECECEE' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#ECECEE' }}>{t('property', lang)}</span>
            {/* T02: Show selection count + delete button when multiple selected */}
            {selectedIds.length > 1 && (
              <>
                <div style={{ flex: 1 }} />
                <span style={{
                  fontSize: 12, color: '#888892',
                  background: '#1A1A1F', padding: '2px 8px',
                  borderRadius: 6, fontFamily: '"SF Mono","Menlo",monospace',
                }}>
                  {t('selectCount', lang, { n: selectedIds.length })}
                </span>
                <button
                  onClick={handleDeleteSelected}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: '#3a1f1f', color: '#FF6B6B',
                    border: '1px solid #5a2828', borderRadius: 6,
                    padding: '4px 10px', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={12} /> {t('deleteSelected', lang)}
                </button>
              </>
            )}
          </div>
          <PropertyPanel
            selectedElement={selectedElement}
            onUpdateElement={handleUpdateElement}
            onUpdateCoordinate={handleUpdateCoordinate}
            onAlign={handleAlign}
            isMobile={false}
            lang={lang}
          />
          <div style={{ borderTop: '1px solid #2E2E38' }}>
            <MaterialList elements={elements} isMobile={false} lang={lang} />
          </div>
        </div>

        {showTemplateModal && <TemplateModal />}
      </div>
    )
  }

  // ===== MOBILE LAYOUT =====
  if (mode === 'view') {
    return (
      <div className="mobile-layout">
        <div className="mobile-top-bar">
          <Eye size={18} style={{ color: '#ECECEE' }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: '#ECECEE', marginLeft: 8 }}>
            {t('preview3d', lang)}
          </span>
          <div className="flex-1" />
          <button
            className="header-btn header-btn-primary"
            onClick={() => setMode('draw')}
          >
            <Pencil size={16} /> {t('edit', lang)}
          </button>
        </div>
        <div className="mobile-canvas-area" style={{ flex: 1 }}>
          <Viewer3D elements={elements} profileSpecs={ALUMINUM_PROFILES} />
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-layout">
      <div className="mobile-top-bar">
        <div className="header-title">{t('titleMobile', lang)}</div>
        <div className="flex-1" />
        <div className="header-stat font-mono">{elements.length}</div>
        {/* T17: language toggle (mobile) */}
        <button
          className="header-btn"
          onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
          title={lang === 'zh' ? 'Switch to English' : '切换到中文'}
          style={{ fontFamily: '"SF Mono","Menlo",monospace', fontSize: 12 }}
        >
          <Globe size={16} /> {lang === 'zh' ? 'EN' : '中'}
        </button>
        <button className="header-btn" onClick={() => setShowTemplateModal(true)} title={t('template', lang)}>
          <LayoutTemplate size={16} />
        </button>
        <button className="header-btn header-btn-primary" onClick={handleSave}>
          <Save size={16} />
        </button>
        <button className="header-btn header-btn-danger" onClick={handleClear}>
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mobile-canvas-area">
        {viewMode === '2d' ? (
          <DrawingCanvas
            elements={elements}
            onAddElement={handleAddElement}
            onSelectElement={handleSelectElement}
            selectedId={selectedId}
            selectedIds={selectedIds}
            currentTool={currentTool}
            currentProfile={currentProfile}
            gridSize={gridSize}
            isMobile={true}
          />
        ) : (
          <Viewer3D
            elements={elements}
            profileSpecs={ALUMINUM_PROFILES}
          />
        )}
        <div style={{
          position: 'absolute', bottom: 8, left: 8, right: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8,
          pointerEvents: 'none',
        }}>
          <div style={{
            fontSize: 12, color: '#888892',
            background: 'rgba(26,26,31,0.85)',
            padding: '4px 8px',
            borderRadius: 6,
          }}>
            {toolHint}
          </div>
          {/* T15: Auto-save status (mobile) */}
          {lastSavedAt && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, color: '#888892',
              background: 'rgba(26,26,31,0.85)',
              padding: '4px 8px',
              borderRadius: 6,
              pointerEvents: 'auto',
            }} title="草稿已自动保存到本地">
              <CloudCheck size={12} style={{ color: '#4ADE80' }} />
              <span style={{ fontFamily: '"SF Mono","Menlo",monospace' }}>
                {formatDraftTime(lastSavedAt)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mobile-bottom-bar">
        <Toolbar
          currentTool={currentTool}
          onToolChange={setCurrentTool}
          currentProfile={currentProfile}
          onProfileChange={setCurrentProfile}
          onUndo={handleUndo}
          onRedo={handleRedo}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          canUndo={history.length > 0}
          canRedo={future.length > 0}
          isMobile={true}
          mode={mode}
          onModeChange={setMode}
          onTemplateClick={() => setShowTemplateModal(true)}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onDuplicate={handleDuplicate}
          canCopy={!!selectedId}
          canPaste={clipboard.length > 0}
          lang={lang}
        />
      </div>

      {/* Bottom Sheet */}
      <div
        className={`mobile-sheet-backdrop ${sheetOpen ? '' : 'hidden'}`}
        onClick={() => setSheetOpen(false)}
      />
      <div className={`mobile-sheet ${sheetOpen ? '' : 'hidden'}`}>
        <div className="mobile-sheet-handle" />
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            className={`header-btn ${sheetTab === 'property' ? 'header-btn-primary' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => setSheetTab('property')}
          >
            <Layers size={16} /> {t('property', lang)}
          </button>
          <button
            className={`header-btn ${sheetTab === 'material' ? 'header-btn-primary' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => setSheetTab('material')}
          >
            <ClipboardList size={16} /> {t('material', lang)}
          </button>
          <button
            className="header-btn header-btn-danger"
            onClick={() => setSheetOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        {sheetTab === 'property' ? (
          <PropertyPanel
            selectedElement={selectedElement}
            onUpdateElement={handleUpdateElement}
            onUpdateCoordinate={handleUpdateCoordinate}
            onAlign={handleAlign}
            isMobile={true}
            lang={lang}
          />
        ) : (
          <MaterialList elements={elements} isMobile={true} lang={lang} />
        )}
      </div>

      {showTemplateModal && <TemplateModal />}
    </div>
  )
}
