# 铝型材设计器 · 优化任务清单

| 最后更新：2026-07-04 15:30
> 状态：pending = 待处理, in_progress = 执行中, done = 已完成

---

## T01 - 复制/粘贴图元 + Ctrl+D
**状态：done**
复制选中图元（Ctrl+C），粘贴（Ctrl+V），原地复制（Ctrl+D）
文件：src/components/canvas-2d/DrawingCanvas.jsx, src/pages/index/EditorPage.jsx

## T02 - 框选多选
**状态：done**
鼠标拖动框选多个图元，显示选中数量，支持批量删除
文件：src/components/canvas-2d/DrawingCanvas.jsx, src/pages/index/EditorPage.jsx

## T03 - 对齐工具
**状态：done**
水平居中、垂直居中、等距分布（基于选中多个图元）
文件：src/components/canvas-2d/DrawingCanvas.jsx, src/pages/index/EditorPage.jsx

## T04 - 图元锁定
**状态：done**
选中图元后右键菜单或快捷键 L 锁定，锁定后不可移动/删除，显示锁图标
文件：src/components/canvas-2d/DrawingCanvas.jsx

## T05 - 文字标注
**状态：done**
在线段/矩形旁边双击添加文字标签（标注"支撑"、"上轨"等），可编辑颜色
文件：src/components/canvas-2d/DrawingCanvas.jsx, src/components/property-panel/PropertyPanel.jsx

## T06 - 连接件数量自动计算
**状态：done**
BOM 中自动计算端面连接件：线段端点数量 ÷ 2（每个连接件连接2根）
文件：src/components/material-list/MaterialList.jsx, src/lib/calculator.js

## T07 - 配件推荐
|**状态：done**
根据型材规格推荐配套螺栓（M5/M6/M8）、角码、弹性扣，附加价格
文件：src/lib/accessories.js, src/lib/calculator.js, src/components/material-list/MaterialList.jsx, src/lib/exporter.js

## T08 - 成本模拟
**状态：done**
属性面板中切换型材规格时，实时显示总成本变化（预览）
文件：src/components/property-panel/PropertyPanel.jsx

## T09 - 模板尺寸参数化
**状态：done**
模板加载后显示可拖拽调整的参数（如"宽度: 600mm [－][800][+]）
文件：src/pages/index/EditorPage.jsx, src/lib/templates.js

## T10 - 画布缩放/平移
|**状态：done**
鼠标滚轮缩放（Ctrl+滚轮），空格+拖动平移，显示当前缩放比例
文件：src/components/canvas-2d/DrawingCanvas.jsx

## T11 - 键盘快捷键完整支持
**状态：done**
Ctrl+Z撤销、Ctrl+Y重做、Delete删除、Escape取消绘制、Space空格
文件：src/components/canvas-2d/DrawingCanvas.jsx

## T12 - 画布网格间距可调
|**状态：done**
底部状态栏显示"网格: 10px [10/20/50]"点击切换
文件：src/components/canvas-2d/DrawingCanvas.jsx, src/pages/index/EditorPage.jsx

## T13 - 坐标属性直接编辑
**状态：done**
属性面板中可编辑起点/终点坐标数字输入框，实时更新画布
文件：src/components/property-panel/PropertyPanel.jsx

## T14 - 3D T-slot 截面纹理
**状态：done**
Viewer3D 中 Three.js 材质添加 T-slot 凹槽纹理，真实还原铝型材外观
文件：src/components/canvas-3d/Viewer3D.jsx

## T15 - 自动保存草稿
**状态：done**
每60秒自动保存到 localStorage，显示"已自动保存"状态提示
文件：src/pages/index/EditorPage.jsx, src/utils/storage.js

## T16 - 导出 PNG 图片
**状态：done**
工具栏新增"导出图片"按钮，canvas 导出为 PNG（含网格+标注）
文件：src/components/canvas-2d/DrawingCanvas.jsx, src/lib/exporter.js

## T17 - 多语言支持（中文/英文）
**状态：done**
增加英文 UI 翻译，语言切换按钮（中/EN），存储在 localStorage
文件：src/lib/i18n.js, src/pages/index/EditorPage.jsx

## T18 - 新模板：办公桌+仪器架
**状态：done**
新增2个模板：1.2m升降桌（带横档）、仪器设备架（6060）
文件：src/lib/templates.js

## T19 - 设计文件导入/导出（JSON）
**状态：pending**
导出完整设计方案为 JSON 文件，支持导入恢复（含元数据+版本号）
文件：src/lib/exporter.js, src/utils/storage.js

## T20 - Undo/Redo 历史记录面板
**状态：pending**
右侧面板底部显示历史记录列表，点击可跳转到任意历史状态
文件：src/pages/index/EditorPage.jsx, src/components/canvas-2d/DrawingCanvas.jsx

---

## 统计
|| 总计：20 项
|| 已完成：13 项
|| 进行中：0 项
|| 待处理：7 项
