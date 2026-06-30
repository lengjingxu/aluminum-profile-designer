import { getProfileIds, getProfile } from '../../lib/aluminum-profiles'

// 工具栏 - 工具选择、型材规格、撤销重做、视图切换
export default function Toolbar({
  currentTool, onToolChange,
  currentProfile, onProfileChange,
  onUndo, onRedo,
  viewMode, onViewModeChange,
  canUndo, canRedo,
}) {
  const tools = [
    { id: 'select', label: '选择', icon: '☝️' },
    { id: 'line', label: '线段', icon: '📏' },
    { id: 'rect', label: '矩形', icon: '▭' },
    { id: 'delete', label: '删除', icon: '🗑️' },
  ]

  const profileIds = getProfileIds()

  return (
    <div className="flex flex-col gap-3 p-3 bg-card border-r border-divider min-w-[180px]">
      {/* 工具选择 */}
      <div>
        <div className="text-xs text-text-secondary mb-2">绘图工具</div>
        <div className="flex flex-col gap-1">
          {tools.map(tool => (
            <button
              key={tool.id}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                currentTool === tool.id
                  ? 'bg-accent text-primary'
                  : 'bg-hover text-text hover:bg-accent/20'
              }`}
              onClick={() => onToolChange(tool.id)}
            >
              <span>{tool.icon}</span>
              <span>{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 型材规格选择 */}
      <div>
        <div className="text-xs text-text-secondary mb-2">型材规格</div>
        <select
          className="w-full px-3 py-2 bg-hover text-text rounded border border-divider text-sm"
          value={currentProfile}
          onChange={(e) => onProfileChange(e.target.value)}
        >
          {profileIds.map(id => {
            const profile = getProfile(id)
            return (
              <option key={id} value={id}>
                {profile.name} ({profile.width}×{profile.height}) - {profile.description}
              </option>
            )
          })}
        </select>
      </div>

      {/* 撤销/重做 */}
      <div>
        <div className="text-xs text-text-secondary mb-2">操作</div>
        <div className="flex gap-2">
          <button
            className={`flex-1 px-3 py-2 rounded text-sm ${
              canUndo ? 'bg-hover text-text hover:bg-accent/20' : 'bg-hover/50 text-text-secondary'
            }`}
            onClick={onUndo}
            disabled={!canUndo}
          >
            ↩️ 撤销
          </button>
          <button
            className={`flex-1 px-3 py-2 rounded text-sm ${
              canRedo ? 'bg-hover text-text hover:bg-accent/20' : 'bg-hover/50 text-text-secondary'
            }`}
            onClick={onRedo}
            disabled={!canRedo}
          >
            ↪️ 重做
          </button>
        </div>
      </div>

      {/* 视图切换 */}
      <div>
        <div className="text-xs text-text-secondary mb-2">视图模式</div>
        <div className="flex gap-2">
          <button
            className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
              viewMode === '2d' ? 'bg-accent text-primary' : 'bg-hover text-text hover:bg-accent/20'
            }`}
            onClick={() => onViewModeChange('2d')}
          >
            2D视图
          </button>
          <button
            className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
              viewMode === '3d' ? 'bg-accent text-primary' : 'bg-hover text-text hover:bg-accent/20'
            }`}
            onClick={() => onViewModeChange('3d')}
          >
            3D视图
          </button>
        </div>
      </div>
    </div>
  )
}
