import { getProfile, getProfileName, getProfileIds, ALUMINUM_PROFILES } from '../../lib/aluminum-profiles'
import { Layers, Ruler, Box, MapPin, AlignCenterHorizontal, AlignCenterVertical, AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter, Lock, Unlock, Tag, TrendingUp } from 'lucide-react'
import { t } from '../../lib/i18n'

const dict = {
  zh: {
    emptyTitle: '未选中任何图元',
    emptySub: '点击画布上的线段以查看属性',
    panelTitle: '属性面板',
    type: '类型', typeLine: '线段', typeRect: '矩形',
    length: '长度',
    rectSize: '矩形尺寸（宽×高）',
    profileSpec: '型材规格',
    section: '截面尺寸',
    area: '截面积',
    weight: '理论重量',
    unitPrice: '单价',
    singleCost: '单根成本估算',
    costSimTitle: '成本模拟（相对 4040 基准）',
    base: '基准 (4040)',
    current: '当前规格',
    diff: '差异',
    startCoord: '起点坐标 (X1, Y1)',
    rectStartCoord: '对角起点 (X1, Y1)',
    endCoord: '终点坐标 (X2, Y2)',
    rectEndCoord: '对角终点 (X2, Y2)',
    coordHint: '修改坐标将自动重算线段长度',
    align: '对齐工具',
    centerH: '垂直居中', centerV: '水平居中',
    distributeH: '水平等距', distributeV: '垂直等距',
    centerHTitle: '垂直居中（画布中心 Y）',
    centerVTitle: '水平居中（画布中心 X）',
    distributeHTitle: '水平等距分布（≥3 个）',
    distributeVTitle: '垂直等距分布（≥3 个）',
    label: '文字标注',
    labelPh: '如：支撑、上轨...',
    color: '颜色',
    clear: '清除',
    clearTitle: '清除标注',
    lockTitle: '锁定状态',
    locked: '已锁定（按 L 解锁）',
    unlocked: '未锁定（按 L 锁定）',
    lockBtnLocked: '解锁此图元 (L)',
    lockBtnUnlocked: '锁定此图元 (L) — 锁定后不可移动/删除',
    lockedHint: '锁定后此图元不会被框选、移动或删除。需要先解锁才能编辑。',
  },
  en: {
    emptyTitle: 'No element selected',
    emptySub: 'Click an element on canvas to view properties',
    panelTitle: 'Properties',
    type: 'Type', typeLine: 'Line', typeRect: 'Rect',
    length: 'Length',
    rectSize: 'Rect Size (W × H)',
    profileSpec: 'Profile Spec',
    section: 'Section Size',
    area: 'Cross-section Area',
    weight: 'Theoretical Weight',
    unitPrice: 'Unit Price',
    singleCost: 'Single Piece Cost',
    costSimTitle: 'Cost Simulation (vs. 4040 baseline)',
    base: 'Baseline (4040)',
    current: 'Current',
    diff: 'Diff',
    startCoord: 'Start (X1, Y1)',
    rectStartCoord: 'Rect start (X1, Y1)',
    endCoord: 'End (X2, Y2)',
    rectEndCoord: 'Rect end (X2, Y2)',
    coordHint: 'Editing coordinates auto-recalculates line length',
    align: 'Alignment',
    centerH: 'Center Vert.', centerV: 'Center Horiz.',
    distributeH: 'Distribute H', distributeV: 'Distribute V',
    centerHTitle: 'Center vertically (canvas Y)',
    centerVTitle: 'Center horizontally (canvas X)',
    distributeHTitle: 'Distribute horizontally (≥3)',
    distributeVTitle: 'Distribute vertically (≥3)',
    label: 'Label',
    labelPh: 'e.g. support, top rail...',
    color: 'Color',
    clear: 'Clear',
    clearTitle: 'Clear label',
    lockTitle: 'Lock State',
    locked: 'Locked (press L to unlock)',
    unlocked: 'Unlocked (press L to lock)',
    lockBtnLocked: 'Unlock (L)',
    lockBtnUnlocked: 'Lock (L) — prevents move/delete',
    lockedHint: 'Locked elements cannot be box-selected, moved, or deleted. Unlock first to edit.',
  },
}

