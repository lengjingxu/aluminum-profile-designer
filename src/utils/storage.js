// localStorage 持久化 - 设计方案存储与恢复

const STORAGE_KEY = 'aluminum-designer'
const DESIGN_LIST_KEY = 'aluminum-designer-list'
const DRAFT_KEY = 'aluminum-draft' // T15: 自动保存草稿

// T15: 保存当前草稿（自动保存）
export function saveDraft(elements, currentProfile) {
  try {
    if (!elements || elements.length === 0) {
      localStorage.removeItem(DRAFT_KEY)
      return null
    }
    const draft = {
      elements,
      currentProfile,
      updatedAt: Date.now(),
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    return draft.updatedAt
  } catch (e) {
    console.error('草稿保存失败:', e)
    return null
  }
}

// T15: 读取草稿
export function loadDraft() {
  try {
    const data = localStorage.getItem(DRAFT_KEY)
    return data ? JSON.parse(data) : null
  } catch (e) {
    console.error('草稿读取失败:', e)
    return null
  }
}

// T15: 清除草稿
export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
    return true
  } catch (e) {
    return false
  }
}

// 保存当前设计方案
export function saveDesign(designData) {
  try {
    const key = `${STORAGE_KEY}-${designData.id}`
    localStorage.setItem(key, JSON.stringify(designData))

    // 更新方案列表
    const list = getDesignList()
    const existingIndex = list.findIndex(item => item.id === designData.id)
    const listItem = {
      id: designData.id,
      name: designData.name,
      updatedAt: Date.now(),
      elementCount: designData.elements?.length || 0,
    }

    if (existingIndex >= 0) {
      list[existingIndex] = listItem
    } else {
      list.push(listItem)
    }
    localStorage.setItem(DESIGN_LIST_KEY, JSON.stringify(list))

    return true
  } catch (e) {
    console.error('保存失败:', e)
    return false
  }
}

// 加载设计方案
export function loadDesign(id) {
  try {
    const key = `${STORAGE_KEY}-${id}`
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (e) {
    console.error('加载失败:', e)
    return null
  }
}

// 获取方案列表
export function getDesignList() {
  try {
    const data = localStorage.getItem(DESIGN_LIST_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    return []
  }
}

// 删除设计方案
export function deleteDesign(id) {
  try {
    localStorage.removeItem(`${STORAGE_KEY}-${id}`)
    const list = getDesignList().filter(item => item.id !== id)
    localStorage.setItem(DESIGN_LIST_KEY, JSON.stringify(list))
    return true
  } catch (e) {
    return false
  }
}

// 生成唯一ID
export function generateId() {
  return 'design-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6)
}
