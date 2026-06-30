import { getProfile, getProfileName } from '../../lib/aluminum-profiles'

// 属性面板 - 显示选中图元的属性信息
export default function PropertyPanel({ selectedElement, onUpdateElement }) {
  if (!selectedElement) {
    return (
      <div className="p-4 bg-card border-l border-divider">
        <div className="text-text-secondary text-sm">未选中任何图元</div>
        <div className="text-text-secondary text-xs mt-2">点击画布上的线段以查看属性</div>
      </div>
    )
  }

  const el = selectedElement
  const profile = getProfile(el.profileSpec)

  return (
    <div className="p-4 bg-card border-l border-divider flex flex-col gap-3">
      <div className="text-accent text-sm font-bold">属性面板</div>

      {/* 图元类型 */}
      <div>
        <div className="text-xs text-text-secondary">类型</div>
        <div className="text-sm text-text">{el.type === 'line' ? '线段' : '矩形'}</div>
      </div>

      {/* 长度 */}
      {el.type === 'line' && (
        <div>
          <div className="text-xs text-text-secondary">长度</div>
          <div className="text-sm text-text">{el.length} mm ({(el.length / 1000).toFixed(2)} m)</div>
        </div>
      )}

      {/* 型材规格 */}
      <div>
        <div className="text-xs text-text-secondary">型材规格</div>
        <div className="text-sm text-text">{profile ? getProfileName(el.profileSpec) : el.profileSpec}</div>
      </div>

      {/* 截面信息 */}
      {profile && (
        <>
          <div className="border-t border-divider pt-2">
            <div className="text-xs text-text-secondary">截面尺寸</div>
            <div className="text-sm text-text">{profile.width} × {profile.height} mm</div>
          </div>
          <div>
            <div className="text-xs text-text-secondary">截面积</div>
            <div className="text-sm text-text">{profile.area} cm²</div>
          </div>
          <div>
            <div className="text-xs text-text-secondary">理论重量</div>
            <div className="text-sm text-text">{profile.weightPerMeter} kg/m</div>
          </div>
          <div>
            <div className="text-xs text-text-secondary">参考单价</div>
            <div className="text-sm text-accent">{profile.pricePerMeter} 元/m</div>
          </div>
          <div>
            <div className="text-xs text-text-secondary">单根成本估算</div>
            <div className="text-sm text-accent font-bold">
              {(el.length / 1000 * profile.pricePerMeter).toFixed(2)} 元
            </div>
          </div>
        </>
      )}

      {/* 坐标信息 */}
      {el.type === 'line' && (
        <div className="border-t border-divider pt-2">
          <div className="text-xs text-text-secondary">起点坐标</div>
          <div className="text-sm text-text">({el.x1}, {el.y1})</div>
          <div className="text-xs text-text-secondary mt-1">终点坐标</div>
          <div className="text-sm text-text">({el.x2}, {el.y2})</div>
        </div>
      )}
    </div>
  )
}
