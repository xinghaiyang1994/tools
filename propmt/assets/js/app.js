// 模板定义
const templates = [
    {
        name: '生成代码',
        content: `角色：你是一名资深前端工程师，熟悉 TypeScript、React、CSS。

目标：{在这里写你想要 ChatGPT 做的事}

规则：
- 每个方法添加Javadoc注释，描述当前方法的用途，参数类型和说明，返回值类型和说明
- 保留注释
- 使用 TypeScript
- 生成完检查是否有 TypeScript 报错,如果有则需要修复`,
    },
    {
        name: '排查问题',
        content: `角色：全栈技术专家。

目标：根据报错信息分析可能原因，并给出定位方法。

输出结构：
1. 报错含义
2. 可能原因（按概率排序）
3. 建议排查步骤
4. 修复方法示例（如适用）

--- error ---
{error message}
`,
    },
    {
        name: '排查问题(前端)',
        content: `角色：前端调试专家。

目标：根据报错信息分析可能原因，并给出定位方法。

输出结构：
1. 报错含义
2. 可能原因（按概率排序）
3. 建议排查步骤
4. 修复方法示例（如适用）

--- error ---
{error message}
--- code(optional) ---
{相关代码}`,
    },
    {
        name: 'review代码',
        content: `角色：前端技术专家。

目标：review以下代码，从下面几个方面给出改进建议：
1. 代码规范
2. 性能优化
3. 可维护性
4. 可读性
5. 安全性

--- code ---
{相关代码}`,
    },
    {
        name: '分析代码',
        content: `角色：前端技术专家。

目标：分析下面代码的功能和逻辑，并给出详细说明。

规则：
- 需要有流程图及详细流程分析
- 需要关键技术与优化点分析

--- code ---
{相关代码}`,
    },
];

// 获取 DOM 元素
const textEditor = document.getElementById('textEditor');
const statusElement = document.getElementById('status');
const charCountElement = document.getElementById('charCount');
const togglePreviewBtn = document.getElementById('togglePreview');
const previewContainer = document.getElementById('previewContainer');
const previewContent = document.getElementById('previewContent');
const templateButtons = document.getElementById('templateButtons');
const editorContainer = document.querySelector('.editor-container');

// 本地存储键名
const STORAGE_KEY = 'my_propmt_input';

// Mermaid 图表计数器，用于生成稳定容器 ID
let mermaidDiagramCounter = 0;

// 复用防抖函数，避免每次输入都重建计时器
const debouncedSaveToLocalStorage = debounce(saveToLocalStorage, 500);
const debouncedUpdatePreview = debounce(() => {
    updatePreview().catch((error) => {
        renderPreviewError(`Mermaid 预览异常: ${error.message}`);
    });
}, 300);

/**
 * 初始化页面状态、事件监听和第三方库配置。
 *
 * @returns {void}
 */
function init() {
    const savedText = localStorage.getItem(STORAGE_KEY);

    if (savedText) {
        textEditor.value = savedText;
        updateCharCount();
        showStatus('已加载保存的内容', 'success');
    }

    initTemplateButtons();
    initMarkdownRenderer();
    initMermaidRenderer();

    textEditor.addEventListener('input', handleInput);
    textEditor.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', saveToLocalStorage);
    togglePreviewBtn.addEventListener('click', togglePreview);

    textEditor.focus();
}

/**
 * 初始化模板按钮区域，并为每个模板挂载点击事件。
 *
 * @returns {void}
 */
function initTemplateButtons() {
    templates.forEach((template) => {
        const button = document.createElement('button');
        button.className = 'template-btn';
        button.textContent = template.name;
        button.title = `应用${template.name}模板`;
        button.addEventListener('click', () => {
            applyTemplate(template.content);
        });
        templateButtons.appendChild(button);
    });
}

/**
 * 配置 Markdown 渲染器，保持当前 GFM 与换行行为。
 *
 * @returns {void}
 */
function initMarkdownRenderer() {
    marked.setOptions({
        breaks: true,
        gfm: true,
    });
}

/**
 * 初始化 Mermaid，并关闭默认的自动扫描行为，避免它接管整页渲染。
 *
 * @returns {void}
 */
function initMermaidRenderer() {
    mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
        },
    });
}

/**
 * 将模板文本写入编辑器，并同步刷新统计、存储与预览。
 *
 * @param {string} content 模板正文内容。
 * @returns {void}
 */
function applyTemplate(content) {
    textEditor.value = content;
    updateCharCount();
    saveToLocalStorage();
    showStatus(`已应用模板: ${content.split('\n')[0].replace('#', '').trim()}`, 'success');

    if (!previewContainer.classList.contains('hidden')) {
        updatePreview().catch((error) => {
            renderPreviewError(`Mermaid 预览异常: ${error.message}`);
        });
    }

    textEditor.focus();
}

/**
 * 处理用户输入，更新统计信息并触发防抖保存与预览。
 *
 * @returns {void}
 */
function handleInput() {
    updateCharCount();
    debouncedSaveToLocalStorage();
    showStatus('保存中...', 'saving');

    if (!previewContainer.classList.contains('hidden')) {
        debouncedUpdatePreview();
    }
}

/**
 * 更新底部字符与行数统计信息。
 *
 * @returns {void}
 */
function updateCharCount() {
    const count = textEditor.value.length;
    const lines = textEditor.value.split('\n').length;
    charCountElement.textContent = `${count} 字符, ${lines} 行`;
}

/**
 * 将当前编辑内容保存到浏览器本地存储。
 *
 * @returns {void}
 */
function saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEY, textEditor.value);
    showStatus('已保存', 'success');
}

