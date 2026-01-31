## Plan: Web 笔记应用开发

创建一个支持 Markdown 预览和代码高亮的 Web 笔记应用。使用 markdown-it 渲染 Markdown，highlight.js（github 亮色主题）实现代码高亮，采用分离式文件结构。

### 文件结构

```
tools/note/
├── index.html
├── css/
│   └── style.css
└── js/
    └── app.js
```

### Steps

1. **创建 [index.html](tools/note/index.html)** — 页面结构包含：
   - `<head>` 引入 style.css、CDN 库（markdown-it、highlight.js + github.min.css 主题）
   - 顶部工具栏 `.toolbar`：清除、开启预览、隐藏输入三个按钮
   - 主体容器 `.container`：textarea 输入区 `.editor` + 预览区 `.preview`
   - `<script>` 引入 app.js

2. **创建 [css/style.css](tools/note/css/style.css)** — 样式设计：
   - 基础重置、全屏布局（html/body 高度 100%）
   - `.toolbar` 固定顶部，按钮悬停效果
   - `.container` 使用 flex 布局（支持单栏/双栏切换）
   - `.editor` textarea 全高、无边框、等宽字体
   - `.preview` 区域内边距、溢出滚动
   - 通过 `.preview-mode` 和 `.input-hidden` 类控制布局变化
   - Markdown 内容样式优化（标题、列表、引用、代码块边距等）

3. **创建 [js/app.js](tools/note/js/app.js)** — 核心功能：
   - `init()` — 初始化 markdown-it 实例（配置 highlight.js），加载本地数据，绑定事件监听
   - `clearContent()` — 清空 textarea 并更新 localStorage
   - `togglePreview()` — 切换 `.preview-mode` 类，更新按钮文本（开启预览/隐藏预览），触发渲染
   - `toggleInput()` — 切换 `.input-hidden` 类，更新按钮文本（隐藏输入/开启输入）
   - `renderMarkdown(text)` — 调用 markdown-it 渲染 HTML 到预览区
   - `handleTabKey(event)` — 阻止默认行为，在光标位置插入制表符
   - `saveToLocal(content)` — 将内容存入 `localStorage.setItem('note-content', content)`
   - `loadFromLocal()` — 读取 `localStorage.getItem('note-content')` 返回内容
   - 所有方法添加 JSDoc 注释

4. **事件绑定** — 在 `init()` 中：
   - 三个按钮绑定 `click` 事件
   - textarea 绑定 `input` 事件（保存 + 预览更新）
   - textarea 绑定 `keydown` 事件（处理 Tab 键）
   - `DOMContentLoaded` 时调用 `init()`

### CDN 资源

```html
<!-- highlight.js 样式 -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release/build/styles/github.min.css">
<!-- markdown-it -->
<script src="https://cdn.jsdelivr.net/npm/markdown-it/dist/markdown-it.min.js"></script>
<!-- highlight.js -->
<script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release/build/highlight.min.js"></script>
```
