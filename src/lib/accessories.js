// 配件定义 - 各类连接件、紧固件、装饰件

export const ACCESSORY_TYPES = {
  angleBracket: {
    id: 'angleBracket',
    name: '角码连接件',
    description: '90度角固定连接',
    pricePerUnit: 3,    // 元/个（参考价）
    unit: '个',
  },
  tConnector: {
    id: 'tConnector',
    name: 'T型连接件',
    description: '三通连接',
    pricePerUnit: 5,
    unit: '个',
  },
  screw: {
    id: 'screw',
    name: '螺丝/螺栓',
    description: 'M5标准螺栓',
    pricePerUnit: 0.5,
    unit: '颗',
  },
  endCap: {
    id: 'endCap',
    name: '端盖/堵头',
    description: '型材端面装饰封盖',
    pricePerUnit: 1,
    unit: '个',
  },
  foot: {
    id: 'foot',
    name: '脚轮/脚杯',
    description: '底部支撑件（M6螺纹）',
    pricePerUnit: 8,
    unit: '个',
  },
  panelClamp: {
    id: 'panelClamp',
    name: '面板夹',
    description: '固定层板（4040适配）',
    pricePerUnit: 2,
    unit: '个',
  },
  endConnector: {
    id: 'endConnector',
    name: '端面连接件',
    description: '型材对接连接器（两段型材端面对接）',
    pricePerUnit: 3,
    unit: '个',
  },
  springClip: {
    id: 'springClip',
    name: '弹性扣',
    description: '快速连接扣件',
    pricePerUnit: 0.8,
    unit: '颗',
  },
}

// 配件单价表（可由用户自定义）
export const DEFAULT_PRICES = Object.fromEntries(
  Object.entries(ACCESSORY_TYPES).map(([key, val]) => [key, val.pricePerUnit])
)

// 按型材规格推荐配套螺栓套装（T07）
// 每根型材按长度分摊螺栓用量：每米需要 4 套螺栓（T-slot 槽连接）
export const BOLT_SET_PRICES = {
  '2020': { name: 'M5 螺栓套装', spec: 'M5', pricePerSet: 1.5, boltsPerSet: 4 },
  '2040': { name: 'M5 螺栓套装', spec: 'M5', pricePerSet: 1.5, boltsPerSet: 4 },
  '3030': { name: 'M6 螺栓套装', spec: 'M6', pricePerSet: 2.0, boltsPerSet: 4 },
  '3060': { name: 'M6 螺栓套装', spec: 'M6', pricePerSet: 2.0, boltsPerSet: 4 },
  '4040': { name: 'M8 螺栓套装', spec: 'M8', pricePerSet: 3.0, boltsPerSet: 4 },
  '4080': { name: 'M8 螺栓套装', spec: 'M8', pricePerSet: 3.0, boltsPerSet: 4 },
  '6060': { name: 'M10 螺栓套装', spec: 'M10', pricePerSet: 5.0, boltsPerSet: 4 },
  '8080': { name: 'M12 螺栓套装', spec: 'M12', pricePerSet: 8.0, boltsPerSet: 4 },
}

// 按型材规格推荐配套角码（T07 配套）
export const ANGLE_BRACKET_PRICES = {
  '2020': { name: '2020 角码', pricePerUnit: 1.5 },
  '2040': { name: '2040 角码', pricePerUnit: 2.0 },
  '3030': { name: '3030 角码', pricePerUnit: 2.5 },
  '3060': { name: '3060 角码', pricePerUnit: 3.0 },
  '4040': { name: '4040 角码', pricePerUnit: 3.0 },
  '4080': { name: '4080 角码', pricePerUnit: 4.0 },
  '6060': { name: '6060 角码', pricePerUnit: 5.0 },
  '8080': { name: '8080 角码', pricePerUnit: 8.0 },
}

// 按型材规格推荐配套弹性扣（T07 配套）
export const SPRING_CLIP_PRICES = {
  '2020': { name: '2020 弹性扣', pricePerUnit: 0.5 },
  '2040': { name: '2040 弹性扣', pricePerUnit: 0.6 },
  '3030': { name: '3030 弹性扣', pricePerUnit: 0.8 },
  '3060': { name: '3060 弹性扣', pricePerUnit: 0.8 },
  '4040': { name: '4040 弹性扣', pricePerUnit: 0.8 },
  '4080': { name: '4080 弹性扣', pricePerUnit: 1.0 },
  '6060': { name: '6060 弹性扣', pricePerUnit: 1.2 },
  '8080': { name: '8080 弹性扣', pricePerUnit: 1.5 },
}