export default function PropertyPanel({ selectedElement, onUpdateElement, onUpdateCoordinate, onAlign, isMobile = false, lang = 'zh' }) {
  const D = dict[lang] || dict.zh
  if (!selectedElement) {
    return (
      <div className="panel-section" style={{ textAlign: 'center' }}>
        <Layers size={24} style={{ color: '#888892', margin: '0 auto 8px' }} />
        <div style={{ color: '#888892', fontSize: 14 }}>{D.emptyTitle}</div>
        <div style={{ color: '#888892', fontSize: 12, marginTop: 4 }}>
          {D.emptySub}
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
        <span style={{ fontSize: 14, fontWeight: 600, color: '#ECECEE' }}>{D.panelTitle}</span>
      </div>

      {/* Type */}
      <div>
        <div className="panel-label">{D.type}</div>
        <div className="panel-value">{el.type === 'line' ? D.typeLine : el.type === 'rect' ? D.typeRect : el.type}</div>
      </div>

      {/* Length */}
      <div>
        <div className="panel-label">
          <Ruler size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {D.length}
        </div>
        <div className="panel-value-mono">{el.length} mm ({(el.length / 1000).toFixed(2)} m)</div>
      </div>

      {/* Rect dimensions */}
      {el.type === 'rect' && (
        <div>
          <div className="panel-label">{D.rectSize}</div>
          <div className="panel-value-mono">
            {Math.abs(el.x2 - el.x1)} × {Math.abs(el.y2 - el.y1)} px
          </div>
        </div>
      )}

      {/* T08: Profile spec — switchable dropdown for cost simulation */}
      <div>
        <div className="panel-label">{D.profileSpec}</div>
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
                  {p.name} ({p.width}×{p.height}mm) — {p.pricePerMeter}{lang === 'en' ? '¥' : '元'}/m
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
            <div className="panel-label">{D.section}</div>
            <div className="panel-value-mono">{profile.width} × {profile.height} mm</div>
          </div>
          <div>
            <div className="panel-label">{D.area}</div>
            <div className="panel-value-mono">{profile.area} cm²</div>
          </div>
          <div>
            <div className="panel-label">{D.weight}</div>
            <div className="panel-value-mono">{profile.weightPerMeter} kg/m</div>
          </div>
          <div>
            <div className="panel-label">{D.unitPrice}</div>
            <div className="panel-value-accent">{profile.pricePerMeter} {lang === 'en' ? '¥' : '元'}/m</div>
          </div>
          <div>
            <div className="panel-label">{D.singleCost}</div>
            <div className="panel-value-accent" style={{ fontSize: 16 }}>
              {(el.length / 1000 * profile.pricePerMeter).toFixed(2)} {lang === 'en' ? '¥' : '元'}
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
        const yuan = lang === 'en' ? '¥' : '元'
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
              {D.costSimTitle}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: '#888892' }}>{D.base}</span>
              <span className="panel-value-mono">{baseCost.toFixed(2)} {yuan}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: '#888892' }}>{D.current}</span>
              <span className="panel-value-mono" style={{ color: '#ECECEE' }}>
                {currentCost.toFixed(2)} {yuan}
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
              <span style={{ color: '#888892' }}>{D.diff}</span>
              <span style={{
                fontFamily: '"SF Mono","Menlo",monospace',
                color: delta > 0 ? '#FFB36B' : delta < 0 ? '#7FE0A1' : '#ECECEE',
                fontWeight: 600,
              }}>
                {delta > 0 ? '+' : ''}{delta.toFixed(2)} {yuan} ({pct > 0 ? '+' : ''}{pct.toFixed(1)}%)
              </span>
            </div>
          </div>
        )
      })()}

      {/* T13: Editable coordinates */}
      <div style={{ borderTop: '1px solid #2E2E38', paddingTop: 10 }}>
        <div className="panel-label" style={{ marginBottom: 6 }}>
          <MapPin size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
          {el.type === 'rect' ? D.rectStartCoord : D.startCoord}
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
          {el.type === 'rect' ? D.rectEndCoord : D.endCoord}
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
            {D.coordHint}
          </div>
        )}
      </div>

      {/* T03: Alignment tools */}
      {onAlign && (
        <div style={{ borderTop: '1px solid #2E2E38', paddingTop: 10 }}>
          <div className="panel-label" style={{ marginBottom: 8 }}>{D.align}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button
              onClick={() => onAlign('centerH')}
              title={D.centerHTitle}
              style={alignBtnStyle}
            >
              <AlignCenterHorizontal size={14} />
              <span>{D.centerH}</span>
            </button>
            <button
              onClick={() => onAlign('centerV')}
              title={D.centerVTitle}
              style={alignBtnStyle}
            >
              <AlignCenterVertical size={14} />
              <span>{D.centerV}</span>
            </button>
            <button
              onClick={() => onAlign('distributeH')}
              title={D.distributeHTitle}
              style={alignBtnStyle}
            >
              <AlignHorizontalDistributeCenter size={14} />
              <span>{D.distributeH}</span>
            </button>
            <button
              onClick={() => onAlign('distributeV')}
              title={D.distributeVTitle}
              style={alignBtnStyle}
            >
              <AlignVerticalDistributeCenter size={14} />
              <span>{D.distributeV}</span>
            </button>
          </div>
        </div>
      )}

      {/* T05: Text label / annotation */}
      {onUpdateElement && (
        <div style={{ borderTop: '1px solid #2E2E38', paddingTop: 10 }}>
          <div className="panel-label" style={{ marginBottom: 8 }}>
            <Tag size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> {D.label}
          </div>
          <input
            type="text"
            placeholder={D.labelPh}
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
            <div className="panel-label" style={{ margin: 0 }}>{D.color}</div>
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
                title={D.clearTitle}
              >
                {D.clear}
              </button>
            )}
          </div>
        </div>
      )}

      {/* T04: Lock toggle */}
      {onUpdateElement && (
        <div style={{ borderTop: '1px solid #2E2E38', paddingTop: 10 }}>
          <div className="panel-label" style={{ marginBottom: 8 }}>{D.lockTitle}</div>
          <button
            onClick={() => onUpdateElement(el.id, { locked: !isLocked })}
            title={isLocked ? D.lockBtnLocked : D.lockBtnUnlocked}
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
            <span>{isLocked ? D.locked : D.unlocked}</span>
          </button>
          {isLocked && (
            <div style={{
              fontSize: 11, color: '#888892',
              marginTop: 6, lineHeight: 1.4,
            }}>
              {D.lockedHint}
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
