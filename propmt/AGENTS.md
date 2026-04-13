# Repository Guidelines

## 项目结构与模块组织
本仓库是一个纯静态前端工具页，无构建层。核心文件位于仓库根目录：

- `index.html`：页面结构与第三方脚本引入。
- `script.js`：编辑器交互、模板切换、`localStorage` 持久化、Markdown 预览逻辑。
- `style.css`：整体布局、按钮样式、编辑区与预览区样式。
- `README.md`：需求背景与页面功能说明。

新增资源建议按职责拆分，例如 `assets/` 存放静态资源，`docs/` 存放补充文档。

## 构建、测试与开发命令
当前项目无需安装依赖，也没有打包流程，开发时直接在浏览器中打开页面即可：

- `open index.html`：在本机浏览器中打开页面进行调试。
- `python3 -m http.server 8000`：启动本地静态服务，便于验证脚本和资源加载。

如后续引入格式化、Lint 或自动化测试，请同步更新本文件。

## 编码风格与命名规范
- HTML、CSS、JavaScript 统一使用 4 空格缩进。
- 变量与函数使用 `camelCase`，常量使用全大写下划线风格，例如 `STORAGE_KEY`。
- DOM ID 与 class 使用语义化命名，例如 `togglePreview`、`preview-container`。
- 修改 `js` 逻辑时，必须补充完整注释；新增方法需添加 Javadoc 风格注释，说明用途、参数和返回值。
- 复杂流程建议在 Markdown 文档中补充 Mermaid 流程图。

## 测试指南
当前仓库未接入测试框架，提交前至少完成手工回归：

- 验证输入内容可写入并从 `localStorage` 的 `my_propmt_input` 正确恢复。
- 验证 Tab 缩进、模板替换、Markdown 预览开关与实时渲染。
- 验证桌面端常见浏览器下布局正常，无明显样式错位。

如果后续新增自动化测试，测试文件建议放入 `tests/` 或与源码同目录，命名使用 `*.test.js`。

## 提交与 Pull Request 规范
从现有 Git 历史看，仓库采用 Conventional Commit 风格，当前主要使用 `feat:`，例如 `feat: 图片处理工具`。新增修复建议使用 `fix:`，文档使用 `docs:`。

Pull Request 应包含：

- 变更目的与影响范围。
- 关键界面变更截图或录屏。
- 手工验证步骤与结果。
- 关联 issue 或需求说明（如有）。
