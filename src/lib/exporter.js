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
