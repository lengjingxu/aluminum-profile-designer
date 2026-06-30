import { useState, useCallback } from 'react'
import Toolbar from '../../components/toolbar/Toolbar'
import DrawingCanvas from '../../components/canvas-2d/DrawingCanvas'
import Viewer3D from '../../components/canvas-3d/Viewer3D'
import PropertyPanel from '../../components/property-panel/PropertyPanel'
import MaterialList from '../../components/material-list/MaterialList'
import { ALUMINUM_PROFILES } from '../../lib/aluminum-profiles'
import { saveDesign, generateId } from '../../utils/storage'
import { Save, Trash2, ChevronUp, X, Layers, ClipboardList } from 'lucide-react'

export default function EditorPage({ isMobile }) {
  const [elements, setElements] = useState([])
  const [currentTool, setCurrentTool] = useState('line')
  const [currentProfile, setCurrentProfile] = useState('4040')
  const [selectedId, setSelectedId] = useState(null)
  const [viewMode, setViewMode] = useState('2d')
  const [history, setHistory] = useState([])
  const [future, setFuture] = useState([])
  const [sheetOpen, setSheetOpen] = useState(false) // mobile bottom sheet
  const [sheetTab, setSheetTab] = useState('property') // 'property' | 'material'

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

  const handleSelectElement = useCallback((id) => {
    setSelectedId(id)
    if (isMobile && id) {
      setSheetTab('property')
      setSheetOpen(true)
    }
  }, [isMobile])

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
    alert('设计已保存!')
  }, [elements])

  const handleClear = useCallback(() => {
    setHistory(h => [...h, [...elements]])
    setFuture([])
    setElements([])
    setSelectedId(null)
    if (isMobile) setSheetOpen(false)
  }, [elements, isMobile])

  // Tool hint text
  const toolHint =
    currentTool === 'line' ? '点击画布绘制线段起点，再次点击完成线段' :
    currentTool === 'select' ? '点击线段选中查看属性' :
    currentTool === 'delete' ? '点击线段删除' :
    currentTool === 'rect' ? '矩形工具开发中...' : ''

  // ===== DESKTOP LAYOUT =====
  if (!isMobile) {
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
        />

        <div className="desktop-canvas-area">
          <div className="header-bar">
            <div className="header-title">铝型材结构设计器</div>
            <div className="flex-1" />
            <div className="header-stat">
              图元数量: {elements.length}
            </div>
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
          <PropertyPanel
            selectedElement={selectedElement}
            onUpdateElement={() => {}}
            isMobile={false}
          />
          <div style={{ borderTop: '1px solid #2A2A3E' }}>
            <MaterialList elements={elements} isMobile={false} />
          </div>
        </div>
      </div>
    )
  }

  // ===== MOBILE LAYOUT =====
  return (
    <div className="mobile-layout">
      {/* Top bar */}
      <div className="mobile-top-bar">
        <div className="header-title">铝型材设计器</div>
        <div className="flex-1" />
        <div className="header-stat font-mono-val">{elements.length}</div>
        <button className="header-btn header-btn-primary" onClick={handleSave}>
          <Save size={16} />
        </button>
        <button className="header-btn header-btn-danger" onClick={handleClear}>
          <Trash2 size={16} />
        </button>
      </div>

      {/* Canvas */}
      <div className="mobile-canvas-area">
        {viewMode === '2d' ? (
          <DrawingCanvas
            elements={elements}
            onAddElement={handleAddElement}
            onSelectElement={handleSelectElement}
            selectedId={selectedId}
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
        {/* Hint overlay */}
        <div style={{
          position: 'absolute', bottom: 8, left: 8,
          fontSize: 12, color: '#8888A0',
          background: 'rgba(20,20,31,0.8)',
          padding: '4px 8px',
          borderRadius: 6,
        }}>
          {toolHint}
        </div>
      </div>

      {/* Bottom toolbar */}
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
        />

        {/* Sheet trigger buttons */}
        <button
          className="tool-btn"
          onClick={() => { setSheetTab('property'); setSheetOpen(true) }}
          title="属性"
        >
          <Layers size={20} />
        </button>
        <button
          className="tool-btn"
          onClick={() => { setSheetTab('material'); setSheetOpen(true) }}
          title="材料清单"
        >
          <ClipboardList size={20} />
        </button>
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
            onUpdateElement={() => {}}
            isMobile={true}
          />
        ) : (
          <MaterialList elements={elements} isMobile={true} />
        )}
      </div>
    </div>
  )
}
