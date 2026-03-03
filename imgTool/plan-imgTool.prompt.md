## Plan: Web 图片处理应用

创建一个独立的 Web 图片处理工具，包含图片导入、尺寸调整、下载功能。采用 HTML + CSS + JS 分离架构，所有文件存放在 `/Users/admin/code/myWeb/tools/imgTool` 目录内。

**文件结构**
```
imgTool/
├── index.html   # 页面结构
├── style.css    # 样式表
├── main.js      # 交互逻辑
└── origin.md    # 需求文档（已存在）
```

**Steps**

1. **创建 `index.html`** - 页面结构
   - 顶部区域：包含"导入图片"按钮和隐藏的 `<input type="file">`
   - 操作区：宽度输入框、高度输入框、锁定勾选框（默认选中）、确定按钮、**下载按钮**
   - 图片展示区：`<img>` 标签用于显示加载的图片

2. **创建 `style.css`** - 样式设计
   - 顶部区域样式：固定高度，居中按钮
   - 操作区样式：输入框、勾选框、按钮布局
   - 图片展示区样式：居中显示，响应式容器

3. **创建 `main.js`** - 交互逻辑，包含以下方法（含 JSDoc 注释）：
   - `handleImportClick()` - 触发文件选择对话框
   - `handleFileSelect(event)` - 处理文件选择，加载图片
   - `loadImage(file)` - 读取图片文件并显示
   - `updateImageInfo(img)` - 更新宽高输入框为原始尺寸
   - `handleWidthChange(event)` - 处理宽度输入变化（锁定时同步高度）
   - `handleHeightChange(event)` - 处理高度输入变化（锁定时同步宽度）
   - `handleConfirm()` - 应用新的宽高到图片
   - `calculateProportionalSize(value, isWidth)` - 计算等比例尺寸
   - **`handleDownload()`** - 按当前宽高生成并下载图片

**下载功能实现**
- 使用 Canvas API 实现图片缩放和导出
- 创建 `<canvas>` 元素，设置为目标宽高
- 将图片绘制到 canvas 上（`drawImage`）
- 使用 `canvas.toDataURL()` 或 `canvas.toBlob()` 生成图片数据
- 创建临时 `<a>` 标签，设置 `download` 属性触发下载

**核心逻辑**
- 存储原始宽高比 `aspectRatio = originalWidth / originalHeight`
- 锁定状态下：修改宽度时 `newHeight = newWidth / aspectRatio`；修改高度时 `newWidth = newHeight * aspectRatio`
- 非锁定状态下：宽高独立调整
- 下载时：canvas 绑定目标尺寸，输出实际调整后的图片文件

**Verification**
- 打开 `index.html`，点击"导入图片"能选择本地图片
- 图片加载后，宽高输入框显示原始尺寸
- 勾选锁定时，修改宽度/高度，另一值按比例变化
- 取消锁定时，宽高独立可调
- 点击确定后，图片按设定尺寸显示
- **点击下载后，保存的图片尺寸与输入框设定的宽高一致**

**Decisions**
- 采用 HTML/CSS/JS 分离结构，便于维护
- 使用 FileReader API 读取本地图片，无需服务端
- 下载功能使用 Canvas API 实现真实尺寸调整（而非仅 CSS 缩放）
- 下载格式默认 PNG，保留透明度