/**
 * 更新状态栏文案与颜色，用于提示保存和错误状态。
 *
 * @param {string} message 状态提示文案。
 * @param {string} type 状态类型，例如 `success`、`saving`、`error`。
 * @returns {void}
 */
function showStatus(message, type) {
    statusElement.textContent = message;

    if (type === 'success') {
        statusElement.style.color = '#28a745';
        return;
    }

    if (type === 'saving') {
        statusElement.style.color = '#ffc107';
        return;
    }

    if (type === 'error') {
        statusElement.style.color = '#e53e3e';
        return;
    }

    statusElement.style.color = '#6c757d';
}

/**
 * 创建防抖包装函数，合并高频触发的重复调用。
 *
 * @param {Function} func 需要被防抖的目标函数。
 * @param {number} wait 延迟执行时间，单位为毫秒。
 * @returns {Function} 包装后的防抖函数。
 */
function debounce(func, wait) {
    let timeout;

    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 在编辑器中拦截 `Tab` 键，并插入缩进字符。
 *
 * @param {KeyboardEvent} event 当前键盘事件对象。
 * @returns {void}
 */
function handleKeyDown(event) {
    if (event.key !== 'Tab') {
        return;
    }

    event.preventDefault();

    const start = textEditor.selectionStart;
    const end = textEditor.selectionEnd;

    textEditor.value = `${textEditor.value.substring(0, start)}\t${textEditor.value.substring(end)}`;
    textEditor.selectionStart = start + 1;
    textEditor.selectionEnd = start + 1;
    textEditor.dispatchEvent(new Event('input'));
}

/**
 * 切换 Markdown 预览区域显隐，并在打开时触发首次渲染。
 *
 * @returns {void}
 */
function togglePreview() {
    if (previewContainer.classList.contains('hidden')) {
        previewContainer.classList.remove('hidden');
        editorContainer.classList.add('half-width');
        togglePreviewBtn.textContent = '隐藏markdown';
        updatePreview().catch((error) => {
            renderPreviewError(`Mermaid 预览异常: ${error.message}`);
        });
        return;
    }

    previewContainer.classList.add('hidden');
    editorContainer.classList.remove('half-width');
    togglePreviewBtn.textContent = '预览markdown';
}

/**
 * 更新右侧预览区域，先渲染 Markdown，再逐块渲染 Mermaid 流程图。
 *
 * @returns {Promise<void>} 渲染流程完成后的 Promise。
 */
async function updatePreview() {
    try {
        previewContent.innerHTML = marked.parse(textEditor.value);
        await renderMermaidBlocks(previewContent);
    } catch (error) {
        renderPreviewError(`渲染错误: ${error.message}`);
    }
}

/**
 * 扫描预览区中的 Mermaid 代码块，并逐块替换为实际图表或错误回退。
 *
 * @param {HTMLElement} container 预览区域根节点。
 * @returns {Promise<void>} 所有 Mermaid 图块处理完成后的 Promise。
 */
async function renderMermaidBlocks(container) {
    const mermaidCodeBlocks = Array.from(
        container.querySelectorAll('pre code.language-mermaid, pre code[class*="language-mermaid"]')
    );

    for (const codeElement of mermaidCodeBlocks) {
        // 每个 Mermaid 图块单独 try/catch，避免单块失败影响其他内容。
        await renderSingleMermaidBlock(codeElement);
    }
}

/**
 * 将单个 Mermaid 代码块替换成图表容器，并执行 Mermaid 渲染。
 *
 * @param {HTMLElement} codeElement Mermaid 对应的 `<code>` 节点。
 * @returns {Promise<void>} 单个图块处理完成后的 Promise。
 */
async function renderSingleMermaidBlock(codeElement) {
    const sourceCode = getCodeBlockSource(codeElement);
    const parentPre = codeElement.closest('pre');
    const wrapper = document.createElement('div');
    const renderId = PreviewUtils.createMermaidRenderId(mermaidDiagramCounter);

    mermaidDiagramCounter += 1;

    wrapper.className = 'mermaid-block';
    wrapper.innerHTML = `
        <div class="mermaid-toolbar">Mermaid 流程图</div>
        <div class="mermaid-diagram-shell">
            <div class="mermaid-diagram" id="${renderId}"></div>
        </div>
    `;

    parentPre.replaceWith(wrapper);

    try {
        const renderResult = await mermaid.render(renderId, sourceCode);
        const diagramShell = wrapper.querySelector('.mermaid-diagram-shell');
        diagramShell.innerHTML = `
            <div class="mermaid-diagram">
                ${renderResult.svg}
            </div>
        `;
    } catch (error) {
        wrapper.innerHTML = PreviewUtils.createMermaidErrorMarkup(sourceCode, error.message);
        showStatus('Mermaid 图表存在语法错误', 'error');
    }
}

/**
 * 获取代码块中的原始文本内容，并在必要时做 HTML 实体解码。
 *
 * @param {HTMLElement} codeElement 当前代码块节点。
 * @returns {string} Mermaid 原始源码文本。
 */
function getCodeBlockSource(codeElement) {
    const rawText = codeElement.textContent || codeElement.innerText || '';
    return PreviewUtils.decodeHtmlEntities(rawText).trim();
}

/**
 * 在预览区域输出整体渲染错误卡片，并同步状态栏提示。
 *
 * @param {string} message 错误提示信息。
 * @returns {void}
 */
function renderPreviewError(message) {
    previewContent.innerHTML = `
        <div class="preview-error-card">
            <strong>预览渲染失败</strong>
            <div>${PreviewUtils.escapeHtml(message)}</div>
        </div>
    `;
    showStatus('预览渲染失败', 'error');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
