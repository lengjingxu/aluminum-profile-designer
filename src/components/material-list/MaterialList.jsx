import { useRef } from 'react'
import { generateMaterialList } from '../../lib/calculator'
import { exportToCSV, exportDesignJSON, importDesignJSON } from '../../lib/exporter'
import { ClipboardList, Download, BarChart3, Package, Wrench, Sparkles, FileJson, Upload, AlertCircle } from 'lucide-react'

const dict = {
  zh: {
    profileStats: '型材统计',
    accessoryList: '配件清单',
    recommended: '推荐配件（按规格推荐）',
    recommendedMobile: '推荐配件（按规格）',
    costSummary: '成本汇总',
    profileCost: '型材成本',
    accessoryCost: '配件成本',
    processingFee: '加工费',
    totalCost: '总成本',
    exportCsv: '导出材料清单CSV',
    exportJson: '导出设计JSON',
    importJson: '导入JSON',
    noProfiles: '暂无型材数据',
    noAccessories: '暂无配件数据',
    spec: '规格',
    count: '数量',
    totalLen: '总长(m)',
    weight: '重量(kg)',
    price: '价格(元)',
    name: '名称',
    unit: '单价',
    subTotal: '总价',
    yuan: '元',
    importEmpty: '当前没有图元，无法导出',
    importFailed: 'JSON 导入失败',
    importConfirm: '导入将覆盖当前设计，确定继续？',
  },
  en: {
    profileStats: 'Profile Stats',
    accessoryList: 'Accessories',
    recommended: 'Recommended (per spec)',
    recommendedMobile: 'Recommended Accessories',
    costSummary: 'Cost Summary',
    profileCost: 'Profile Cost',
    accessoryCost: 'Accessory Cost',
    processingFee: 'Processing Fee',
    totalCost: 'Total Cost',
    exportCsv: 'Export CSV',
    exportJson: 'Export JSON',
    importJson: 'Import JSON',
    noProfiles: 'No profile data',
    noAccessories: 'No accessories',
    spec: 'Spec',
    count: 'Qty',
    totalLen: 'Len(m)',
    weight: 'Wt(kg)',
    price: 'Price(¥)',
    name: 'Name',
    unit: 'Unit',
    subTotal: 'Total',
    yuan: '¥',
    importEmpty: 'No elements to export',
    importFailed: 'JSON import failed',
    importConfirm: 'Importing will replace the current design. Continue?',
  },
}

