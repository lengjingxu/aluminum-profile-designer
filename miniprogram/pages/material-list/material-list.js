// miniprogram/pages/material-list/material-list.js
// 材料清单页面 - 显示当前设计的材料统计

const app = getApp()

Page({
  data: {
    materials: [],
    totalLength: 0,
    totalWeight: 0,
    totalCost: 0,
    summaryItems: [],
  },

  onLoad() {
    this.calculateMaterials()
  },

  onShow() {
    this.calculateMaterials()
  },

  calculateMaterials() {
    const elements = app.globalData.elements
    // 模拟材料统计计算
    const profileMap = {}
    let totalLength = 0
    let totalWeight = 0

    elements.forEach(el => {
      if (!profileMap[el.profile]) {
        profileMap[el.profile] = { profile: el.profile, count: 0, length: 0 }
      }
      profileMap[el.profile].count++
      profileMap[el.profile].length += el.length || 0
      totalLength += el.length || 0
    })

    const materials = Object.values(profileMap)
    const summaryItems = [
      { label: '图元总数', value: elements.length + ' 个' },
      { label: '总长度', value: totalLength.toFixed(2) + ' mm' },
      { label: '型材种类', value: materials.length + ' 种' },
      { label: '预估重量', value: totalWeight.toFixed(2) + ' kg' },
    ]

    this.setData({ materials, totalLength, totalWeight, summaryItems })
  },

  onExport() {
    wx.showToast({ title: '导出功能待实现', icon: 'none' })
  },

  onBack() {
    wx.navigateBack()
  },
})
