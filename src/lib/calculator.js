// 材料计算引擎 - 型材长度统计、配件数量计算、成本估算

import { ALUMINUM_PROFILES, getProfile } from './aluminum-profiles'
import { ACCESSORY_TYPES, DEFAULT_PRICES } from './accessories'

// 计算型材长度统计（按规格分组）
export function calculateProfileStats(elements) {
  const stats = {}

  elements.forEach(el => {
    const specId = el.profileSpec || '4040'
    const lengthMm = el.length || 0
    const lengthM = lengthMm / 1000

    if (!stats[specId]) {
      const profile = getProfile(specId)
      stats[specId] = {
        specId,
        name: profile ? profile.name : specId,
        width: profile ? profile.width : 40,
        height: profile ? profile.height : 40,
        weightPerMeter: profile ? profile.weightPerMeter : 1.29,
        pricePerMeter: profile ? profile.pricePerMeter : 40,
        totalLengthM: 0,
        totalWeightKg: 0,
        totalPrice: 0,
        count: 0,
        segments: [],  // 每根型材的长度列表
      }
    }

    stats[specId].totalLengthM += lengthM
    stats[specId].totalWeightKg += lengthM * stats[specId].weightPerMeter
    stats[specId].totalPrice += lengthM * stats[specId].pricePerMeter
    stats[specId].count += 1
    stats[specId].segments.push(lengthMm)
  })

  return stats
}

// 计算配件数量
export function calculateAccessories(elements) {
  const result = {}

  // 角码：检测线段端点重合且夹角≈90°
  let angleBracketCount = 0
  const endpoints = []

  elements.forEach(el => {
    if (el.type === 'line') {
      endpoints.push({ x: el.x1, y: el.y1, elementId: el.id })
      endpoints.push({ x: el.x2, y: el.y2, elementId: el.id })
    }
  })

  // 简化检测：找出端点重合的点，每组重合端点算1个角码
  const tolerance = 5
  for (let i = 0; i < endpoints.length; i++) {
    for (let j = i + 1; j < endpoints.length; j++) {
      if (endpoints[i].elementId !== endpoints[j].elementId) {
        const dx = Math.abs(endpoints[i].x - endpoints[j].x)
        const dy = Math.abs(endpoints[i].y - endpoints[j].y)
        if (dx < tolerance && dy < tolerance) {
          angleBracketCount++
        }
      }
    }
  }

  // T型连接件：3线交汇点（简化为每4个重合端点 = 1个T型连接）
  const tConnectorCount = Math.floor(angleBracketCount / 3)

  // 螺丝：每个连接点2颗
  const screwCount = (angleBracketCount + tConnectorCount) * 2

  // 端盖：每根型材2个
  const endCapCount = elements.length * 2

  // 脚轮/脚杯：底部支撑点（简化为每4根竖直型材1个脚杯）
  const verticalElements = elements.filter(el => {
    if (el.type !== 'line') return false
    const dx = Math.abs(el.x2 - el.x1)
    const dy = Math.abs(el.y2 - el.y1)
    return dy > dx * 2  // 主要沿Y方向
  })
  const footCount = Math.max(verticalElements.length, 0)

  // 弹性扣：每根型材长度÷300mm
  const springClipCount = elements.reduce((sum, el) => {
    const lengthMm = el.length || 0
    return sum + Math.ceil(lengthMm / 300)
  }, 0)

  result.angleBracket = { count: angleBracketCount, ...ACCESSORY_TYPES.angleBracket }
  result.tConnector = { count: tConnectorCount, ...ACCESSORY_TYPES.tConnector }
  result.screw = { count: screwCount, ...ACCESSORY_TYPES.screw }
  result.endCap = { count: endCapCount, ...ACCESSORY_TYPES.endCap }
  result.foot = { count: footCount, ...ACCESSORY_TYPES.foot }
  result.springClip = { count: springClipCount, ...ACCESSORY_TYPES.springClip }

  return result
}

// 计算总成本
export function calculateCost(profileStats, accessories, processingFeeRate = 0.1) {
  // 型材成本
  const profileCost = Object.values(profileStats).reduce(
    (sum, stat) => sum + stat.totalPrice, 0
  )

  // 配件成本
  const accessoryCost = Object.values(accessories).reduce(
    (sum, acc) => sum + acc.count * acc.pricePerUnit, 0
  )

  // 加工费
  const processingFee = (profileCost + accessoryCost) * processingFeeRate

  // 总成本
  const totalCost = profileCost + accessoryCost + processingFee

  return {
    profileCost,
    accessoryCost,
    processingFee,
    processingFeeRate,
    totalCost,
  }
}

// 生成完整材料清单
export function generateMaterialList(elements) {
  const profileStats = calculateProfileStats(elements)
  const accessories = calculateAccessories(elements)
  const cost = calculateCost(profileStats, accessories)

  return {
    profiles: profileStats,
    accessories,
    cost,
  }
}
