// miniprogram/pages/profile-library/profile-library.js
// 型材库页面 - 显示所有型材规格卡片，点击可选中切换当前画图型材

const app = getApp()

const PROFILE_DATA = {
  '2020': { name: '2020铝型材', width: 20, height: 20, weight: 0.5, desc: '20×20mm 小型方管' },
  '2040': { name: '2040铝型材', width: 20, height: 40, weight: 0.8, desc: '20×40mm 小型扁管' },
  '3030': { name: '3030铝型材', width: 30, height: 30, weight: 1.2, desc: '30×30mm 中型方管' },
  '3060': { name: '3060铝型材', width: 30, height: 60, weight: 1.8, desc: '30×60mm 中型扁管' },
  '4040': { name: '4040铝型材', width: 40, height: 40, weight: 2.0, desc: '40×40mm 标准方管' },
  '4080': { name: '4080铝型材', width: 40, height: 80, weight: 3.5, desc: '40×80mm 标准扁管' },
  '6060': { name: '6060铝型材', width: 60, height: 60, weight: 4.0, desc: '60×60mm 大型方管' },
  '8080': { name: '8080铝型材', width: 80, height: 80, weight: 6.0, desc: '80×80mm 重型方管' },
}

Page({
  data: {
    profiles: Object.keys(PROFILE_DATA).map(id => ({
      id,
      ...PROFILE_DATA[id]
    })),
    currentProfile: '4040',
  },

  onLoad() {
    this.setData({ currentProfile: app.globalData.currentProfile })
  },

  onSelectProfile(e) {
    const id = e.currentTarget.dataset.id
    app.globalData.currentProfile = id
    this.setData({ currentProfile: id })
    wx.showToast({ title: PROFILE_DATA[id].name + ' 已选中', icon: 'success' })
  },

  onBack() {
    wx.navigateBack()
  },
})
