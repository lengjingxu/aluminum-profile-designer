// 导出功能 - JSON/CSV导出

// 导出设计数据为JSON
export function exportToJSON(designData) {
  const jsonStr = JSON.stringify(designData, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${designData.name || 'design'}.json`
  link.click()

  URL.revokeObjectURL(url)
}

// 导出材料清单为CSV
export function exportToCSV(materialList) {
  const rows = []

  // 型材清单
  rows.push(['=== 型材清单 ==='])
  rows.push(['规格', '名称', '数量', '总长度(m)', '总重量(kg)', '总价(元)'])
  Object.values(materialList.profiles).forEach(stat => {
    rows.push([
      stat.specId, stat.name, stat.count,
      stat.totalLengthM.toFixed(2),
      stat.totalWeightKg.toFixed(2),
      stat.totalPrice.toFixed(2),
    ])
  })

  // 配件清单
  rows.push([])
  rows.push(['=== 配件清单 ==='])
  rows.push(['类型', '名称', '数量', '单价(元)', '总价(元)'])
  Object.values(materialList.accessories).forEach(acc => {
    // T07 跳过非配件条目（推荐的按规格分组数据是对象，不是单个配件）
    if (typeof acc.count !== 'number') return
    rows.push([
      acc.id, acc.name, acc.count,
      acc.pricePerUnit.toFixed(2),
      (acc.count * acc.pricePerUnit).toFixed(2),
    ])
  })

  // T07 推荐配件清单（按规格）
  const recommendedItems = [
    ...Object.values(materialList.accessories.recommendedBoltSets || {}),
    ...Object.values(materialList.accessories.recommendedAngleBrackets || {}),
    ...Object.values(materialList.accessories.recommendedSpringClips || {}),
  ]
  if (recommendedItems.length > 0) {
    rows.push([])
    rows.push(['=== 推荐配件（按规格） ==='])
    rows.push(['类型', '名称', '型材规格', '数量', '单价(元)', '总价(元)'])
    recommendedItems.forEach(item => {
      rows.push([
        item.id, item.name, item.specId, item.count,
        item.pricePerUnit.toFixed(2),
        (item.count * item.pricePerUnit).toFixed(2),
      ])
    })
  }

  // 成本汇总
  rows.push([])
  rows.push(['=== 成本汇总 ==='])
  rows.push(['型材成本(元)', materialList.cost.profileCost.toFixed(2)])
  rows.push(['配件成本(元)', materialList.cost.accessoryCost.toFixed(2)])
  rows.push(['加工费(元)', materialList.cost.processingFee.toFixed(2)])
  rows.push(['总成本(元)', materialList.cost.totalCost.toFixed(2)])

  const csvStr = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csvStr], { type: 'text/csv;charset=utf-8' })  // BOM for Chinese
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = 'material-list.csv'
  link.click()

  URL.revokeObjectURL(url)
}

// T19: Export full design (elements + profile + metadata) as JSON file.
// The serialized payload includes a version + timestamp + optional name so
// that future schema migrations can detect/upgrade older files.
export function exportDesignJSON(design, options = {}) {
  const {
    filename,
    appName = 'aluminum-profile-designer',
    schemaVersion = '1.0',
  } = options

  const payload = {
    app: appName,
    version: schemaVersion,
    timestamp: Date.now(),
    name: design?.name || `aluminum-design-${Date.now()}`,
    profile: design?.profile || design?.currentProfile || '4040',
    currentProfile: design?.profile || design?.currentProfile || '4040',
    elements: Array.isArray(design?.elements) ? design.elements : [],
  }

  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename || `${payload.name}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Defer revoke so the browser has time to start the download
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return payload
}

// T19: Parse a user-supplied JSON file and return a normalized design object.
// Throws on malformed input so callers can show an error message.
export function importDesignJSON(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('File read error'))
    reader.onload = (e) => {
      try {
        const text = String(e.target?.result || '')
        const data = JSON.parse(text)

        if (!data || typeof data !== 'object') {
          reject(new Error('Invalid JSON: not an object'))
          return
        }
        if (!Array.isArray(data.elements)) {
          reject(new Error('Invalid design file: missing elements array'))
          return
        }

        // Normalize: accept both legacy "profile" and "currentProfile" keys,
        // and allow designs without a version field (legacy saves).
        const normalized = {
          app: data.app || 'aluminum-profile-designer',
          version: data.version || '1.0',
          timestamp: data.timestamp || Date.now(),
          name: data.name || `imported-${Date.now()}`,
          profile: data.profile || data.currentProfile || '4040',
          currentProfile: data.currentProfile || data.profile || '4040',
          elements: data.elements,
        }

        resolve(normalized)
      } catch (err) {
        reject(new Error('Invalid JSON file: ' + (err?.message || 'parse error')))
      }
    }
    reader.readAsText(file)
  })
}

// T16: Export canvas as PNG
// Renders a fresh snapshot of the source canvas into an offscreen canvas
// (with a dark background, padding, and timestamp watermark) then triggers download.
export function exportCanvasAsPNG(sourceCanvas, options = {}) {
  if (!sourceCanvas) return false
  const {
    background = '#0C0C0F',
    padding = 40,
    filename = `aluminum-design-${Date.now()}.png`,
  } = options

  const srcW = sourceCanvas.width
  const srcH = sourceCanvas.height
  if (!srcW || !srcH) return false

  const outW = srcW + padding * 2
  const outH = srcH + padding * 2

  const out = document.createElement('canvas')
  out.width = outW
  out.height = outH
  const ctx = out.getContext('2d')

  // Background
  ctx.fillStyle = background
  ctx.fillRect(0, 0, outW, outH)

  // Copy the source canvas as-is (grid + elements + drawing preview)
  ctx.drawImage(sourceCanvas, padding, padding)

  // Footer watermark
  ctx.fillStyle = '#888892'
  ctx.font = '12px "SF Mono", "Menlo", monospace'
  const ts = new Date().toLocaleString('zh-CN', { hour12: false })
  ctx.fillText(`Aluminum Profile Designer  ·  ${ts}`, padding, outH - padding / 2)

  // Trigger download
  const dataUrl = out.toDataURL('image/png')
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
  return true
}
