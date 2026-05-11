# Repository Guidelines

## Project Structure & Module Organization

本仓库当前是一个纯静态 SQL 工具目录，不依赖构建系统或后端服务。

- `index.html`：页面结构、输入区、按钮和输出区。
- `styles.css`：页面布局、响应式样式、输入输出区域和按钮样式。
- `script.js`：SQL 空白压缩、基础格式化、复制结果和事件绑定逻辑。

资源引用应使用当前目录相对路径，例如 `./styles.css`、`./script.js`。新增资源建议放在当前目录或未来的 `assets/` 目录中，并保持引用路径清晰。

## Build, Test, and Development Commands

本项目无需安装依赖，也没有编译步骤。

```bash
python3 -m http.server 8123
```

启动本地静态服务，访问 `http://127.0.0.1:8123/index.html` 进行手动验证。

```bash
node -e "const { formatSql } = require('./script.js'); console.log(formatSql('select * from users where id = 1'))"
```

快速验证核心 SQL 格式化函数是否可在 Node 环境中加载和运行。

## Coding Style & Naming Conventions

- 使用 2 个空格缩进。
- HTML 元素使用语义化标签，按钮和输入区必须具备清晰的 `id` 或 `aria-label`。
- CSS 类名使用 kebab-case，例如 `.input-box`、`.button-primary`。
- JavaScript 使用 camelCase 命名函数和变量，例如 `formatSql`、`toSingleLineSql`。
- 新增或修改 JS 方法必须添加 Javadoc 风格注释，说明用途、参数类型和返回值。
- 保持无第三方依赖，除非需求明确需要专业 SQL parser 或 formatter。

## Testing Guidelines

当前没有测试框架。提交前至少完成以下验证：

- 在浏览器中打开页面，确认 `格式化`、`一行展示`、`复制结果` 可用。
- 使用包含多空格、换行、`WHERE`、`JOIN`、`ORDER BY` 的 SQL 手动检查输出。
- 使用 Node 命令验证 `script.js` 导出的核心函数。

若后续添加测试文件，建议命名为 `*.test.js`，并优先覆盖 `formatSql`、`toSingleLineSql` 等纯函数。

## Commit & Pull Request Guidelines

提交历史采用 Conventional Commit 风格，例如：

- `feat: 增加 SQL 格式化工具`
- `fix(sql): 修复 JOIN 换行规则`
- `style(ui): 调整按钮间距`

Pull Request 应包含变更说明、验证步骤、相关截图或录屏（涉及 UI 时必需），并说明是否引入依赖或改变静态资源路径。

## Agent-Specific Instructions

生成的文档、计划和报告默认使用简体中文。代码、命令、路径、API 名称和环境变量保持英文。修改代码时避免无关重构，优先保持纯静态、可直接打开的使用方式。
