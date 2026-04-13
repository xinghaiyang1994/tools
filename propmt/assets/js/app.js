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
const toggleInputBtn = document.getElementById('toggleInput');
const previewContainer = document.getElementById('previewContainer');
const previewContent = document.getElementById('previewContent');
const templateButtons = document.getElementById('templateButtons');
const editorContainer = document.querySelector('.editor-container');

// 本地存储键名
const STORAGE_KEY = 'my_propmt_input';
const INDENT_UNIT = EditorIndentUtils.INDENT_UNIT;

// 输入区可见状态
let isInputHidden = false;

// Mermaid 缩放相关配置
const MERMAID_MIN_SCALE = 0.6;
const MERMAID_MAX_SCALE = 2.4;
const MERMAID_SCALE_STEP = 0.2;

// Mermaid 图表计数器与视图状态
let mermaidDiagramCounter = 0;
const mermaidViewStates = new Map();
const mermaidModalState = {
    activeDiagramId: null,
    isDragging: false,
    lastPointerX: 0,
    lastPointerY: 0,
};

// Mermaid 弹层引用缓存
let mermaidModalElement = null;
let mermaidModalStageElement = null;
let mermaidModalViewportElement = null;

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
    initMermaidModal();

    textEditor.addEventListener('input', handleInput);
    textEditor.addEventListener('keydown', handleKeyDown);
    previewContent.addEventListener('click', handlePreviewClick);
    window.addEventListener('beforeunload', saveToLocalStorage);
    document.addEventListener('keydown', handleDocumentKeyDown);
    togglePreviewBtn.addEventListener('click', togglePreview);
    toggleInputBtn.addEventListener('click', toggleInputVisibility);

    applyEditorPreviewLayout();

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
 * 初始化 Mermaid 弹层，并绑定缩放、关闭与拖拽事件。
 *
 * @returns {void}
 */
function initMermaidModal() {
    document.body.insertAdjacentHTML('beforeend', PreviewUtils.createMermaidModalMarkup());

    mermaidModalElement = document.getElementById('mermaidModal');
    mermaidModalStageElement = document.getElementById('mermaidModalStage');
    mermaidModalViewportElement = document.getElementById('mermaidModalViewport');

    mermaidModalElement.addEventListener('click', handleMermaidModalClick);
    mermaidModalViewportElement.addEventListener('mousedown', startMermaidModalDrag);
    document.addEventListener('mousemove', handleMermaidModalDrag);
    document.addEventListener('mouseup', stopMermaidModalDrag);
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
 * 在编辑器中拦截 `Tab` / `Shift + Tab`，并按编辑器行为处理两个空格缩进。
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
    const indentResult = event.shiftKey
        ? EditorIndentUtils.outdentSelection(textEditor.value, start, end)
        : EditorIndentUtils.indentSelection(textEditor.value, start, end);

    textEditor.value = indentResult.value;
    textEditor.selectionStart = indentResult.selectionStart;
    textEditor.selectionEnd = indentResult.selectionEnd;
    textEditor.dispatchEvent(new Event('input'));
    showStatus(event.shiftKey ? `已减少${INDENT_UNIT.length}个空格缩进` : `已插入${INDENT_UNIT.length}个空格缩进`, 'success');
}

/**
 * 监听页面级按键事件，用于通过 `Esc` 关闭 Mermaid 弹层。
 *
 * @param {KeyboardEvent} event 当前按键事件对象。
 * @returns {void}
 */
function handleDocumentKeyDown(event) {
    if (event.key === 'Escape' && mermaidModalState.activeDiagramId) {
        closeMermaidModal();
    }
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
        applyEditorPreviewLayout();
        updatePreview().catch((error) => {
            renderPreviewError(`Mermaid 预览异常: ${error.message}`);
        });
        return;
    }

    previewContainer.classList.add('hidden');
    editorContainer.classList.remove('half-width');
    togglePreviewBtn.textContent = '预览markdown';
    applyEditorPreviewLayout();
}

/**
 * 切换输入区显隐状态，并同步按钮文案与主区域布局。
 *
 * @returns {void}
 */
function toggleInputVisibility() {
    isInputHidden = !isInputHidden;
    applyEditorPreviewLayout();

    if (!isInputHidden) {
        textEditor.focus();
    }
}

