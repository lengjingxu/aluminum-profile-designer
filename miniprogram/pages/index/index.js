// miniprogram/pages/index/index.js
const app = getApp()

Page({
  data: {
    elements: [],
    currentTool: 'line',
    currentProfile: '4040',
    selectedId: null,
    viewMode: '2d',
    profileList: ['2020','2040','3030','3060','4040','4080','6060','8080'],
    elementsCount: 0,
    currentProfileName: '4040铝型材',
  },
  
  onLoad() {
    // 读取 localStorage 恢复设计
    const saved = wx.getStorageSync('design')
    if (saved) {
      this.setData({ elements: saved.elements || [] })
    }
  },
  
  onToolChange(e) {
    const tool = e.currentTarget.dataset.tool
    this.setData({ currentTool: tool })
  },
  
  onProfileChange(e) {
    const profileId = this.data.profileList[e.detail.value]
    this.setData({ currentProfile: profileId, currentProfileName: profileId + '铝型材' })
  },
  
  onCanvasTap(e) {
    // 处理画布点击，添加线段
    const { x, y } = e.detail
    // 与现有逻辑一致
  },
  
  onSave() {
    wx.setStorageSync('design', { elements: this.data.elements })
    wx.showToast({ title: '已保存', icon: 'success' })
  },
  
  onClear() {
    this.setData({ elements: [], selectedId: null })
    wx.removeStorageSync('design')
  },
  
  onUndo() { /* 实现撤销 */ },
  onRedo() { /* 实现重做 */ },
})
