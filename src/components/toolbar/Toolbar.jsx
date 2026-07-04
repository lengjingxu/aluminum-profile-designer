import { getProfileIds, getProfile } from '../../lib/aluminum-profiles'
import { MousePointer2, Minus, Square, Trash2, Undo2, Redo2, Rotate3d, Grid3x3, Eye, LayoutTemplate, ClipboardCopy, ClipboardPaste, Copy } from 'lucide-react'

const dict = {
  zh: {
    select: '选择', line: '线段', rect: '矩形', delete: '删除',
    preview: '预览', template: '模板',
    undo: '撤销', redo: '重做',
    copy: '复制', paste: '粘贴', dup: '副本',
    title2d: '2D视图', title3d: '3D视图', titlePreview: '3D预览模式',
    titleCopy: '复制选中 (Ctrl+C)', titlePaste: '粘贴 (Ctrl+V)', titleDup: '原地复制 (Ctrl+D)',
    titleCopyMobile: '复制 (Ctrl+C)', titleUndo: '撤销', titleRedo: '重做',
  },
  en: {
    select: 'Select', line: 'Line', rect: 'Rect', delete: 'Delete',
    preview: 'Preview', template: 'Template',
    undo: 'Undo', redo: 'Redo',
    copy: 'Copy', paste: 'Paste', dup: 'Duplicate',
    title2d: '2D view', title3d: '3D view', titlePreview: '3D preview mode',
    titleCopy: 'Copy selection (Ctrl+C)', titlePaste: 'Paste (Ctrl+V)', titleDup: 'Duplicate (Ctrl+D)',
    titleCopyMobile: 'Copy (Ctrl+C)', titleUndo: 'Undo', titleRedo: 'Redo',
  },
}

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
  lang = 'zh',
}) {
  const D = dict[lang] || dict.zh
  const tools = [
    { id: 'select', label: D.select, Icon: MousePointer2 },
    { id: 'line', label: D.line, Icon: Minus },
    { id: 'rect', label: D.rect, Icon: Square },
    { id: 'delete', label: D.delete, Icon: Trash2 },
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
          title={D.title2d}
        >
          <Grid3x3 size={20} />
          <span>2D</span>
        </button>
        <button
          className={`tool-btn ${viewMode === '3d' ? 'active' : ''}`}
          onClick={() => onViewModeChange('3d')}
          title={D.title3d}
        >
          <Rotate3d size={20} />
          <span>3D</span>
        </button>
        {/* Preview mode switch */}
        <button
          className={`tool-btn ${mode === 'view' ? 'active' : ''}`}
          onClick={() => onModeChange && onModeChange(mode === 'view' ? 'draw' : 'view')}
          title={D.titlePreview}
        >
          <Eye size={20} />
          <span>{D.preview}</span>
        </button>
        {/* Template button */}
        {onTemplateClick && (
          <button
            className="tool-btn"
            onClick={onTemplateClick}
            title={D.template}
          >
            <LayoutTemplate size={20} />
            <span>{D.template}</span>
          </button>
        )}
        <button
          className="tool-btn"
          onClick={onUndo}
          disabled={!canUndo}
          title={D.titleUndo}
          style={{ opacity: canUndo ? 1 : 0.4 }}
        >
          <Undo2 size={20} />
        </button>
        <button
          className="tool-btn"
          onClick={onRedo}
          disabled={!canRedo}
          title={D.titleRedo}
          style={{ opacity: canRedo ? 1 : 0.4 }}
        >
          <Redo2 size={20} />
        </button>
        {onCopy && (
          <button
            className="tool-btn"
            onClick={onCopy}
            disabled={!canCopy}
            title={D.titleCopyMobile}
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
            title={D.titlePaste}
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
        title={D.title2d}
      >
        <Grid3x3 size={18} />
        <span>2D</span>
      </button>
      <button
        className={`tool-btn ${viewMode === '3d' ? 'active' : ''}`}
        onClick={() => onViewModeChange('3d')}
        title={D.title3d}
      >
        <Rotate3d size={18} />
        <span>3D</span>
      </button>

      {/* Preview mode switch */}
      <button
        className={`tool-btn ${mode === 'view' ? 'active' : ''}`}
        onClick={() => onModeChange && onModeChange(mode === 'view' ? 'draw' : 'view')}
        title={D.titlePreview}
      >
        <Eye size={18} />
        <span>{D.preview}</span>
      </button>

      {/* Template button */}
      {onTemplateClick && (
        <button
          className="tool-btn"
          onClick={onTemplateClick}
          title={D.template}
        >
          <LayoutTemplate size={18} />
          <span>{D.template}</span>
        </button>
      )}

      <div style={{ height: 1, background: '#2E2E38', margin: '4px 0' }} />

      <button
        className="tool-btn"
        onClick={onUndo}
        disabled={!canUndo}
        title={D.titleUndo}
        style={{ opacity: canUndo ? 1 : 0.4 }}
      >
        <Undo2 size={18} />
        <span>{D.undo}</span>
      </button>
      <button
        className="tool-btn"
        onClick={onRedo}
        disabled={!canRedo}
        title={D.titleRedo}
        style={{ opacity: canRedo ? 1 : 0.4 }}
      >
        <Redo2 size={18} />
        <span>{D.redo}</span>
      </button>

      <div style={{ height: 1, background: '#2E2E38', margin: '4px 0' }} />

      {onCopy && (
        <button
          className="tool-btn"
          onClick={onCopy}
          disabled={!canCopy}
          title={D.titleCopy}
          style={{ opacity: canCopy ? 1 : 0.4 }}
        >
          <ClipboardCopy size={18} />
          <span>{D.copy}</span>
        </button>
      )}
      {onPaste && (
        <button
          className="tool-btn"
          onClick={onPaste}
          disabled={!canPaste}
          title={D.titlePaste}
          style={{ opacity: canPaste ? 1 : 0.4 }}
        >
          <ClipboardPaste size={18} />
          <span>{D.paste}</span>
        </button>
      )}
      {onDuplicate && (
        <button
          className="tool-btn"
          onClick={onDuplicate}
          disabled={!canCopy}
          title={D.titleDup}
          style={{ opacity: canCopy ? 1 : 0.4 }}
        >
          <Copy size={18} />
          <span>{D.dup}</span>
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