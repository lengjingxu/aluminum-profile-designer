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
