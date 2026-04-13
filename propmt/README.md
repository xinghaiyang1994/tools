# propmt

一个基于原生 `HTML`、`CSS` 和 `JavaScript` 的本地 Prompt 编辑器，适合快速编写、保存并预览 Markdown 内容。当前版本已支持 `Mermaid` 流程图预览，且第三方依赖已全部本地化，可在离线环境中使用。

## 功能概览
- 大尺寸输入区，适合长文本编辑。
- 自动保存输入内容到 `localStorage`，刷新页面后可恢复。
- 支持 `Tab` 键缩进，便于编写代码块或结构化文本。
- 支持 Markdown 实时预览。
- 支持 ` ```mermaid ` 代码块渲染流程图。
- Mermaid 渲染失败时，会显示错误提示和原始源码。
- 内置多组常用模板按钮，可一键填充 Prompt 模板。
- 底部状态栏显示保存状态、字符数和行数。

## 目录结构
```text
.
├── index.html
├── AGENTS.md
├── README.md
├── assets
│   ├── css
│   │   └── style.css
│   ├── js
│   │   ├── app.js
│   │   └── preview-utils.js
│   └── vendor
│       ├── marked.min.js
│       └── mermaid.min.js
└── tests
    └── preview-utils.test.js
```

## 本地运行
本项目不需要打包，直接打开即可：

```bash
open index.html
```

如果需要通过本地服务访问：

```bash
python3 -m http.server 8000
```

然后访问 `http://localhost:8000`。

## 使用说明
1. 在输入框中编辑 Prompt 或 Markdown 内容。
2. 内容会自动保存到 `localStorage`，键名为 `my_propmt_input`。
3. 点击“预览markdown”切换左右分栏预览模式。
4. 在 Markdown 中使用 ` ```mermaid ` 代码块可预览流程图。
5. 点击模板按钮可快速替换当前输入内容。

## 模板配置
模板定义位于 [app.js](/Users/admin/code/myWeb/tools/propmt/assets/js/app.js) 顶部的 `templates` 数组中，新增模板时保持以下结构：

```js
{
    name: '模板名称',
    content: '模板内容'
}
```

## 测试命令
当前仓库使用 Node 内置测试运行器验证预览工具函数：

```bash
node --test tests/preview-utils.test.js
```

## 依赖说明
- `marked.min.js`：本地 Markdown 渲染库。
- `mermaid.min.js`：本地 Mermaid 图表渲染库。

如需升级依赖，请替换 `assets/vendor/` 下对应文件，并回归验证 Markdown 与 Mermaid 预览功能。
