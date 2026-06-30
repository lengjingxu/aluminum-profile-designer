// 铝型材规格库 - 8种常用规格
// 含截面积、理论重量、惯性矩等参数

export const ALUMINUM_PROFILES = {
  '2020': {
    id: '2020',
    name: '2020铝型材',
    width: 20,
    height: 20,
    grooveWidth: 6,
    area: 1.13,     // cm²
    Ix: 0.38,       // cm⁴
    Iy: 0.38,       // cm⁴
    weightPerMeter: 0.30,  // kg/m
    pricePerMeter: 15,     // 元/m（参考价）
    description: '轻型框架',
  },
  '2040': {
    id: '2040',
    name: '2040铝型材',
    width: 20,
    height: 40,
    grooveWidth: 6,
    area: 2.27,
    Ix: 1.54,
    Iy: 0.38,
    weightPerMeter: 0.60,
    pricePerMeter: 25,
    description: '窄长框架',
  },
  '3030': {
    id: '3030',
    name: '3030铝型材',
    width: 30,
    height: 30,
    grooveWidth: 8,
    area: 2.76,
    Ix: 1.24,
    Iy: 1.24,
    weightPerMeter: 0.73,
    pricePerMeter: 30,
    description: '通用框架',
  },
  '3060': {
    id: '3060',
    name: '3060铝型材',
    width: 30,
    height: 60,
    grooveWidth: 8,
    area: 5.52,
    Ix: 5.02,
    Iy: 1.24,
    weightPerMeter: 1.46,
    pricePerMeter: 50,
    description: '扁长框架',
  },
  '4040': {
    id: '4040',
    name: '4040铝型材',
    width: 40,
    height: 40,
    grooveWidth: 10,
    area: 4.88,
    Ix: 7.68,
    Iy: 7.68,
    weightPerMeter: 1.29,
    pricePerMeter: 40,
    description: '重型框架',
  },
  '4080': {
    id: '4080',
    name: '4080铝型材',
    width: 40,
    height: 80,
    grooveWidth: 10,
    area: 9.76,
    Ix: 30.9,
    Iy: 7.68,
    weightPerMeter: 2.58,
    pricePerMeter: 65,
    description: '高强度框架',
  },
  '6060': {
    id: '6060',
    name: '6060铝型材',
    width: 60,
    height: 60,
    grooveWidth: 12,
    area: 10.6,
    Ix: 22.1,
    Iy: 22.1,
    weightPerMeter: 2.80,
    pricePerMeter: 80,
    description: '大截面框架',
  },
  '8080': {
    id: '8080',
    name: '8080铝型材',
    width: 80,
    height: 80,
    grooveWidth: 14,
    area: 19.2,
    Ix: 77.7,
    Iy: 77.7,
    weightPerMeter: 5.08,
    pricePerMeter: 120,
    description: '超大截面框架',
  },
}

// 获取所有规格ID列表
export const getProfileIds = () => Object.keys(ALUMINUM_PROFILES)

// 获取规格详情
export const getProfile = (id) => ALUMINUM_PROFILES[id] || null

// 获取规格显示名称
export const getProfileName = (id) => {
  const profile = getProfile(id)
  return profile ? `${profile.name} (${profile.width}×${profile.height})` : id
}
