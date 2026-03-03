# 视频处理工具 - 项目指南

## 代码风格

- **语言**: 纯前端项目，使用原生 HTML5/CSS3/JavaScript（ES6+），无构建工具
- **注释**: 所有 JavaScript 函数必须使用 Javadoc 风格注释，包含描述、参数类型和返回值
- **中文**: UI 文本、注释、变量名均使用中文，保持一致性
- **文件结构**: 严格分离 HTML/CSS/JS，不使用内联样式或脚本
- **参考示例**: [app.js](app.js) 展示了标准的函数注释格式

## 架构设计

### 核心模块
- **视频导入模块**: 使用 `URL.createObjectURL()` 处理本地文件，监听 `loadedmetadata` 事件
- **尺寸调整模块**: 实时保持宽高比计算，使用 `isUpdatingDimensions` 标志防止递归更新
- **截图模块**: Canvas API (`drawImage` + `toBlob`) 生成 JPEG 格式图片（质量 0.95）
  - 截图尺寸由输入框的宽高值决定，`displayScreenshot()` 设置 `img.width` 和 `img.height` 保持精确尺寸
  - 截图列表垂直布局（`flex-direction: column`），每张截图保持原始尺寸不拉伸
- **下载模块**: 创建临时 `<a>` 元素 + `URL.createObjectURL()` 触发下载，下载后释放 URL

### 关键设计决策
- **保持宽高比**: 修改宽度时自动计算高度，反之亦然（参考 `calculateAspectRatio`）
- **资源管理**: 所有 Blob URL 使用后必须调用 `URL.revokeObjectURL()` 释放内存
- **截图格式**: 固定使用 JPEG 而非 PNG（文件体积更小，适合多次截图）
- **截图尺寸**: 截图的显示尺寸必须与截图时的输入框值一致，不使用 CSS 拉伸（`width: 100%`）
- **状态管理**: 使用全局变量存储 DOM 引用和原始宽高比，在 `init()` 中初始化

## 运行方式

无需构建步骤，直接在浏览器中打开：

```bash
# macOS
open index.html

# 或使用本地服务器（推荐）
python3 -m http.server 8000
# 然后访问 http://localhost:8000
```

## 项目约定

### DOM 操作
- 所有 DOM 元素引用在 `init()` 函数中集中获取并存储到全局变量
- 使用 `DOMContentLoaded` 事件确保 DOM 完全加载后再初始化

### 事件绑定
- 使用箭头函数传递参数到事件处理器：`() => handleDimensionInput('width')`
- 一次性事件使用 `{ once: true }` 选项，如 `loadedmetadata` 监听

### 文件命名
- 所有下载文件使用时间戳格式：`screenshot_YYYYMMDD_HHMMSS.jpg`
- 使用 `padStart(2, '0')` 确保日期时间格式统一

### 动画和交互
- 删除操作添加淡出动画（300ms），然后移除 DOM 元素
- 按钮使用 CSS transition 实现 hover 和 active 状态反馈

## 约束条件

- **独立目录**: 不引入目录外的文件，保持项目完全自包含
- **无外部依赖**: 不使用任何第三方库或框架
- **浏览器支持**: 目标浏览器为现代浏览器（Chrome/Firefox/Safari），使用 HTML5 API
- **相对路径**: CSS 和 JS 使用相对路径引入（`./style.css`, `./app.js`）

## 样式约定

- **布局**: 使用 Flexbox（主要）和 CSS Grid 实现响应式布局
  - `.screenshots-container` 使用 `flex-direction: column` 垂直堆叠
  - `.screenshot-card` 使用 `width: fit-content` 自适应图片宽度
- **颜色**: 渐变背景 `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **响应式**: 断点设置在 768px（平板）和 480px（手机）
- **命名**: BEM 风格的类名，如 `.screenshot-card`, `.btn-primary`

## 扩展指南

添加新功能时遵循以下模式：

1. 在 HTML 中添加必要的 DOM 元素和唯一 ID
2. 在 CSS 中定义样式，保持与现有风格一致
3. 在 app.js 中创建带 Javadoc 注释的函数
4. 在 `init()` 函数中绑定事件监听器
5. 确保释放所有创建的资源（URL、事件监听器等）
