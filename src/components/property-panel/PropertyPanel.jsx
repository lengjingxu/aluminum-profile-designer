import { getProfile, getProfileName } from '../../lib/aluminum-profiles'
import { Layers, Ruler, Box, DollarSign, MapPin } from 'lucide-react'

export default function PropertyPanel({ selectedElement, onUpdateElement, isMobile = false }) {
  if (!selectedElement) {
    return (
      <div className="panel-section" style={{ textAlign: 'center' }}>
        <Layers size={24} style={{ color: '#8888A0', margin: '0 auto 8px' }} />
        <div style={{ color: '#8888A0', fontSize: 14 }}>未选中任何图元</div>
        <div style={{ color: '#8888A0', fontSize: 12, marginTop: 4 }}>
          点击画布上的线段以查看属性
        </div>
      </div>
    )
  }

  const el = selectedElement
  const profile = getProfile(el.profileSpec)

  return (
    <div className="panel-section" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Box size={16} style={{ color: '#3B82F6' }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#3B82F6' }}>属性面板</span>
      </div>

      {/* Type */}
      <div>
        <div className="panel-label">类型</div>
        <div className="panel-value">{el.type === 'line' ? '线段' : '矩形'}</div>
      </div>

      {/* Length */}
      {el.type === 'line' && (
        <div>
          <div className="panel-label">
            <Ruler size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> 长度
          </div>
          <div className="panel-value-mono">{el.length} mm ({(el.length / 1000).toFixed(2)} m)</div>
        </div>
      )}

      {/* Profile spec */}
      <div>
        <div className="panel-label">型材规格</div>
        <div className="panel-value">{profile ? getProfileName(el.profileSpec) : el.profileSpec}</div>
      </div>

      {/* Section info */}
      {profile && (
        <>
          <div style={{ borderTop: '1px solid #2A2A3E', paddingTop: 8 }}>
            <div className="panel-label">截面尺寸</div>
            <div className="panel-value-mono">{profile.width} × {profile.height} mm</div>
          </div>
          <div>
            <div className="panel-label">截面积</div>
            <div className="panel-value-mono">{profile.area} cm²</div>
          </div>
          <div>
            <div className="panel-label">理论重量</div>
            <div className="panel-value-mono">{profile.weightPerMeter} kg/m</div>
          </div>
          <div>
            <div className="panel-label">
              <DollarSign size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> 参考单价
            </div>
            <div className="panel-value-accent">{profile.pricePerMeter} 元/m</div>
          </div>
          <div>
            <div className="panel-label">单根成本估算</div>
            <div className="panel-value-accent" style={{ fontSize: 16 }}>
              {(el.length / 1000 * profile.pricePerMeter).toFixed(2)} 元
            </div>
          </div>
        </>
      )}

      {/* Coordinates */}
      {el.type === 'line' && (
        <div style={{ borderTop: '1px solid #2A2A3E', paddingTop: 8 }}>
          <div className="panel-label">
            <MapPin size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> 起点坐标
          </div>
          <div className="panel-value-mono">({el.x1}, {el.y1})</div>
          <div className="panel-label" style={{ marginTop: 4 }}>终点坐标</div>
          <div className="panel-value-mono">({el.x2}, {el.y2})</div>
        </div>
      )}
    </div>
  )
}
