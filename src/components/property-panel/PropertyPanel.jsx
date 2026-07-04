import { getProfile, getProfileName, getProfileIds, ALUMINUM_PROFILES } from '../../lib/aluminum-profiles'
import { Layers, Ruler, Box, MapPin, AlignCenterHorizontal, AlignCenterVertical, AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter, Lock, Unlock, Tag, TrendingUp } from 'lucide-react'

export default function PropertyPanel({ selectedElement, onUpdateElement, onUpdateCoordinate, onAlign, isMobile = false }) {
  if (!selectedElement) {
    return (
      <div className="panel-section" style={{ textAlign: 'center' }}>
        <Layers size={24} style={{ color: '#888892', margin: '0 auto 8px' }} />
        <div style={{ color: '#888892', fontSize: 14 }}>未选中任何图元</div>
        <div style={{ color: '#888892', fontSize: 12, marginTop: 4 }}>
          点击画布上的线段以查看属性
        </div>
      </div>
    )
  }

  const el = selectedElement
  const profile = getProfile(el.profileSpec)
  const isLocked = !!el.locked

  return (
    <div className="panel-section" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Box size={16} style={{ color: '#ECECEE' }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#ECECEE' }}>属性面板</span>
      </div>

      {/* Type */}
      <div>
        <div className="panel-label">类型</div>
        <div className="panel-value">{el.type === 'line' ? '线段' : el.type === 'rect' ? '矩形' : el.type}</div>
      </div>

      {/* Length */}
      <div>
        <div className="panel-label">
          <Ruler size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> 长度
        </div>
        <div className="panel-value-mono">{el.length} mm ({(el.length / 1000).toFixed(2)} m)</div>
      </div>

      {/* Rect dimensions */}
      {el.type === 'rect' && (
        <div>
          <div className="panel-label">矩形尺寸（宽×高）</div>
          <div className="panel-value-mono">
            {Math.abs(el.x2 - el.x1)} × {Math.abs(el.y2 - el.y1)} px
          </div>
        </div>
      )}

      {/* T08: Profile spec — switchable dropdown for cost simulation */}
      <div>
        <div className="panel-label">型材规格</div>
        {onUpdateElement ? (
          <select
            value={el.profileSpec || '4040'}
            onChange={e => onUpdateElement(el.id, { profileSpec: e.target.value })}
            style={{
              width: '100%',
              background: '#111114',
              border: '1px solid #2E2E38',
              borderRadius: 6,
              padding: '6px 8px',
              color: '#ECECEE',
              fontSize: 13,
              fontFamily: 'inherit',
              outline: 'none',
              cursor: 'pointer',
              boxSizing: 'border-box',
            }}
          >
            {getProfileIds().map(id => {
              const p = ALUMINUM_PROFILES[id]
              return (
                <option key={id} value={id}>
                  {p.name} ({p.width}×{p.height}mm) — {p.pricePerMeter}元/m
                </option>
              )
            })}
          </select>
        ) : (
          <div className="panel-value">{profile ? getProfileName(el.profileSpec) : el.profileSpec}</div>
        )}
      </div>

      {/* Section info */}
      {profile && (
        <>
          <div style={{ borderTop: '1px solid #2E2E38', paddingTop: 10 }}>
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
            <div className="panel-label">单价</div>
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

      {/* T08: Cost simulation — show delta vs. 4040 baseline */}
      {onUpdateElement && el.type === 'line' && (() => {
        const baseProfile = ALUMINUM_PROFILES['4040']
        const currentProfile = profile
        if (!currentProfile || !baseProfile) return null
        const currentCost = (el.length / 1000) * currentProfile.pricePerMeter
        const baseCost = (el.length / 1000) * baseProfile.pricePerMeter
        const delta = currentCost - baseCost
        const pct = baseCost > 0 ? (delta / baseCost) * 100 : 0
        return (
          <div style={{
            borderTop: '1px solid #2E2E38',
            paddingTop: 10,
            background: '#111114',
            border: '1px solid #2E2E38',
            borderRadius: 6,
            padding: 10,
          }}>
            <div className="panel-label" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <TrendingUp size={12} style={{ verticalAlign: 'middle' }} />
              成本模拟（相对 4040 基准）
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: '#888892' }}>基准 (4040)</span>
              <span className="panel-value-mono">{baseCost.toFixed(2)} 元</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: '#888892' }}>当前规格</span>
              <span className="panel-value-mono" style={{ color: '#ECECEE' }}>
                {currentCost.toFixed(2)} 元
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 13,
              borderTop: '1px solid #2E2E38',
              paddingTop: 6,
              marginTop: 4,
            }}>
              <span style={{ color: '#888892' }}>差异</span>
              <span style={{
                fontFamily: '"SF Mono","Menlo",monospace',
                color: delta > 0 ? '#FFB36B' : delta < 0 ? '#7FE0A1' : '#ECECEE',
                fontWeight: 600,
              }}>
                {delta > 0 ? '+' : ''}{delta.toFixed(2)} 元 ({pct > 0 ? '+' : ''}{pct.toFixed(1)}%)
              </span>
            </div>
          </div>
        )
      })()}

      {/* T13: Editable coordinates */}
      <div style={{ borderTop: '1px solid #2E2E38', paddingTop: 10 }}>
        <div className="panel-label" style={{ marginBottom: 6 }}>
          <MapPin size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
          {el.type === 'rect' ? '对角起点 (X1, Y1)' : '起点坐标 (X1, Y1)'}
        </div>
        {onUpdateCoordinate ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div className="panel-label" style={{ fontSize: 10, marginBottom: 2 }}>X1</div>
              <input
                type="number"
                className="panel-value-mono"
                style={coordInputStyle}
                value={el.x1}
                onChange={e => onUpdateCoordinate(el.id, 'x1', e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className="panel-label" style={{ fontSize: 10, marginBottom: 2 }}>Y1</div>
              <input
                type="number"
                className="panel-value-mono"
                style={coordInputStyle}
                value={el.y1}
                onChange={e => onUpdateCoordinate(el.id, 'y1', e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="panel-value-mono">({el.x1}, {el.y1})</div>
        )}

        <div className="panel-label" style={{ marginTop: 10, marginBottom: 6 }}>
          {el.type === 'rect' ? '对角终点 (X2, Y2)' : '终点坐标 (X2, Y2)'}
        </div>
        {onUpdateCoordinate ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div className="panel-label" style={{ fontSize: 10, marginBottom: 2 }}>X2</div>
              <input
                type="number"
                className="panel-value-mono"
                style={coordInputStyle}
                value={el.x2}
                onChange={e => onUpdateCoordinate(el.id, 'x2', e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className="panel-label" style={{ fontSize: 10, marginBottom: 2 }}>Y2</div>
              <input
                type="number"
                className="panel-value-mono"
                style={coordInputStyle}
                value={el.y2}
                onChange={e => onUpdateCoordinate(el.id, 'y2', e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="panel-value-mono">({el.x2}, {el.y2})</div>
        )}
        {onUpdateCoordinate && el.type === 'line' && (
          <div style={{ fontSize: 10, color: '#555560', marginTop: 6, lineHeight: 1.4 }}>
            修改坐标将自动重算线段长度
          </div>
        )}
      </div>

      {/* T03: Alignment tools */}
      {onAlign && (
        <div style={{ borderTop: '1px solid #2E2E38', paddingTop: 10 }}>
          <div className="panel-label" style={{ marginBottom: 8 }}>对齐工具</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button
              onClick={() => onAlign('centerH')}
              title="垂直居中（画布中心 Y）"
              style={alignBtnStyle}
            >
              <AlignCenterHorizontal size={14} />
              <span>垂直居中</span>
            </button>
            <button
              onClick={() => onAlign('centerV')}
              title="水平居中（画布中心 X）"
              style={alignBtnStyle}
            >
              <AlignCenterVertical size={14} />
              <span>水平居中</span>
            </button>
            <button
              onClick={() => onAlign('distributeH')}
              title="水平等距分布（≥3 个）"
              style={alignBtnStyle}
            >
              <AlignHorizontalDistributeCenter size={14} />
              <span>水平等距</span>
            </button>
            <button
              onClick={() => onAlign('distributeV')}
              title="垂直等距分布（≥3 个）"
              style={alignBtnStyle}
            >
              <AlignVerticalDistributeCenter size={14} />
              <span>垂直等距</span>
            </button>
          </div>
        </div>
      )}

      {/* T05: Text label / annotation */}
      {onUpdateElement && (
        <div style={{ borderTop: '1px solid #2E2E38', paddingTop: 10 }}>
          <div className="panel-label" style={{ marginBottom: 8 }}>
            <Tag size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> 文字标注
          </div>
          <input
            type="text"
            placeholder="如：支撑、上轨..."
            value={el.label || ''}
            onChange={e => onUpdateElement(el.id, { label: e.target.value })}
            maxLength={24}
            style={{
              width: '100%',
              background: '#111114',
              border: '1px solid #2E2E38',
              borderRadius: 6,
              padding: '6px 8px',
              color: '#ECECEE',
              fontSize: 13,
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <div className="panel-label" style={{ margin: 0 }}>颜色</div>
            <input
              type="color"
              value={el.labelColor || '#888892'}
              onChange={e => onUpdateElement(el.id, { labelColor: e.target.value })}
              style={{
                width: 32,
                height: 24,
                border: '1px solid #2E2E38',
                borderRadius: 4,
                background: 'transparent',
                cursor: 'pointer',
                padding: 0,
              }}
            />
            <span style={{ fontSize: 11, color: '#888892', fontFamily: '"SF Mono","Menlo",monospace' }}>
              {el.labelColor || '#888892'}
            </span>
            {el.label && (
              <button
                onClick={() => onUpdateElement(el.id, { label: '', labelColor: '#888892' })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#888892',
                  cursor: 'pointer',
                  fontSize: 11,
                  padding: '0 4px',
                  marginLeft: 'auto',
                }}
                title="清除标注"
              >
                清除
              </button>
            )}
          </div>
        </div>
      )}

      {/* T04: Lock toggle */}
      {onUpdateElement && (
        <div style={{ borderTop: '1px solid #2E2E38', paddingTop: 10 }}>
          <div className="panel-label" style={{ marginBottom: 8 }}>锁定状态</div>
          <button
            onClick={() => onUpdateElement(el.id, { locked: !isLocked })}
            title={isLocked ? '解锁此图元 (L)' : '锁定此图元 (L) — 锁定后不可移动/删除'}
            style={{
              ...alignBtnStyle,
              width: '100%',
              gap: 8,
              padding: '8px 12px',
              background: isLocked ? '#3a3a1f' : '#1A1A1F',
              color: isLocked ? '#FFD56B' : '#ECECEE',
              border: isLocked ? '1px solid #5a5a28' : '1px solid #2E2E38',
            }}
          >
            {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
            <span>{isLocked ? '已锁定（按 L 解锁）' : '未锁定（按 L 锁定）'}</span>
          </button>
          {isLocked && (
            <div style={{
              fontSize: 11, color: '#888892',
              marginTop: 6, lineHeight: 1.4,
            }}>
              锁定后此图元不会被框选、移动或删除。需要先解锁才能编辑。
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const alignBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  background: '#1A1A1F',
  color: '#ECECEE',
  border: '1px solid #2E2E38',
  borderRadius: 6,
  padding: '6px 8px',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
}

// T13: shared style for coordinate input fields
const coordInputStyle = {
  background: '#111114',
  border: '1px solid #2E2E38',
  borderRadius: 6,
  padding: '4px 8px',
  width: '100%',
  color: '#ECECEE',
  fontSize: 12,
  fontFamily: '"SF Mono","Menlo",monospace',
  outline: 'none',
  boxSizing: 'border-box',
}
