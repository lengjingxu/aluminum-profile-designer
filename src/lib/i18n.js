// T17: i18n dictionary and helper
// Languages: zh (default), en
// Persisted in localStorage under key 'aluminum-lang'

export const i18n = {
  zh: {
    // Top header
    title: '铝型材结构设计器',
    titleMobile: '铝型材设计器',
    elementsCount: '图元数量',
    selectCount: '{n} 个',

    // Buttons / actions
    save: '保存',
    clear: '清空',
    template: '模板',
    templateBtn: '选择模板',
    loadTemplate: '加载模板',
    applyTemplate: '应用模板',
    edit: '编辑',
    editBtn: '返回编辑',
    preview3d: '3D 预览',
    delete: '删除',
    deleteSelected: '删除选中',
    export: '导出',
    exportPng: '导出图片',
    back: '返回',
    confirm: '确定',
    cancel: '取消',
    restore: '恢复',

    // Tools
    select: '选择',
    line: '线段',
    rect: '矩形',
    deleteTool: '删除',
    undo: '撤销',
    redo: '重做',
    copy: '复制',
    paste: '粘贴',
    duplicate: '原地复制',
    lock: '锁定',
    unlock: '解锁',

    // Tool hints
    hintLine: '点击画布绘制线段起点，再次点击完成线段',
    hintSelect: '点击线段选中查看属性',
    hintDelete: '点击线段删除',
    hintRect: '点击画布绘制矩形起点，再次点击完成矩形',

    // Property panel
    property: '属性',
    material: '材料清单',
    materialList: '材料',
    section: '截面',
    profile4040: '4040铝型材',
    profile3030: '3030铝型材',
    profile6060: '6060铝型材',
    profile2020: '2020铝型材',
    profile2040: '2040铝型材',
    profile3060: '3060铝型材',
    profile4080: '4080铝型材',
    profile8080: '8080铝型材',
    profile: '型材',
    x1: 'X1', y1: 'Y1', x2: 'X2', y2: 'Y2',
    length: '长度',
    centerH: '水平居中',
    centerV: '垂直居中',
    distributeH: '水平等距',
    distributeV: '垂直等距',
    label: '标注',
    locked: '已锁定',

    // Grid / status
    grid: '网格',
    autoSaved: '已自动保存',
    notAutoSaved: '未自动保存',
    autoSavedAt: '已自动保存 {time}',
    justNow: '刚刚',
    secondsAgo: '{n} 秒前',
    minutesAgo: '{n} 分钟前',

    // Draft restore
    draftPrompt: '检测到草稿（{time}，{n} 个图元），是否恢复？',

    // Templates (names match templates.js)
    template_wardrobe60: '60cm衣柜框架',
    template_table120: '120cm工作台',
    template_shelf4: '4层置物架',

    // Footer
    saved: '设计已保存',

    // 3D View
    view3d: '3D 预览',
  },
  en: {
    // Top header
    title: 'Aluminum Profile Designer',
    titleMobile: 'Profile Designer',
    elementsCount: 'Elements',
    selectCount: '{n} selected',

    // Buttons / actions
    save: 'Save',
    clear: 'Clear',
    template: 'Template',
    templateBtn: 'Templates',
    loadTemplate: 'Load Template',
    applyTemplate: 'Apply Template',
    edit: 'Edit',
    editBtn: 'Back to Edit',
    preview3d: '3D Preview',
    delete: 'Delete',
    deleteSelected: 'Delete Selected',
    export: 'Export',
    exportPng: 'Export PNG',
    back: 'Back',
    confirm: 'OK',
    cancel: 'Cancel',
    restore: 'Restore',

    // Tools
    select: 'Select',
    line: 'Line',
    rect: 'Rect',
    deleteTool: 'Delete',
    undo: 'Undo',
    redo: 'Redo',
    copy: 'Copy',
    paste: 'Paste',
    duplicate: 'Duplicate',
    lock: 'Lock',
    unlock: 'Unlock',

    // Tool hints
    hintLine: 'Click canvas to set line start, click again to finish',
    hintSelect: 'Click an element to inspect its properties',
    hintDelete: 'Click an element to delete it',
    hintRect: 'Click canvas to set rect start, click again to finish',

    // Property panel
    property: 'Property',
    material: 'Material',
    materialList: 'Materials',
    section: 'Section',
    profile4040: '4040 Aluminum',
    profile3030: '3030 Aluminum',
    profile6060: '6060 Aluminum',
    profile2020: '2020 Aluminum',
    profile2040: '2040 Aluminum',
    profile3060: '3060 Aluminum',
    profile4080: '4080 Aluminum',
    profile8080: '8080 Aluminum',
    profile: 'Profile',
    x1: 'X1', y1: 'Y1', x2: 'X2', y2: 'Y2',
    length: 'Length',
    centerH: 'Center Vertically',
    centerV: 'Center Horizontally',
    distributeH: 'Distribute H',
    distributeV: 'Distribute V',
    label: 'Label',
    locked: 'Locked',

    // Grid / status
    grid: 'Grid',
    autoSaved: 'Auto-saved',
    notAutoSaved: 'Not saved',
    autoSavedAt: 'Auto-saved {time}',
    justNow: 'just now',
    secondsAgo: '{n}s ago',
    minutesAgo: '{n}m ago',

    // Draft restore
    draftPrompt: 'Draft found ({time}, {n} elements). Restore?',

    // Templates
    template_wardrobe60: '60cm Wardrobe Frame',
    template_table120: '120cm Workbench',
    template_shelf4: '4-Layer Shelf',

    // Footer
    saved: 'Design saved',

    // 3D View
    view3d: '3D Preview',
  },
}

export const SUPPORTED_LANGS = ['zh', 'en']

export const loadLang = () => {
  try {
    const stored = localStorage.getItem('aluminum-lang')
    if (stored && SUPPORTED_LANGS.includes(stored)) return stored
  } catch {
    // localStorage may not be available
  }
  return 'zh'
}

export const saveLang = (lang) => {
  try {
    localStorage.setItem('aluminum-lang', lang)
  } catch {
    // ignore quota errors etc.
  }
}

// Translate a key. Supports {n} / {time} interpolation.
export const t = (key, lang = 'zh', vars = {}) => {
  const dict = i18n[lang] || i18n.zh
  let template = dict[key] || i18n.zh[key] || key
  if (vars && typeof template === 'string') {
    template = template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`))
  }
  return template
}