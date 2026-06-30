// 分享功能 - URL参数压缩分享

import { exportToJSON } from '../lib/exporter'

// 将设计数据压缩为URL参数（简化版：直接导出JSON文件）
export function shareDesign(designData) {
  // 目前Web版暂用JSON导出方式分享
  exportToJSON(designData)
}

// 从URL参数恢复设计数据（未来扩展）
export function restoreFromShare() {
  // TODO: 从URL参数恢复
  return null
}
