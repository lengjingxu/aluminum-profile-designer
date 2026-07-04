import { getProfileIds, getProfile } from '../../lib/aluminum-profiles'
import { MousePointer2, Minus, Square, Trash2, Undo2, Redo2, Rotate3d, Grid3x3, Eye, LayoutTemplate, ClipboardCopy, ClipboardPaste, Copy } from 'lucide-react'

export default function Toolbar({
  currentTool, onToolChange,
  currentProfile, onProfileChange,
  onUndo, onRedo,
  viewMode, onViewModeChange,
  canUndo, canRedo,
  isMobile = false,
  mode = 'draw', onModeChange,
  onTemplateClick,
  onCopy, onPaste, onDuplicate, canCopy, canPaste,
}) {
  const tools = [
    { id: 'select', label: '选择', Icon: MousePointer2 },
    { id: 'line', label: '线段', Icon: Minus },
    { id: 'rect', label: '矩形', Icon: Square },
    { id: 'delete', label: '删除', Icon: Trash2 },
  ]

  const profileIds = getProfileIds()

  if (isMobile) {
    return (
      <>
        {tools.map(tool => (
          <button
            key={tool.id}
            className={`tool-btn ${currentTool === tool.id ? 'active' : ''}`}
            onClick={() => onToolChange(tool.id)}
            title={tool.label}
          >
            <tool.Icon size={20} />
            <span>{tool.label}</span>
          </button>
        ))}
        <button
          className={`tool-btn ${viewMode === '2d' ? 'active' : ''}`}
          onClick={() => onViewModeChange('2d')}
          title="2D视图"
        >
          <Grid3x3 size={20} />
          <span>2D</span>
        </button>
        <button
          className={`tool-btn ${viewMode === '3d' ? 'active' : ''}`}
          onClick={() => onViewModeChange('3d')}
          title="3D视图"
        >
          <Rotate3d size={20} />
          <span>3D</span>
        </button>
        {/* Preview mode switch */}
        <button
          className={`tool-btn ${mode === 'view' ? 'active' : ''}`}
          onClick={() => onModeChange && onModeChange(mode === 'view' ? 'draw' : 'view')}
          title="3D预览模式"
        >
          <Eye size={20} />
          <span>预览</span>
        </button>
        {/* Template button */}
        {onTemplateClick && (
          <button
            className="tool-btn"
            onClick={onTemplateClick}
            title="模板"
          >
            <LayoutTemplate size={20} />
            <span>模板</span>
          </button>
        )}
        <button
          className="tool-btn"
          onClick={onUndo}
          disabled={!canUndo}
          title="撤销"
          style={{ opacity: canUndo ? 1 : 0.4 }}
        >
          <Undo2 size={20} />
        </button>
        <button
          className="tool-btn"
          onClick={onRedo}
          disabled={!canRedo}
          title="重做"
          style={{ opacity: canRedo ? 1 : 0.4 }}
        >
          <Redo2 size={20} />
        </button>
        {onCopy && (
          <button
            className="tool-btn"
            onClick={onCopy}
            disabled={!canCopy}
            title="复制 (Ctrl+C)"
            style={{ opacity: canCopy ? 1 : 0.4 }}
          >
            <ClipboardCopy size={20} />
          </button>
        )}
        {onPaste && (
          <button
            className="tool-btn"
            onClick={onPaste}
            disabled={!canPaste}
            title="粘贴 (Ctrl+V)"
            style={{ opacity: canPaste ? 1 : 0.4 }}
          >
            <ClipboardPaste size={20} />
          </button>
        )}
      </>
    )
  }

  // Desktop: vertical sidebar
  return (
    <div className="desktop-toolbar">
      {tools.map(tool => (
        <button
          key={tool.id}
          className={`tool-btn ${currentTool === tool.id ? 'active' : ''}`}
          onClick={() => onToolChange(tool.id)}
          title={tool.label}
        >
          <tool.Icon size={18} />
          <span>{tool.label}</span>
        </button>
      ))}

      <div style={{ height: 1, background: '#2E2E38', margin: '4px 0' }} />

      <button
        className={`tool-btn ${viewMode === '2d' ? 'active' : ''}`}
        onClick={() => onViewModeChange('2d')}
        title="2D视图"
      >
        <Grid3x3 size={18} />
        <span>2D</span>
      </button>
      <button
        className={`tool-btn ${viewMode === '3d' ? 'active' : ''}`}
        onClick={() => onViewModeChange('3d')}
        title="3D视图"
      >
        <Rotate3d size={18} />
        <span>3D</span>
      </button>

      {/* Preview mode switch */}
      <button
        className={`tool-btn ${mode === 'view' ? 'active' : ''}`}
        onClick={() => onModeChange && onModeChange(mode === 'view' ? 'draw' : 'view')}
        title="3D预览模式"
      >
        <Eye size={18} />
        <span>预览</span>
      </button>

      {/* Template button */}
      {onTemplateClick && (
        <button
          className="tool-btn"
          onClick={onTemplateClick}
          title="选择模板"
        >
          <LayoutTemplate size={18} />
          <span>模板</span>
        </button>
      )}

      <div style={{ height: 1, background: '#2E2E38', margin: '4px 0' }} />

      <button
        className="tool-btn"
        onClick={onUndo}
        disabled={!canUndo}
        title="撤销"
        style={{ opacity: canUndo ? 1 : 0.4 }}
      >
        <Undo2 size={18} />
        <span>撤销</span>
      </button>
      <button
        className="tool-btn"
        onClick={onRedo}
        disabled={!canRedo}
        title="重做"
        style={{ opacity: canRedo ? 1 : 0.4 }}
      >
        <Redo2 size={18} />
        <span>重做</span>
      </button>

      <div style={{ height: 1, background: '#2E2E38', margin: '4px 0' }} />

      {onCopy && (
        <button
          className="tool-btn"
          onClick={onCopy}
          disabled={!canCopy}
          title="复制选中 (Ctrl+C)"
          style={{ opacity: canCopy ? 1 : 0.4 }}
        >
          <ClipboardCopy size={18} />
          <span>复制</span>
        </button>
      )}
      {onPaste && (
        <button
          className="tool-btn"
          onClick={onPaste}
          disabled={!canPaste}
          title="粘贴 (Ctrl+V)"
          style={{ opacity: canPaste ? 1 : 0.4 }}
        >
          <ClipboardPaste size={18} />
          <span>粘贴</span>
        </button>
      )}
      {onDuplicate && (
        <button
          className="tool-btn"
          onClick={onDuplicate}
          disabled={!canCopy}
          title="原地复制 (Ctrl+D)"
          style={{ opacity: canCopy ? 1 : 0.4 }}
        >
          <Copy size={18} />
          <span>副本</span>
        </button>
      )}

      <div style={{ height: 1, background: '#2E2E38', margin: '4px 0' }} />

      <select
        className="profile-select"
        value={currentProfile}
        onChange={(e) => onProfileChange(e.target.value)}
        style={{ fontSize: 11, height: 36, padding: '4px 8px' }}
      >
        {profileIds.map(id => {
          const profile = getProfile(id)
          return (
            <option key={id} value={id}>
              {profile.name}
            </option>
          )
        })}
      </select>
    </div>
  )
}
