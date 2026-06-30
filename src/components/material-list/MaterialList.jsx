import { generateMaterialList } from '../../lib/calculator'
import { exportToCSV } from '../../lib/exporter'
import { ClipboardList, Download, BarChart3, Package, Wrench, DollarSign } from 'lucide-react'

export default function MaterialList({ elements, isMobile = false }) {
  const materialData = generateMaterialList(elements)
  const { profiles, accessories, cost } = materialData
  const hasProfiles = Object.keys(profiles).length > 0

  if (isMobile) {
    // Mobile: card-based layout
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Profile cards */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Package size={14} style={{ color: '#3B82F6' }} />
            <span className="panel-section-title">型材统计</span>
          </div>
          {hasProfiles ? (
            Object.values(profiles).map(stat => (
              <div className="material-card" key={stat.specId}>
                <div className="material-card-header">
                  <span className="material-card-title">{stat.specId}</span>
                  <span className="material-card-cost">{stat.totalPrice.toFixed(1)} 元</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                  <div>
                    <span className="panel-label">数量</span>
                    <span className="material-card-stat">{stat.count}</span>
                  </div>
                  <div>
                    <span className="panel-label">总长</span>
                    <span className="material-card-stat">{stat.totalLengthM.toFixed(2)} m</span>
                  </div>
                  <div>
                    <span className="panel-label">重量</span>
                    <span className="material-card-stat">{stat.totalWeightKg.toFixed(2)} kg</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: '#8888A0', fontSize: 14 }}>暂无型材数据</div>
          )}
        </div>

        {/* Accessory cards */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Wrench size={14} style={{ color: '#3B82F6' }} />
            <span className="panel-section-title">配件清单</span>
          </div>
          {hasProfiles ? (
            Object.values(accessories).map(acc => (
              <div className="material-card" key={acc.id}>
                <div className="material-card-header">
                  <span className="material-card-title">{acc.name}</span>
                  <span className="material-card-cost">{(acc.count * acc.pricePerUnit).toFixed(1)} 元</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  <div>
                    <span className="panel-label">数量</span>
                    <span className="material-card-stat">{acc.count}</span>
                  </div>
                  <div>
                    <span className="panel-label">单价</span>
                    <span className="material-card-stat">{acc.pricePerUnit} 元</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: '#8888A0', fontSize: 14 }}>暂无配件数据</div>
          )}
        </div>

        {/* Cost summary */}
        {hasProfiles && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <BarChart3 size={14} style={{ color: '#3B82F6' }} />
              <span className="panel-section-title">成本汇总</span>
            </div>
            <div className="material-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#8888A0', fontSize: 14 }}>型材成本</span>
                <span className="font-mono-val" style={{ color: '#F0F0F5' }}>{cost.profileCost.toFixed(2)} 元</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#8888A0', fontSize: 14 }}>配件成本</span>
                <span className="font-mono-val" style={{ color: '#F0F0F5' }}>{cost.accessoryCost.toFixed(2)} 元</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#8888A0', fontSize: 14 }}>加工费({(cost.processingFeeRate * 100).toFixed(0)}%)</span>
                <span className="font-mono-val" style={{ color: '#F0F0F5' }}>{cost.processingFee.toFixed(2)} 元</span>
              </div>
              <div style={{ borderTop: '1px solid #2A2A3E', paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#3B82F6', fontSize: 14, fontWeight: 600 }}>总成本</span>
                <span className="font-mono-val" style={{ color: '#3B82F6', fontSize: 16, fontWeight: 600 }}>{cost.totalCost.toFixed(2)} 元</span>
              </div>
            </div>
          </div>
        )}

        {/* Export */}
        {hasProfiles && (
          <button
            className="header-btn header-btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => exportToCSV(materialData)}
          >
            <Download size={16} /> 导出材料清单CSV
          </button>
        )}
      </div>
    )
  }

  // Desktop: table layout
  return (
    <div className="panel-section" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <ClipboardList size={14} style={{ color: '#3B82F6' }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#3B82F6' }}>材料清单</span>
      </div>

      {/* Profile stats */}
      <div>
        <div className="panel-section-title">型材统计</div>
        {hasProfiles ? (
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#8888A0', borderBottom: '1px solid #2A2A3E' }}>
                <th style={{ padding: 4, textAlign: 'left' }}>规格</th>
                <th style={{ padding: 4, textAlign: 'right' }}>数量</th>
                <th style={{ padding: 4, textAlign: 'right' }}>总长(m)</th>
                <th style={{ padding: 4, textAlign: 'right' }}>重量(kg)</th>
                <th style={{ padding: 4, textAlign: 'right' }}>价格(元)</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(profiles).map(stat => (
                <tr key={stat.specId} style={{ borderBottom: '1px solid rgba(42,42,62,0.3)' }}>
                  <td style={{ padding: 4, color: '#F0F0F5' }}>{stat.specId}</td>
                  <td style={{ padding: 4, textAlign: 'right', color: '#F0F0F5' }}>{stat.count}</td>
                  <td style={{ padding: 4, textAlign: 'right', color: '#F0F0F5', fontFamily: '"SF Mono", "Menlo", monospace' }}>{stat.totalLengthM.toFixed(2)}</td>
                  <td style={{ padding: 4, textAlign: 'right', color: '#F0F0F5', fontFamily: '"SF Mono", "Menlo", monospace' }}>{stat.totalWeightKg.toFixed(2)}</td>
                  <td style={{ padding: 4, textAlign: 'right', color: '#3B82F6', fontFamily: '"SF Mono", "Menlo", monospace' }}>{stat.totalPrice.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ color: '#8888A0', fontSize: 12 }}>暂无型材数据</div>
        )}
      </div>

      {/* Accessory table */}
      <div>
        <div className="panel-section-title">配件清单</div>
        {hasProfiles ? (
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#8888A0', borderBottom: '1px solid #2A2A3E' }}>
                <th style={{ padding: 4, textAlign: 'left' }}>名称</th>
                <th style={{ padding: 4, textAlign: 'right' }}>数量</th>
                <th style={{ padding: 4, textAlign: 'right' }}>单价</th>
                <th style={{ padding: 4, textAlign: 'right' }}>总价</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(accessories).map(acc => (
                <tr key={acc.id} style={{ borderBottom: '1px solid rgba(42,42,62,0.3)' }}>
                  <td style={{ padding: 4, color: '#F0F0F5' }}>{acc.name}</td>
                  <td style={{ padding: 4, textAlign: 'right', color: '#F0F0F5' }}>{acc.count}</td>
                  <td style={{ padding: 4, textAlign: 'right', color: '#F0F0F5' }}>{acc.pricePerUnit}元</td>
                  <td style={{ padding: 4, textAlign: 'right', color: '#3B82F6', fontFamily: '"SF Mono", "Menlo", monospace' }}>{(acc.count * acc.pricePerUnit).toFixed(1)}元</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ color: '#8888A0', fontSize: 12 }}>暂无配件数据</div>
        )}
      </div>

      {/* Cost summary */}
      {hasProfiles && (
        <div style={{ borderTop: '1px solid #2A2A3E', paddingTop: 8 }}>
          <div className="panel-section-title">成本汇总</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#F0F0F5' }}>
              <span>型材成本</span>
              <span style={{ fontFamily: '"SF Mono", "Menlo", monospace' }}>{cost.profileCost.toFixed(2)} 元</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#F0F0F5' }}>
              <span>配件成本</span>
              <span style={{ fontFamily: '"SF Mono", "Menlo", monospace' }}>{cost.accessoryCost.toFixed(2)} 元</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#F0F0F5' }}>
              <span>加工费({(cost.processingFeeRate * 100).toFixed(0)}%)</span>
              <span style={{ fontFamily: '"SF Mono", "Menlo", monospace' }}>{cost.processingFee.toFixed(2)} 元</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3B82F6', fontWeight: 600, borderTop: '1px solid #2A2A3E', paddingTop: 4 }}>
              <span>总成本</span>
              <span style={{ fontFamily: '"SF Mono", "Menlo", monospace' }}>{cost.totalCost.toFixed(2)} 元</span>
            </div>
          </div>
        </div>
      )}

      {/* Export */}
      {hasProfiles && (
        <button
          className="header-btn header-btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => exportToCSV(materialData)}
        >
          <Download size={16} /> 导出材料清单CSV
        </button>
      )}
    </div>
  )
}
