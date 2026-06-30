import { useState, useCallback } from 'react'
import Toolbar from '../../components/toolbar/Toolbar'
import DrawingCanvas from '../../components/canvas-2d/DrawingCanvas'
import Viewer3D from '../../components/canvas-3d/Viewer3D'
import PropertyPanel from '../../components/property-panel/PropertyPanel'
import MaterialList from '../../components/material-list/MaterialList'
import { ALUMINUM_PROFILES } from '../../lib/aluminum-profiles'
import { saveDesign, generateId } from '../../utils/storage'

// 主编辑页面 - 左侧工具栏 + 中间画布 + 右侧属性面板和材料清单
export default function EditorPage() {
  // 状态管理
  const [elements, setElements] = useState([])           // 图元列表
  const [currentTool, setCurrentTool] = useState('line') // 当前工具
  const [currentProfile, setCurrentProfile] = useState('4040') // 当前型材规格
  const [selectedId, setSelectedId] = useState(null)     // 选中图元ID
  const [viewMode, setViewMode] = useState('2d')         // 2D/3D视图切换
  const [history, setHistory] = useState([])              // 撤销历史
  const [future, setFuture] = useState([])                // 重做历史

  // 添加或删除图元
  const handleAddElement = useCallback((newElement, deleteId) => {
    if (deleteId) {
      // 删除操作
      const prev = [...elements]
      setHistory(h => [...h, prev])
      setFuture([])
      setElements(elements.filter(el => el.id !== deleteId))
    } else if (newElement) {
      // 添加操作
      const prev = [...elements]
      setHistory(h => [...h, prev])
      setFuture([])
      setElements([...elements, newElement])
    }
  }, [elements])

  // 选中图元
  const handleSelectElement = useCallback((id) => {
    setSelectedId(id)
  }, [])

  // 撤销
  const handleUndo = useCallback(() => {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setHistory(h => h.slice(0, -1))
    setFuture(f => [...f, [...elements]])
    setElements(prev)
  }, [history, elements])

  // 重做
  const handleRedo = useCallback(() => {
    if (future.length === 0) return
    const next = future[future.length - 1]
    setFuture(f => f.slice(0, -1))
    setHistory(h => [...h, [...elements]])
    setElements(next)
  }, [future, elements])

  // 获取选中图元
  const selectedElement = elements.find(el => el.id === selectedId) || null

  // 保存设计
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

  // 清空画布
  const handleClear = useCallback(() => {
    setHistory(h => [...h, [...elements]])
    setFuture([])
    setElements([])
    setSelectedId(null)
  }, [elements])

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* 左侧：工具栏 */}
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
      />

      {/* 中间：画布区域 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部操作栏 */}
        <div className="flex items-center gap-3 px-4 py-2 bg-card border-b border-divider">
          <div className="text-accent font-bold text-lg">铝型材结构设计器</div>
          <div className="flex-1" />
          <div className="text-xs text-text-secondary">
            图元数量: {elements.length}
          </div>
          <button
            className="px-3 py-1 bg-accent/20 text-accent rounded text-sm hover:bg-accent/30"
            onClick={handleSave}
          >
            💾 保存
          </button>
          <button
            className="px-3 py-1 bg-warning/20 text-warning rounded text-sm hover:bg-warning/30"
            onClick={handleClear}
          >
            🗑️ 清空
          </button>
        </div>

        {/* 画布 */}
        <div className="flex-1 relative">
          {viewMode === '2d' ? (
            <DrawingCanvas
              elements={elements}
              onAddElement={handleAddElement}
              onSelectElement={handleSelectElement}
              selectedId={selectedId}
              currentTool={currentTool}
              currentProfile={currentProfile}
            />
          ) : (
            <Viewer3D
              elements={elements}
              profileSpecs={ALUMINUM_PROFILES}
            />
          )}
        </div>

        {/* 底部提示 */}
        <div className="px-4 py-1 bg-card border-t border-divider text-xs text-text-secondary">
          {currentTool === 'line' && '💡 点击画布绘制线段起点，再次点击完成线段'}
          {currentTool === 'select' && '💡 点击线段选中查看属性'}
          {currentTool === 'delete' && '💡 点击线段删除'}
          {currentTool === 'rect' && '💡 矩形工具开发中...'}
        </div>
      </div>

      {/* 右侧：属性面板 + 材料清单 */}
      <div className="w-[280px] flex flex-col border-l border-divider overflow-y-auto">
        <PropertyPanel
          selectedElement={selectedElement}
          onUpdateElement={() => {}}
        />
        <div className="border-t border-divider">
          <MaterialList elements={elements} />
        </div>
      </div>
    </div>
  )
}
