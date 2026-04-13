(function createPreviewUtilsModule(globalFactory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = globalFactory();
        return;
    }

    if (typeof window !== 'undefined') {
        window.PreviewUtils = globalFactory();
    }
})(function previewUtilsFactory() {
    /**
     * 对 HTML 特殊字符进行转义，避免源码回显时被浏览器当作标签解析。
     *
     * @param {string} value 需要转义的原始字符串。
     * @returns {string} 转义后的安全字符串。
     */
    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * 将常见的 HTML 实体解码回原始字符，便于恢复 Mermaid 源码文本。
     *
     * @param {string} value 包含 HTML 实体的字符串。
     * @returns {string} 解码后的普通字符串。
     */
    function decodeHtmlEntities(value) {
        return String(value)
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, '\'')
            .replace(/&amp;/g, '&');
    }

    /**
     * 生成 Mermaid 图表容器 ID，确保每个图块都有稳定且唯一的挂载点。
     *
     * @param {number} index Mermaid 图块序号。
     * @returns {string} 对应的图表容器 ID。
     */
    function createMermaidRenderId(index) {
        return `mermaid-diagram-${index}`;
    }

    /**
     * 生成 Mermaid 渲染失败时的回退 HTML，展示错误信息和原始源码。
     *
     * @param {string} source Mermaid 原始源码。
     * @param {string} message Mermaid 渲染报错信息。
     * @returns {string} 可直接写入 DOM 的错误态 HTML 字符串。
     */
    function createMermaidErrorMarkup(source, message) {
        return [
            '<div class="mermaid-error-card">',
            '<div class="mermaid-error-title">Mermaid 渲染失败</div>',
            `<div class="mermaid-error-message">${escapeHtml(message)}</div>`,
            '<pre class="mermaid-error-source"><code>',
            escapeHtml(source),
            '</code></pre>',
            '</div>',
        ].join('');
    }

    /**
     * 为 Markdown 渲染出的表格补充独立滚动容器，避免宽表格被预览区直接裁切。
     *
     * @param {string} html Markdown 渲染后的 HTML 字符串。
     * @returns {string} 包含表格滚动容器的 HTML 字符串。
     */
    function wrapTablesForPreview(html) {
        return String(html).replace(/<table>/g, '<div class="table-scroll-shell"><table>').replace(/<\/table>/g, '</table></div>');
    }

    /**
     * 将 Mermaid 缩放比例限制在允许区间内，避免图表缩放失控。
     *
     * @param {number} scale 当前或目标缩放比例。
     * @param {number} minScale 允许的最小缩放比例。
     * @param {number} maxScale 允许的最大缩放比例。
     * @returns {number} 落在限制区间内的缩放比例。
     */
    function clampMermaidScale(scale, minScale, maxScale) {
        return Math.min(Math.max(scale, minScale), maxScale);
    }

    /**
     * 计算内容按容器完整展示时的缩放比例，不主动放大小图。
     *
     * @param {number} contentWidth 内容原始宽度。
     * @param {number} contentHeight 内容原始高度。
     * @param {number | null} containerWidth 容器可用宽度。
     * @param {number | null} containerHeight 容器可用高度。
     * @returns {number} 可用于完整展示内容的初始缩放比例。
     */
    function computeFitScale(contentWidth, contentHeight, containerWidth, containerHeight) {
        const widthRatio = containerWidth ? containerWidth / contentWidth : 1;
        const heightRatio = containerHeight ? containerHeight / contentHeight : 1;
        return Math.min(widthRatio, heightRatio, 1);
    }

    /**
     * 根据原始尺寸与缩放比例，计算缩放后的宽高。
     *
     * @param {number} width 原始宽度。
     * @param {number} height 原始高度。
     * @param {number} scale 当前缩放比例。
     * @returns {{ width: number, height: number }} 缩放后的宽高对象。
     */
    function computeScaledSize(width, height, scale) {
        return {
            width: width * scale,
            height: height * scale,
        };
    }

    /**
     * 生成 Mermaid 预览工具栏 HTML，提供缩放与查看大图入口。
     *
     * @returns {string} Mermaid 工具栏 HTML 字符串。
     */
    function createMermaidToolbarMarkup() {
        return [
            '<div class="mermaid-toolbar-title">Mermaid 流程图</div>',
            '<div class="mermaid-toolbar-actions">',
            '<button type="button" class="mermaid-toolbar-btn" data-action="zoom-out">缩小</button>',
            '<button type="button" class="mermaid-toolbar-btn" data-action="zoom-in">放大</button>',
            '<button type="button" class="mermaid-toolbar-btn" data-action="zoom-reset">重置</button>',
            '<button type="button" class="mermaid-toolbar-btn mermaid-toolbar-btn-primary" data-action="open-modal">查看大图</button>',
            '</div>',
        ].join('');
    }

    /**
     * 从 SVG 的 viewBox 属性中解析可用宽高，便于恢复 Mermaid 的真实基础尺寸。
     *
     * @param {string | null} viewBox SVG viewBox 属性值。
     * @returns {{ width: number, height: number } | null} 解析后的尺寸对象；无法解析时返回 null。
     */
    function getSvgViewBoxSize(viewBox) {
        if (!viewBox) {
            return null;
        }

        const parts = String(viewBox)
            .trim()
            .split(/\s+/)
            .map((item) => Number(item));

        if (parts.length !== 4 || parts.some((item) => Number.isNaN(item))) {
            return null;
        }

        return {
            width: parts[2],
            height: parts[3],
        };
    }

    /**
     * 生成 Mermaid 弹层 HTML，用于在页面级复用缩放与拖拽查看能力。
     *
     * @returns {string} Mermaid 弹层 HTML 字符串。
     */
    function createMermaidModalMarkup() {
        return [
            '<div id="mermaidModal" class="mermaid-modal hidden" aria-hidden="true">',
            '<div class="mermaid-modal-backdrop" data-action="close-modal"></div>',
            '<div class="mermaid-modal-panel" role="dialog" aria-modal="true" aria-label="Mermaid 大图预览">',
            '<div class="mermaid-modal-toolbar">',
            '<div class="mermaid-modal-title">Mermaid 大图</div>',
            '<div class="mermaid-modal-actions">',
            '<button type="button" class="mermaid-toolbar-btn" data-action="modal-zoom-out">缩小</button>',
            '<button type="button" class="mermaid-toolbar-btn" data-action="modal-zoom-in">放大</button>',
            '<button type="button" class="mermaid-toolbar-btn" data-action="modal-zoom-reset">重置</button>',
            '<button type="button" class="mermaid-toolbar-btn mermaid-toolbar-btn-primary" data-action="close-modal">关闭</button>',
            '</div>',
            '</div>',
            '<div class="mermaid-modal-viewport" id="mermaidModalViewport">',
            '<div class="mermaid-modal-stage" id="mermaidModalStage"></div>',
            '</div>',
            '</div>',
            '</div>',
        ].join('');
    }

    /**
     * 根据输入区与预览区状态，推导按钮文案和主区域布局策略。
     *
     * @param {boolean} isInputHidden 当前输入区是否隐藏。
     * @param {boolean} isPreviewVisible 当前预览区是否可见。
     * @returns {{ toggleLabel: string, shouldHideEditor: boolean, shouldExpandPreview: boolean }} 布局状态对象。
     */
    function resolveInputVisibilityState(isInputHidden, isPreviewVisible) {
        return {
            toggleLabel: isInputHidden ? '显示输入' : '隐藏输入',
            shouldHideEditor: isInputHidden,
            shouldExpandPreview: isInputHidden && isPreviewVisible,
        };
    }

    return {
        clampMermaidScale,
        computeFitScale,
        computeScaledSize,
        createMermaidModalMarkup,
        createMermaidToolbarMarkup,
        escapeHtml,
        decodeHtmlEntities,
        createMermaidErrorMarkup,
        createMermaidRenderId,
        resolveInputVisibilityState,
        wrapTablesForPreview,
        getSvgViewBoxSize,
    };
});
