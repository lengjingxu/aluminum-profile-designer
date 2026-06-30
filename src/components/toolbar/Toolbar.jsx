import { getProfileIds, getProfile } from '../../lib/aluminum-profiles'
import { MousePointer2, Minus, Square, Trash2, Undo2, Redo2, Rotate3d, Grid3x3 } from 'lucide-react'

export default function Toolbar({
  currentTool, onToolChange,
  currentProfile, onProfileChange,
  onUndo, onRedo,
  viewMode, onViewModeChange,
  canUndo, canRedo,
  isMobile = false,
}) {
  const tools = [
    { id: 'select', label: '选择', Icon: MousePointer2 },
    { id: 'line', label: '线段', Icon: Minus },
    { id: 'rect', label: '矩形', Icon: Square },
    { id: 'delete', label: '删除', Icon: Trash2 },
  ]

  const profileIds = getProfileIds()

  if (isMobile) {
    // Mobile: horizontal bottom bar — tools only (profile in sheet)
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
          </button>
        ))}
        <button
          className={`tool-btn ${viewMode === '2d' ? 'active' : ''}`}
          onClick={() => onViewModeChange('2d')}
          title="2D视图"
        >
          <Grid3x3 size={20} />
        </button>
        <button
          className={`tool-btn ${viewMode === '3d' ? 'active' : ''}`}
          onClick={() => onViewModeChange('3d')}
          title="3D视图"
        >
          <Rotate3d size={20} />
        </button>
        <button
          className={`tool-btn ${!canUndo ? '' : ''}`}
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
      </>
    )
  }

  // Desktop: vertical sidebar with labels and profile selector
  return (
    <div className="desktop-toolbar">
      {/* Tool buttons */}
      {tools.map(tool => (
        <button
          key={tool.id}
          className={`tool-btn ${currentTool === tool.id ? 'active' : ''}`}
          onClick={() => onToolChange(tool.id)}
          title={tool.label}
        >
          <tool.Icon size={18} />
          <span style={{ fontSize: 10 }}>{tool.label}</span>
        </button>
      ))}

      {/* Divider */}
      <div style={{ height: 1, background: '#2A2A3E', margin: '4px 0' }} />

      {/* View mode */}
      <button
        className={`tool-btn ${viewMode === '2d' ? 'active' : ''}`}
        onClick={() => onViewModeChange('2d')}
        title="2D视图"
      >
        <Grid3x3 size={18} />
        <span style={{ fontSize: 10 }}>2D</span>
      </button>
      <button
        className={`tool-btn ${viewMode === '3d' ? 'active' : ''}`}
        onClick={() => onViewModeChange('3d')}
        title="3D视图"
      >
        <Rotate3d size={18} />
        <span style={{ fontSize: 10 }}>3D</span>
      </button>

      {/* Divider */}
      <div style={{ height: 1, background: '#2A2A3E', margin: '4px 0' }} />

      {/* Undo/Redo */}
      <button
        className="tool-btn"
        onClick={onUndo}
        disabled={!canUndo}
        title="撤销"
        style={{ opacity: canUndo ? 1 : 0.4 }}
      >
        <Undo2 size={18} />
        <span style={{ fontSize: 10 }}>撤销</span>
      </button>
      <button
        className="tool-btn"
        onClick={onRedo}
        disabled={!canRedo}
        title="重做"
        style={{ opacity: canRedo ? 1 : 0.4 }}
      >
        <Redo2 size={18} />
        <span style={{ fontSize: 10 }}>重做</span>
      </button>

      {/* Divider */}
      <div style={{ height: 1, background: '#2A2A3E', margin: '4px 0' }} />

      {/* Profile selector */}
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
