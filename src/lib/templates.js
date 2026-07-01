// 预制模板库
export const TEMPLATES = {
  'wardrobe-60': {
    id: 'wardrobe-60',
    name: '60cm 衣柜框架',
    profile: '4040',
    description: '标准60cm深衣柜骨架，适合衣物收纳',
    elements: [
      // 2根立柱
      { type: 'line', x1: 50, y1: 100, x2: 50, y2: 2100, length: 2000, profileSpec: '4040' },
      { type: 'line', x1: 550, y1: 100, x2: 550, y2: 2100, length: 2000, profileSpec: '4040' },
      // 顶框横梁
      { type: 'line', x1: 50, y1: 100, x2: 550, y2: 100, length: 500, profileSpec: '4040' },
      // 中框横梁
      { type: 'line', x1: 50, y1: 700, x2: 550, y2: 700, length: 500, profileSpec: '4040' },
      { type: 'line', x1: 50, y1: 1400, x2: 550, y2: 1400, length: 500, profileSpec: '4040' },
      // 底框横梁
      { type: 'line', x1: 50, y1: 2100, x2: 550, y2: 2100, length: 500, profileSpec: '4040' },
    ]
  },
  'table-120': {
    id: 'table-120',
    name: '120cm 工作台',
    profile: '4040',
    description: '标准1.2m铝型材工作台桌面框架',
    elements: [
      // 桌面框架
      { type: 'rect', x1: 50, y1: 50, x2: 650, y2: 350, profileSpec: '4040' },
      // 4根桌腿
      { type: 'line', x1: 50, y1: 350, x2: 50, y2: 850, length: 500, profileSpec: '4040' },
      { type: 'line', x1: 650, y1: 350, x2: 650, y2: 850, length: 500, profileSpec: '4040' },
      { type: 'line', x1: 50, y1: 50, x2: 50, y2: 550, length: 500, profileSpec: '4040' },
      { type: 'line', x1: 650, y1: 50, x2: 650, y2: 550, length: 500, profileSpec: '4040' },
      // 横档加固
      { type: 'line', x1: 50, y1: 650, x2: 650, y2: 650, length: 600, profileSpec: '4040' },
    ]
  },
  'shelf-4layer': {
    id: 'shelf-4layer',
    name: '4层置物架',
    profile: '3030',
    description: '3030轻型架子，4层等高分布',
    elements: [
      // 2根立柱
      { type: 'line', x1: 50, y1: 100, x2: 50, y2: 1700, length: 1600, profileSpec: '3030' },
      { type: 'line', x1: 450, y1: 100, x2: 450, y2: 1700, length: 1600, profileSpec: '3030' },
      // 5层横梁
      { type: 'line', x1: 50, y1: 100, x2: 450, y2: 100, length: 400, profileSpec: '3030' },
      { type: 'line', x1: 50, y1: 500, x2: 450, y2: 500, length: 400, profileSpec: '3030' },
      { type: 'line', x1: 50, y1: 900, x2: 450, y2: 900, length: 400, profileSpec: '3030' },
      { type: 'line', x1: 50, y1: 1300, x2: 450, y2: 1300, length: 400, profileSpec: '3030' },
      { type: 'line', x1: 50, y1: 1700, x2: 450, y2: 1700, length: 400, profileSpec: '3030' },
    ]
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
    ]
  },
  'empty': {
    id: 'empty',
    name: '空白画布',
    profile: '4040',
    description: '从零开始设计',
    elements: []
  }
}

export const TEMPLATE_IDS = Object.keys(TEMPLATES)
export const getTemplate = (id) => TEMPLATES[id] || null
