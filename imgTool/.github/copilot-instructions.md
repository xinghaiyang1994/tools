# Project Guidelines

## 概述
这是一个独立的 Web 图片处理工具，采用纯前端技术（HTML/CSS/JS），无需服务端。

## 代码风格

### JavaScript
- 使用 ES6+ 语法（`const`/`let`、箭头函数、模板字符串）
- 每个函数必须添加 **JSDoc 注释**，包含：用途说明、`@param` 参数类型和说明、`@returns` 返回值类型和说明
- 参考示例：[main.js](../main.js) 中的 `handleImportClick()`、`loadImage()` 等函数
- DOM 元素引用集中在文件顶部声明
- 全局状态变量使用 `let` 声明并添加行内注释

### HTML
- 使用语义化标签（`<header>`、`<main>`、`<section>`）
- 关键区域添加 HTML 注释说明用途
- 参考：[index.html](../index.html)

### CSS
- BEM 风格命名：`.btn`、`.btn-primary`、`.control-group`
- 使用 CSS 变量或直接写颜色值（当前项目直接写）
- 响应式布局使用 `@media` 查询
- 参考：[style.css](../style.css)

## 架构
```
imgTool/
├── index.html   # 页面结构和 DOM
├── style.css    # 样式表
├── main.js      # 交互逻辑（事件处理、Canvas 操作）
└── origin.md    # 需求文档
```
- **独立性原则**：不引入目录外的文件，所有资源自包含
- 图片处理使用 FileReader API 读取、Canvas API 缩放导出

## 核心功能
- **图片导入**：通过隐藏 `<input type="file">` 触发文件选择
- **尺寸调整**：宽高输入框 + 锁定比例复选框，锁定时自动计算另一维度
- **对比图片**：导入主图后可加载对比图，共享宽高设置
- **下载导出**：Canvas API 绑定目标尺寸，`toBlob()` 生成 PNG 下载

## 项目约定

### 注释规范
- 保留所有注释，修改代码时同步更新相关注释
- 函数 JSDoc 格式：
```javascript
/**
 * 函数用途描述
 * 
 * @param {类型} 参数名 - 参数说明
 * @returns {类型} 返回值说明
 */
```

### 文件引用
- HTML 中使用相对路径引用：`./style.css`、`./main.js`

## 验证
- 直接用浏览器打开 `index.html` 进行功能测试
- 无需构建工具或依赖安装
