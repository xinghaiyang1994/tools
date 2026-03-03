## Plan: Web 视频处理应用

创建一个纯前端的视频处理工具，支持本地视频导入、实时调整视频尺寸展示、截图和下载功能。采用分离文件结构（HTML/CSS/JS），使用 JPEG 格式截图以节省空间，保持视频原始宽高比，截图文件以时间戳命名。

**Steps**

1. **创建 index.html**
   - 顶部区域：文件输入按钮（`<input type="file" accept="video/*">`）
   - 主体区域（初始隐藏）：
     - 操作区：宽度输入框、高度输入框、确定按钮、截图按钮
     - 视频播放区：`<video>` 元素（含播放控件）
     - 截图展示区：容器用于动态展示截图卡片
   - 引入 `style.css` 和 `app.js`

2. **创建 style.css**
   - 页面布局：顶部区域居中显示导入按钮
   - 主体区域：操作区横向布局，视频居中，截图区网格布局
   - 截图卡片：包含图片、下载按钮、删除按钮的卡片样式
   - 响应式设计：确保不同屏幕尺寸下的良好体验
   - 按钮样式：统一的交互反馈效果

3. **创建 app.js** 核心功能模块：
   
   **3.1 视频导入模块**
   - `handleVideoImport()` 方法：处理文件选择事件
     - 参数：Event 对象
     - 使用 `URL.createObjectURL()` 创建本地预览 URL
     - 加载视频元数据后获取原始宽高
     - 显示主体区域，隐藏导入按钮
   
   **3.2 视频尺寸调整模块**
   - `loadVideoMetadata()` 方法：监听视频加载完成事件，获取并填充原始宽高
   - `updateVideoDimensions()` 方法：点击确定按钮时调整视频显示尺寸
     - 参数：width (number), height (number)
     - 更新视频元素的 width 和 height 属性
   - `calculateAspectRatio()` 方法：保持宽高比计算
     - 参数：changedDimension (string), value (number), originalRatio (number)
     - 返回：计算后的另一维度数值
     - 当用户修改一个输入框时，自动计算另一个
   
   **3.3 截图模块**
   - `captureScreenshot()` 方法：截取当前视频帧
     - 创建 Canvas 元素，尺寸与输入框一致
     - 使用 `canvas.drawImage(video, ...)` 绘制当前帧
     - 调用 `canvas.toBlob()` 生成 JPEG 格式图片
     - 返回：Blob 对象
   - `displayScreenshot()` 方法：在截图展示区添加截图卡片
     - 参数：imageBlob (Blob), timestamp (string)
     - 生成预览图、下载按钮、删除按钮
     - 添加到截图容器
   - `generateTimestamp()` 方法：生成文件名时间戳
     - 返回：格式化的时间字符串（screenshot_YYYYMMDD_HHMMSS）
   
   **3.4 下载与删除模块**
   - `downloadScreenshot()` 方法：触发图片下载
     - 参数：imageBlob (Blob), filename (string)
     - 使用 `URL.createObjectURL()` 创建临时 URL
     - 创建隐藏 `<a>` 元素触发下载
     - 下载后释放 URL
   - `deleteScreenshot()` 方法：删除指定截图卡片
     - 参数：cardElement (HTMLElement)
     - 从 DOM 中移除元素
     - 释放关联的 Blob URL

4. **事件绑定与初始化**
   - `init()` 方法：页面加载完成后初始化
     - 绑定文件输入事件
     - 绑定确定按钮点击事件
     - 绑定截图按钮点击事件
     - 绑定宽高输入框的 input 事件（实时计算宽高比）
     - 初始化 DOM 元素引用
   - 使用 `DOMContentLoaded` 事件触发初始化

**Verification**

1. **功能测试**
   - 点击"导入视频"按钮，选择本地 MP4 文件，验证视频是否正常加载和播放
   - 验证默认宽高是否为视频原始尺寸
   - 修改宽度输入框，验证高度是否自动计算并保持宽高比
   - 点击确定按钮，验证视频显示尺寸是否变化
   - 播放视频到任意位置，点击截图按钮，验证是否生成截图
   - 点击下载按钮，验证截图文件是否下载且文件名正确
   - 点击删除按钮，验证截图是否从页面移除
   - 多次截图，验证是否都正常展示

2. **浏览器测试**
   - 在 Chrome、Firefox、Safari 中测试基本功能

3. **边界测试**
   - 上传非视频文件（应该被 accept 属性拦截）
   - 输入负数或非数字宽高（需要验证处理）
   - 视频未加载完成时点击截图（应禁用或提示）

**Decisions**

- **截图格式**：选择 JPEG 而非 PNG，文件体积更小，适合多次截图场景
- **宽高比**：保持原始宽高比，避免视频变形，提升用户体验
- **文件命名**：使用时间戳确保文件名唯一性
- **文件结构**：分离 HTML/CSS/JS，便于代码维护和后续扩展
