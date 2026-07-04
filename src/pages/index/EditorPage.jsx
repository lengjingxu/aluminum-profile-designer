import { useState, useCallback, useEffect } from 'react'
import Toolbar from '../../components/toolbar/Toolbar'
import DrawingCanvas from '../../components/canvas-2d/DrawingCanvas'
import Viewer3D from '../../components/canvas-3d/Viewer3D'
import PropertyPanel from '../../components/property-panel/PropertyPanel'
import MaterialList from '../../components/material-list/MaterialList'
import { ALUMINUM_PROFILES } from '../../lib/aluminum-profiles'
import { TEMPLATES, TEMPLATE_IDS, getTemplate } from '../../lib/templates'
import { saveDesign, generateId } from '../../utils/storage'
import { Save, Trash2, Layers, ClipboardList, X, Eye, Pencil, LayoutTemplate, ArrowLeft, ClipboardCopy, ClipboardPaste, AlignCenterHorizontal, AlignCenterVertical } from 'lucide-react'

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

      if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
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
  }, [handleCopy, handlePaste, handleDuplicate, handleDeleteSelected, handleToggleLock, selectedId, selectedIds])

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
    alert('设计已保存')
  }, [elements])

  const handleClear = useCallback(() => {
    setHistory(h => [...h, [...elements]])
    setFuture([])
    setElements([])
    setSelectedId(null)
    setSelectedIds([])
    if (isMobile) setSheetOpen(false)
  }, [elements, isMobile])

  const handleLoadTemplate = useCallback((templateId) => {
    const template = getTemplate(templateId)
    if (!template) return

    // Save current state to history
    setHistory(h => [...h, [...elements]])
    setFuture([])

    // Load template elements with new IDs
    const newElements = template.elements.map(el => ({
      ...el,
      id: 'el-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
    }))

    setElements(newElements)
    setCurrentProfile(template.profile)
    setShowTemplateModal(false)
    setMode('draw')
  }, [elements])

  const toolHint =
    currentTool === 'line' ? '点击画布绘制线段起点，再次点击完成线段' :
    currentTool === 'select' ? '点击线段选中查看属性' :
    currentTool === 'delete' ? '点击线段删除' :
    currentTool === 'rect' ? '点击画布绘制矩形起点，再次点击完成矩形' : ''

  // ===== TEMPLATE MODAL =====
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
          maxWidth: 400,
          width: '90%',
          maxHeight: '80dvh',
          overflowY: 'auto',
          zIndex: 201,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <LayoutTemplate size={20} style={{ color: '#ECECEE' }} />
          <span style={{ fontSize: 18, fontWeight: 600, color: '#ECECEE', marginLeft: 8 }}>
            选择模板
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
          return (
            <div
              key={id}
              style={{
                border: '1px solid #2E2E38',
                borderRadius: 10,
                padding: 14,
                marginBottom: 10,
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
              onClick={() => handleLoadTemplate(id)}
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
                型材: {t.profile} · 图元: {t.elements.length}个
              </div>
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
        3D 预览
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
        <Pencil size={14} /> 返回编辑
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
        />

        <div className="desktop-canvas-area">
          <div className="header-bar">
            <div className="header-title">铝型材结构设计器</div>
            <div className="flex-1" />
            <div className="header-stat">
              图元数量: {elements.length}
            </div>
            <button className="header-btn" onClick={() => setShowTemplateModal(true)} title="选择模板">
              <LayoutTemplate size={16} /> 模板
            </button>
            <button className="header-btn header-btn-primary" onClick={handleSave}>
              <Save size={16} /> 保存
            </button>
            <button className="header-btn header-btn-danger" onClick={handleClear}>
              <Trash2 size={16} /> 清空
            </button>
          </div>

          <div className="flex-1 relative">
            {viewMode === '2d' ? (
              <DrawingCanvas
                elements={elements}
                onAddElement={handleAddElement}
                onSelectElement={handleSelectElement}
                selectedId={selectedId}
                selectedIds={selectedIds}
                currentTool={currentTool}
                currentProfile={currentProfile}
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
            {toolHint}
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
            <span style={{ fontSize: 13, fontWeight: 600, color: '#ECECEE' }}>属性</span>
            {/* T02: Show selection count + delete button when multiple selected */}
            {selectedIds.length > 1 && (
              <>
                <div style={{ flex: 1 }} />
                <span style={{
                  fontSize: 12, color: '#888892',
                  background: '#1A1A1F', padding: '2px 8px',
                  borderRadius: 6, fontFamily: '"SF Mono","Menlo",monospace',
                }}>
                  {selectedIds.length} 个
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
                  <Trash2 size={12} /> 删除选中
                </button>
              </>
            )}
          </div>
          <PropertyPanel
            selectedElement={selectedElement}
            onUpdateElement={handleUpdateElement}
            onAlign={handleAlign}
            isMobile={false}
          />
          <div style={{ borderTop: '1px solid #2E2E38' }}>
            <MaterialList elements={elements} isMobile={false} />
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
            3D 预览
          </span>
          <div className="flex-1" />
          <button
            className="header-btn header-btn-primary"
            onClick={() => setMode('draw')}
          >
            <Pencil size={16} /> 编辑
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
        <div className="header-title">铝型材设计器</div>
        <div className="flex-1" />
        <div className="header-stat font-mono">{elements.length}</div>
        <button className="header-btn" onClick={() => setShowTemplateModal(true)} title="模板">
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
            isMobile={true}
          />
        ) : (
          <Viewer3D
            elements={elements}
            profileSpecs={ALUMINUM_PROFILES}
          />
        )}
        <div style={{
          position: 'absolute', bottom: 8, left: 8,
          fontSize: 12, color: '#888892',
          background: 'rgba(26,26,31,0.85)',
          padding: '4px 8px',
          borderRadius: 6,
        }}>
          {toolHint}
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
            <Layers size={16} /> 属性
          </button>
          <button
            className={`header-btn ${sheetTab === 'material' ? 'header-btn-primary' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => setSheetTab('material')}
          >
            <ClipboardList size={16} /> 材料清单
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
            onAlign={handleAlign}
            isMobile={true}
          />
        ) : (
          <MaterialList elements={elements} isMobile={true} />
        )}
      </div>

      {showTemplateModal && <TemplateModal />}
    </div>
  )
}