/**
 * 根据当前输入区与预览区状态，统一更新按钮文案和布局类名。
 *
 * @returns {void}
 */
function applyEditorPreviewLayout() {
    const layoutState = PreviewUtils.resolveInputVisibilityState(
        isInputHidden,
        !previewContainer.classList.contains('hidden')
    );

    toggleInputBtn.textContent = layoutState.toggleLabel;
    editorContainer.classList.toggle('hidden', layoutState.shouldHideEditor);
    previewContainer.classList.toggle('full-width', layoutState.shouldExpandPreview);

    if (!layoutState.shouldHideEditor) {
        editorContainer.classList.toggle('half-width', !previewContainer.classList.contains('hidden'));
    } else {
        editorContainer.classList.remove('half-width');
    }
}

/**
 * 更新右侧预览区域，先渲染 Markdown，再逐块渲染 Mermaid 流程图。
 *
 * @returns {Promise<void>} 渲染流程完成后的 Promise。
 */
async function updatePreview() {
    try {
        mermaidViewStates.clear();
        closeMermaidModal();
        previewContent.innerHTML = PreviewUtils.wrapTablesForPreview(marked.parse(textEditor.value));
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
    wrapper.dataset.diagramId = renderId;
    wrapper.innerHTML = `
        <div class="mermaid-toolbar">
            ${PreviewUtils.createMermaidToolbarMarkup()}
        </div>
        <div class="mermaid-diagram-shell">
            <div class="mermaid-diagram-canvas">
                <div class="mermaid-diagram" id="${renderId}"></div>
            </div>
        </div>
    `;

    parentPre.replaceWith(wrapper);

    try {
        const renderResult = await mermaid.render(renderId, sourceCode);
        const canvasElement = wrapper.querySelector('.mermaid-diagram-canvas');
        canvasElement.innerHTML = `
            <div class="mermaid-diagram">
                ${renderResult.svg}
            </div>
        `;
        const diagramElement = wrapper.querySelector('.mermaid-diagram');
        registerMermaidDiagramState(wrapper, diagramElement);
        applyMermaidPreviewState(renderId);
    } catch (error) {
        wrapper.innerHTML = PreviewUtils.createMermaidErrorMarkup(sourceCode, error.message);
        showStatus('Mermaid 图表存在语法错误', 'error');
    }
}

/**
 * 根据当前 SVG 尺寸建立 Mermaid 图块状态，供预览与弹层共用。
 *
 * @param {HTMLElement} wrapper Mermaid 图块根节点。
 * @param {HTMLElement} diagramElement Mermaid 图表容器节点。
 * @returns {void}
 */
function registerMermaidDiagramState(wrapper, diagramElement) {
    const svgElement = diagramElement.querySelector('svg');
    const diagramShell = wrapper.querySelector('.mermaid-diagram-shell');
    const viewBoxSize = PreviewUtils.getSvgViewBoxSize(svgElement.getAttribute('viewBox'));
    const svgWidth = viewBoxSize?.width || parseFloat(svgElement.getAttribute('width')) || svgElement.getBoundingClientRect().width || 800;
    const svgHeight = viewBoxSize?.height || parseFloat(svgElement.getAttribute('height')) || svgElement.getBoundingClientRect().height || 600;
    const shellRect = diagramShell.getBoundingClientRect();
    const availableWidth = Math.max(diagramShell.clientWidth - 40, 240);
    const availableHeight = Math.max(window.innerHeight - shellRect.top - 32, 220);
    const fitScale = PreviewUtils.computeFitScale(svgWidth, svgHeight, availableWidth, availableHeight - 40);

    svgElement.removeAttribute('width');
    svgElement.removeAttribute('height');
    svgElement.style.width = `${svgWidth}px`;
    svgElement.style.height = `${svgHeight}px`;
    svgElement.style.transformOrigin = 'top left';
    diagramShell.style.maxHeight = `${availableHeight}px`;

    mermaidViewStates.set(wrapper.dataset.diagramId, {
        wrapper,
        svgMarkup: diagramElement.innerHTML,
        baseWidth: svgWidth,
        baseHeight: svgHeight,
        previewMaxHeight: availableHeight,
        previewFitScale: fitScale,
        previewScale: fitScale,
        modalScale: 1,
        modalPanX: 0,
        modalPanY: 0,
    });
}

/**
 * 统一处理预览区 Mermaid 工具栏点击事件。
 *
 * @param {MouseEvent} event 当前点击事件对象。
 * @returns {void}
 */
function handlePreviewClick(event) {
    const actionButton = event.target.closest('[data-action]');

    if (!actionButton) {
        return;
    }

    const mermaidBlock = actionButton.closest('.mermaid-block');

    if (!mermaidBlock) {
        return;
    }

    const diagramId = mermaidBlock.dataset.diagramId;
    const action = actionButton.dataset.action;

    if (action === 'zoom-in') {
        updateMermaidPreviewScale(diagramId, MERMAID_SCALE_STEP);
        return;
    }

    if (action === 'zoom-out') {
        updateMermaidPreviewScale(diagramId, -MERMAID_SCALE_STEP);
        return;
    }

    if (action === 'zoom-reset') {
        resetMermaidPreviewScale(diagramId);
        return;
    }

    if (action === 'open-modal') {
        openMermaidModal(diagramId);
    }
}

/**
 * 更新预览区 Mermaid 图表缩放比例。
 *
 * @param {string} diagramId Mermaid 图块唯一标识。
 * @param {number} step 当前操作需要增减的缩放步进值。
 * @returns {void}
 */
function updateMermaidPreviewScale(diagramId, step) {
    const state = mermaidViewStates.get(diagramId);

    if (!state) {
        return;
    }

    state.previewScale = PreviewUtils.clampMermaidScale(
        Number((state.previewScale + step).toFixed(2)),
        MERMAID_MIN_SCALE,
        MERMAID_MAX_SCALE
    );
    applyMermaidPreviewState(diagramId);
}

/**
 * 重置预览区 Mermaid 图表到默认缩放比例。
 *
 * @param {string} diagramId Mermaid 图块唯一标识。
 * @returns {void}
 */
function resetMermaidPreviewScale(diagramId) {
    const state = mermaidViewStates.get(diagramId);

    if (!state) {
        return;
    }

    state.previewScale = state.previewFitScale;
    applyMermaidPreviewState(diagramId);
}

/**
 * 将当前预览缩放状态应用到对应 Mermaid 图表节点。
 *
 * @param {string} diagramId Mermaid 图块唯一标识。
 * @returns {void}
 */
function applyMermaidPreviewState(diagramId) {
    const state = mermaidViewStates.get(diagramId);

    if (!state) {
        return;
    }

    const diagramElement = state.wrapper.querySelector('.mermaid-diagram');
    const canvasElement = state.wrapper.querySelector('.mermaid-diagram-canvas');
    const svgElement = diagramElement.querySelector('svg');
    const scaledSize = PreviewUtils.computeScaledSize(state.baseWidth, state.baseHeight, state.previewScale);

    canvasElement.style.width = `${scaledSize.width}px`;
    canvasElement.style.height = `${scaledSize.height}px`;
    svgElement.style.width = `${scaledSize.width}px`;
    svgElement.style.height = `${scaledSize.height}px`;
    svgElement.style.transform = '';
    state.wrapper.querySelector('.mermaid-diagram-shell').style.maxHeight = `${state.previewMaxHeight}px`;
}

/**
 * 打开 Mermaid 弹层，并渲染当前图表的大图视图。
 *
 * @param {string} diagramId Mermaid 图块唯一标识。
 * @returns {void}
 */
function openMermaidModal(diagramId) {
    const state = mermaidViewStates.get(diagramId);

    if (!state) {
        return;
    }

    mermaidModalState.activeDiagramId = diagramId;
    mermaidModalElement.classList.remove('hidden');
    mermaidModalElement.setAttribute('aria-hidden', 'false');
    document.body.classList.add('mermaid-modal-open');

    mermaidModalStageElement.innerHTML = state.svgMarkup;
    state.modalScale = state.previewScale;
    state.modalPanX = 0;
    state.modalPanY = 0;
    applyMermaidModalState();
}

/**
 * 关闭 Mermaid 弹层并重置拖拽状态。
 *
 * @returns {void}
 */
function closeMermaidModal() {
    mermaidModalState.activeDiagramId = null;
    mermaidModalState.isDragging = false;

    if (!mermaidModalElement) {
        return;
    }

    mermaidModalElement.classList.add('hidden');
    mermaidModalElement.setAttribute('aria-hidden', 'true');
    mermaidModalStageElement.innerHTML = '';
    document.body.classList.remove('mermaid-modal-open');
}

/**
 * 处理 Mermaid 弹层内的按钮点击，包括缩放、重置和关闭。
 *
 * @param {MouseEvent} event 当前点击事件对象。
 * @returns {void}
 */
function handleMermaidModalClick(event) {
    const actionButton = event.target.closest('[data-action]');

    if (!actionButton) {
        return;
    }

    const action = actionButton.dataset.action;

    if (action === 'close-modal') {
        closeMermaidModal();
        return;
    }

    if (!mermaidModalState.activeDiagramId) {
        return;
    }

    const state = mermaidViewStates.get(mermaidModalState.activeDiagramId);

    if (!state) {
        return;
    }

    if (action === 'modal-zoom-in') {
        state.modalScale = PreviewUtils.clampMermaidScale(
            Number((state.modalScale + MERMAID_SCALE_STEP).toFixed(2)),
            MERMAID_MIN_SCALE,
            MERMAID_MAX_SCALE
        );
        applyMermaidModalState();
        return;
    }

    if (action === 'modal-zoom-out') {
        state.modalScale = PreviewUtils.clampMermaidScale(
            Number((state.modalScale - MERMAID_SCALE_STEP).toFixed(2)),
            MERMAID_MIN_SCALE,
            MERMAID_MAX_SCALE
        );
        applyMermaidModalState();
        return;
    }

    if (action === 'modal-zoom-reset') {
        state.modalScale = 1;
        state.modalPanX = 0;
        state.modalPanY = 0;
        applyMermaidModalState();
    }
}

/**
 * 开始 Mermaid 弹层中的拖拽平移，仅在非按钮区域响应。
 *
 * @param {MouseEvent} event 当前鼠标按下事件对象。
 * @returns {void}
 */
function startMermaidModalDrag(event) {
    if (!mermaidModalState.activeDiagramId || event.target.closest('button')) {
        return;
    }

    mermaidModalState.isDragging = true;
    mermaidModalState.lastPointerX = event.clientX;
    mermaidModalState.lastPointerY = event.clientY;
    mermaidModalViewportElement.classList.add('is-dragging');
}

/**
 * 在 Mermaid 弹层中根据鼠标移动更新图表平移位置。
 *
 * @param {MouseEvent} event 当前鼠标移动事件对象。
 * @returns {void}
 */
function handleMermaidModalDrag(event) {
    if (!mermaidModalState.isDragging || !mermaidModalState.activeDiagramId) {
        return;
    }

    const state = mermaidViewStates.get(mermaidModalState.activeDiagramId);

    if (!state) {
        return;
    }

    const deltaX = event.clientX - mermaidModalState.lastPointerX;
    const deltaY = event.clientY - mermaidModalState.lastPointerY;

    mermaidModalState.lastPointerX = event.clientX;
    mermaidModalState.lastPointerY = event.clientY;
    state.modalPanX += deltaX;
    state.modalPanY += deltaY;
    applyMermaidModalState();
}

/**
 * 结束 Mermaid 弹层中的拖拽平移交互。
 *
 * @returns {void}
 */
function stopMermaidModalDrag() {
    mermaidModalState.isDragging = false;

    if (mermaidModalViewportElement) {
        mermaidModalViewportElement.classList.remove('is-dragging');
    }
}

/**
 * 将当前 Mermaid 弹层状态应用到大图视图。
 *
 * @returns {void}
 */
function applyMermaidModalState() {
    const state = mermaidViewStates.get(mermaidModalState.activeDiagramId);

    if (!state) {
        return;
    }

    const svgElement = mermaidModalStageElement.querySelector('svg');

    if (!svgElement) {
        return;
    }

    svgElement.style.transformOrigin = 'top left';
    mermaidModalStageElement.style.width = `${state.baseWidth}px`;
    mermaidModalStageElement.style.height = `${state.baseHeight}px`;
    mermaidModalStageElement.style.transform = `translate(${state.modalPanX}px, ${state.modalPanY}px) scale(${state.modalScale})`;
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
