// 预制模板库 — T09: 支持尺寸参数化
// 一个模板可以是:
//   - 静态模板: { elements: [...] } 直接加载
//   - 参数化模板: { params: {...}, generate: (params) => elements[] } 根据用户输入动态生成

// 辅助函数: 根据参数生成立柱 + 上下框
const buildSimpleFrame = (params, profile, options = {}) => {
  const {
    x1 = 50, y1 = 100, x2 = 550,
    layers = 3, // 中间横梁层数 (layers-1)
    layerKey = 'middleY1', // params key for first layer y (optional)
  } = options

  const width = params.width ?? 600
  const height = params.height ?? 2000

  const elements = [
    // 左立柱
    { type: 'line', x1, y1, x2: x1, y2: y1 + height, length: height, profileSpec: profile },
    // 右立柱
    { type: 'line', x1: x1 + width, y1, x2: x1 + width, y2: y1 + height, length: height, profileSpec: profile },
    // 顶横梁
    { type: 'line', x1, y1, x2: x1 + width, y2: y1, length: width, profileSpec: profile },
    // 底横梁
    { type: 'line', x1, y1: y1 + height, x2: x1 + width, y2: y1 + height, length: width, profileSpec: profile },
  ]
  // 中间层横梁
  if (layers > 1) {
    const step = height / layers
    for (let i = 1; i < layers; i++) {
      const yMid = y1 + step * i
      elements.push({ type: 'line', x1, y1: yMid, x2: x1 + width, y2: yMid, length: width, profileSpec: profile })
    }
  }
  return elements
}

export const TEMPLATES = {
  // T09: 参数化衣柜模板 — 用户可调宽度和高度
  'wardrobe-60': {
    id: 'wardrobe-60',
    name: '60cm 衣柜框架',
    profile: '4040',
    description: '标准60cm深衣柜骨架，高度/层数可调',
    params: {
      width: { label: '宽度 (mm)', default: 500, min: 200, max: 1200, step: 50 },
      height: { label: '高度 (mm)', default: 2000, min: 800, max: 3000, step: 100 },
      layers: { label: '层数 (含上下)', default: 4, min: 2, max: 8, step: 1 },
    },
    generate: (params) => {
      return buildSimpleFrame(
        { width: params.width, height: params.height },
        '4040',
        { layers: params.layers, x1: 50, y1: 100 }
      )
    },
  },

  // T09: 参数化工作台模板
  'table-120': {
    id: 'table-120',
    name: '120cm 工作台',
    profile: '4040',
    description: '1.2m铝型材工作台框架，宽度/高度可调',
    params: {
      width: { label: '桌面宽 (mm)', default: 1200, min: 600, max: 2000, step: 50 },
      depth: { label: '桌面深 (mm)', default: 600, min: 400, max: 1000, step: 50 },
      legHeight: { label: '桌腿高 (mm)', default: 700, min: 400, max: 1200, step: 50 },
    },
    generate: (params) => {
      const w = params.width
      const d = params.depth
      const lh = params.legHeight
      const x1 = 50, y1 = 50
      return [
        // 桌面外框
        { type: 'rect', x1, y1, x2: x1 + w, y2: y1 + d, profileSpec: '4040' },
        // 4 根桌腿
        { type: 'line', x1, y1: y1 + d, x2: x1, y2: y1 + d + lh, length: lh, profileSpec: '4040' },
        { type: 'line', x1: x1 + w, y1: y1 + d, x2: x1 + w, y2: y1 + d + lh, length: lh, profileSpec: '4040' },
        { type: 'line', x1, y1, x2: x1, y2: y1 + lh, length: lh, profileSpec: '4040' },
        { type: 'line', x1: x1 + w, y1, x2: x1 + w, y2: y1 + lh, length: lh, profileSpec: '4040' },
        // 横档加固
        { type: 'line', x1, y1: y1 + lh + 50, x2: x1 + w, y2: y1 + lh + 50, length: w, profileSpec: '4040' },
      ]
    },
  },

  // T09: 参数化置物架模板
  'shelf-4layer': {
    id: 'shelf-4layer',
    name: '4层置物架',
    profile: '3030',
    description: '3030轻型架子，层数/宽度可调',
    params: {
      width: { label: '宽度 (mm)', default: 400, min: 200, max: 1000, step: 50 },
      height: { label: '高度 (mm)', default: 1600, min: 600, max: 2400, step: 100 },
      layers: { label: '总层数 (含上下)', default: 5, min: 3, max: 8, step: 1 },
    },
    generate: (params) => {
      return buildSimpleFrame(
        { width: params.width, height: params.height },
        '3030',
        { layers: params.layers, x1: 50, y1: 100 }
      )
    },
  },

  'frame-8080': {
    id: 'frame-8080',
    name: '8080 重型框架',
    profile: '8080',
    description: '80x80超大截面框架，适用于大型设备支架',
    elements: [
      // 底部框架
      { type: 'rect', x1: 50, y1: 50, x2: 650, y2: 350, profileSpec: '8080' },
      // 2根立柱
      { type: 'line', x1: 50, y1: 350, x2: 50, y2: 850, length: 500, profileSpec: '8080' },
      { type: 'line', x1: 650, y1: 350, x2: 650, y2: 850, length: 500, profileSpec: '8080' },
      // 顶部框架
      { type: 'rect', x1: 50, y1: 550, x2: 650, y2: 850, profileSpec: '8080' },
    ],
  },
  'empty': {
    id: 'empty',
    name: '空白画布',
    profile: '4040',
    description: '从零开始设计',
    elements: [],
  },
}

export const TEMPLATE_IDS = Object.keys(TEMPLATES)
export const getTemplate = (id) => TEMPLATES[id] || null

// 辅助函数: 解析模板为元素列表 (支持参数化模板)
export const resolveTemplate = (id, params = {}) => {
  const t = TEMPLATES[id]
  if (!t) return null
  if (t.generate) {
    return {
      ...t,
      elements: t.generate(params),
    }
  }
  return t
}