export default function MaterialList({
  elements,
  isMobile = false,
  lang = 'zh',
  currentProfile = '4040',
  onImportDesign = null,
}) {
  const materialData = generateMaterialList(elements)
  const { profiles, accessories, cost } = materialData
  const hasProfiles = Object.keys(profiles).length > 0
  const hasElements = elements && elements.length > 0
  const D = dict[lang] || dict.zh
  const yuan = D.yuan

  // T19: JSON import/export
  const fileInputRef = useRef(null)
  const importErrorRef = useRef(null)

  const handleExportJSON = () => {
    if (!hasElements) {
      try { window.alert(D.importEmpty) } catch { /* ignore */ }
      return
    }
    exportDesignJSON({
      elements,
      profile: currentProfile,
      currentProfile,
    })
  }

  const handleImportClick = () => {
    if (!onImportDesign) return
    if (hasElements) {
      let ok = false
      try { ok = window.confirm(D.importConfirm) } catch { ok = false }
      if (!ok) return
    }
    if (fileInputRef.current) fileInputRef.current.click()
  }

  const handleImportChange = async (e) => {
    const file = e.target?.files?.[0]
    // Reset so the same file can be re-selected later
    if (e.target) e.target.value = ''
    if (!file || !onImportDesign) return
    try {
      const design = await importDesignJSON(file)
      onImportDesign(design)
    } catch (err) {
      const msg = (err && err.message) ? err.message : D.importFailed
      importErrorRef.current = msg
      try { window.alert(`${D.importFailed}: ${msg}`) } catch { /* ignore */ }
    }
  }

  // Render the JSON action row (used by both mobile and desktop layouts).
  const renderJsonActions = () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        className="header-btn"
        style={{ flex: 1, justifyContent: 'center' }}
        onClick={handleExportJSON}
        disabled={!hasElements}
        title={hasElements ? '' : D.importEmpty}
      >
        <FileJson size={16} /> {D.exportJson}
      </button>
      {onImportDesign && (
        <>
          <button
            className="header-btn"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={handleImportClick}
          >
            <Upload size={16} /> {D.importJson}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={handleImportChange}
          />
        </>
      )}
    </div>
  )

  // T07 推荐配件数据
  const recommendedBoltSets = accessories.recommendedBoltSets || {}
  const recommendedAngleBrackets = accessories.recommendedAngleBrackets || {}
  const recommendedSpringClips = accessories.recommendedSpringClips || {}
  const hasRecommended =
    Object.keys(recommendedBoltSets).length > 0 ||
    Object.keys(recommendedAngleBrackets).length > 0 ||
    Object.keys(recommendedSpringClips).length > 0

  const recommendedItems = [
    ...Object.values(recommendedBoltSets),
    ...Object.values(recommendedAngleBrackets),
    ...Object.values(recommendedSpringClips),
  ]

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Profile cards */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Package size={14} style={{ color: '#888892' }} />
            <span className="panel-section-title">{D.profileStats}</span>
          </div>
          {hasProfiles ? (
            Object.values(profiles).map(stat => (
              <div className="material-card" key={stat.specId}>
                <div className="material-card-header">
                  <span className="material-card-title">{stat.specId}</span>
                  <span className="material-card-cost">{stat.totalPrice.toFixed(1)} {yuan}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <div>
                    <span className="panel-label">{D.count}</span>
                    <span className="material-card-stat">{stat.count}</span>
                  </div>
                  <div>
                    <span className="panel-label">{D.totalLen}</span>
                    <span className="material-card-stat">{stat.totalLengthM.toFixed(2)} m</span>
                  </div>
                  <div>
                    <span className="panel-label">{D.weight}</span>
                    <span className="material-card-stat">{stat.totalWeightKg.toFixed(2)} kg</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: '#888892', fontSize: 14 }}>{D.noProfiles}</div>
          )}
        </div>

        {/* Accessory cards */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Wrench size={14} style={{ color: '#888892' }} />
            <span className="panel-section-title">{D.accessoryList}</span>
          </div>
          {hasProfiles ? (
            Object.values(accessories).map(acc => (
              <div className="material-card" key={acc.id}>
                <div className="material-card-header">
                  <span className="material-card-title">{acc.name}</span>
                  <span className="material-card-cost">{(acc.count * acc.pricePerUnit).toFixed(1)} {yuan}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <span className="panel-label">{D.count}</span>
                    <span className="material-card-stat">{acc.count}</span>
                  </div>
                  <div>
                    <span className="panel-label">{D.unit}</span>
                    <span className="material-card-stat">{acc.pricePerUnit} {yuan}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: '#888892', fontSize: 14 }}>{D.noAccessories}</div>
          )}
        </div>

        {/* T07 Recommended accessories (Mobile) */}
          {hasRecommended && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Sparkles size={14} style={{ color: '#888892' }} />
                <span className="panel-section-title">{D.recommendedMobile}</span>
              </div>
              {recommendedItems.map(item => (
                <div className="material-card" key={item.id}>
                  <div className="material-card-header">
                    <span className="material-card-title">{item.name}</span>
                    <span className="material-card-cost">{(item.count * item.pricePerUnit).toFixed(1)} {yuan}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <div>
                      <span className="panel-label">{D.spec}</span>
                      <span className="material-card-stat">{item.specId}</span>
                    </div>
                    <div>
                      <span className="panel-label">{D.count}</span>
                      <span className="material-card-stat">{item.count} {item.unit}</span>
                    </div>
                    <div>
                      <span className="panel-label">{D.unit}</span>
                      <span className="material-card-stat">{item.pricePerUnit} {yuan}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cost summary */}
        {hasProfiles && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <BarChart3 size={14} style={{ color: '#888892' }} />
              <span className="panel-section-title">{D.costSummary}</span>
            </div>
            <div className="material-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#888892', fontSize: 14 }}>{D.profileCost}</span>
                <span className="font-mono" style={{ color: '#ECECEE' }}>{cost.profileCost.toFixed(2)} {yuan}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#888892', fontSize: 14 }}>{D.accessoryCost}</span>
                <span className="font-mono" style={{ color: '#ECECEE' }}>{cost.accessoryCost.toFixed(2)} {yuan}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#888892', fontSize: 14 }}>{D.processingFee}({(cost.processingFeeRate * 100).toFixed(0)}%)</span>
                <span className="font-mono" style={{ color: '#ECECEE' }}>{cost.processingFee.toFixed(2)} {yuan}</span>
              </div>
              <div style={{ borderTop: '1px solid #2E2E38', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#ECECEE', fontSize: 14, fontWeight: 600 }}>{D.totalCost}</span>
                <span className="font-mono" style={{ color: '#ECECEE', fontSize: 16, fontWeight: 600 }}>{cost.totalCost.toFixed(2)} {yuan}</span>
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
            <Download size={16} /> {D.exportCsv}
          </button>
        )}

        {/* T19: JSON import/export */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {renderJsonActions()}
          {importErrorRef.current && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#FF6B6B', fontSize: 12 }}>
              <AlertCircle size={12} /> {importErrorRef.current}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Desktop: table layout
  return (
    <div className="panel-section" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <ClipboardList size={14} style={{ color: '#888892' }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#ECECEE' }}>{D.accessoryList}</span>
      </div>

      {/* Profile stats */}
      <div>
        <div className="panel-section-title">{D.profileStats}</div>
        {hasProfiles ? (
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#888892', borderBottom: '1px solid #2E2E38' }}>
                <th style={{ padding: 6, textAlign: 'left' }}>{D.spec}</th>
                <th style={{ padding: 6, textAlign: 'right' }}>{D.count}</th>
                <th style={{ padding: 6, textAlign: 'right' }}>{D.totalLen}</th>
                <th style={{ padding: 6, textAlign: 'right' }}>{D.weight}</th>
                <th style={{ padding: 6, textAlign: 'right' }}>{D.price}</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(profiles).map(stat => (
                <tr key={stat.specId} style={{ borderBottom: '1px solid rgba(46,46,56,0.3)' }}>
                  <td style={{ padding: 6, color: '#ECECEE' }}>{stat.specId}</td>
                  <td style={{ padding: 6, textAlign: 'right', color: '#ECECEE' }}>{stat.count}</td>
                  <td style={{ padding: 6, textAlign: 'right', color: '#ECECEE', fontFamily: '"SF Mono", "Menlo", monospace' }}>{stat.totalLengthM.toFixed(2)}</td>
                  <td style={{ padding: 6, textAlign: 'right', color: '#ECECEE', fontFamily: '"SF Mono", "Menlo", monospace' }}>{stat.totalWeightKg.toFixed(2)}</td>
                  <td style={{ padding: 6, textAlign: 'right', color: '#ECECEE', fontFamily: '"SF Mono", "Menlo", monospace' }}>{stat.totalPrice.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ color: '#888892', fontSize: 12 }}>{D.noProfiles}</div>
        )}
      </div>

      {/* Accessory table */}
      <div>
        <div className="panel-section-title">{D.accessoryList}</div>
        {hasProfiles ? (
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#888892', borderBottom: '1px solid #2E2E38' }}>
                <th style={{ padding: 6, textAlign: 'left' }}>{D.name}</th>
                <th style={{ padding: 6, textAlign: 'right' }}>{D.count}</th>
                <th style={{ padding: 6, textAlign: 'right' }}>{D.unit}</th>
                <th style={{ padding: 6, textAlign: 'right' }}>{D.subTotal}</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(accessories).map(acc => (
                <tr key={acc.id} style={{ borderBottom: '1px solid rgba(46,46,56,0.3)' }}>
                  <td style={{ padding: 6, color: '#ECECEE' }}>{acc.name}</td>
                  <td style={{ padding: 6, textAlign: 'right', color: '#ECECEE' }}>{acc.count}</td>
                  <td style={{ padding: 6, textAlign: 'right', color: '#ECECEE' }}>{acc.pricePerUnit} {yuan}</td>
                  <td style={{ padding: 6, textAlign: 'right', color: '#ECECEE', fontFamily: '"SF Mono", "Menlo", monospace' }}>{(acc.count * acc.pricePerUnit).toFixed(1)} {yuan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ color: '#888892', fontSize: 12 }}>{D.noAccessories}</div>
        )}
      </div>

      {/* T07 Recommended accessories (Desktop) */}
      {hasRecommended && (
        <div>
          <div className="panel-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={12} style={{ color: '#888892' }} />
            <span>{D.recommended}</span>
          </div>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#888892', borderBottom: '1px solid #2E2E38' }}>
                <th style={{ padding: 6, textAlign: 'left' }}>{D.name}</th>
                <th style={{ padding: 6, textAlign: 'left' }}>{D.spec}</th>
                <th style={{ padding: 6, textAlign: 'right' }}>{D.count}</th>
                <th style={{ padding: 6, textAlign: 'right' }}>{D.unit}</th>
                <th style={{ padding: 6, textAlign: 'right' }}>{D.subTotal}</th>
              </tr>
            </thead>
            <tbody>
              {recommendedItems.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(46,46,56,0.3)' }}>
                  <td style={{ padding: 6, color: '#ECECEE' }}>{item.name}</td>
                  <td style={{ padding: 6, color: '#888892' }}>{item.specId}</td>
                  <td style={{ padding: 6, textAlign: 'right', color: '#ECECEE' }}>{item.count} {item.unit}</td>
                  <td style={{ padding: 6, textAlign: 'right', color: '#ECECEE' }}>{item.pricePerUnit} {yuan}</td>
                  <td style={{ padding: 6, textAlign: 'right', color: '#ECECEE', fontFamily: '"SF Mono", "Menlo", monospace' }}>
                    {(item.count * item.pricePerUnit).toFixed(1)} {yuan}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cost summary */}
      {hasProfiles && (
        <div style={{ borderTop: '1px solid #2E2E38', paddingTop: 10 }}>
          <div className="panel-section-title">{D.costSummary}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ECECEE' }}>
              <span>{D.profileCost}</span>
              <span style={{ fontFamily: '"SF Mono", "Menlo", monospace' }}>{cost.profileCost.toFixed(2)} {yuan}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ECECEE' }}>
              <span>{D.accessoryCost}</span>
              <span style={{ fontFamily: '"SF Mono", "Menlo", monospace' }}>{cost.accessoryCost.toFixed(2)} {yuan}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ECECEE' }}>
              <span>{D.processingFee}({(cost.processingFeeRate * 100).toFixed(0)}%)</span>
              <span style={{ fontFamily: '"SF Mono", "Menlo", monospace' }}>{cost.processingFee.toFixed(2)} {yuan}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ECECEE', fontWeight: 600, borderTop: '1px solid #2E2E38', paddingTop: 6 }}>
              <span>{D.totalCost}</span>
              <span style={{ fontFamily: '"SF Mono", "Menlo", monospace' }}>{cost.totalCost.toFixed(2)} {yuan}</span>
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
          <Download size={16} /> {D.exportCsv}
        </button>
      )}

      {/* T19: JSON import/export */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {renderJsonActions()}
        {importErrorRef.current && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#FF6B6B', fontSize: 12 }}>
            <AlertCircle size={12} /> {importErrorRef.current}
          </div>
        )}
      </div>
    </div>
  )
}