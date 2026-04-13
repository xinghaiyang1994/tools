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

    return {
        escapeHtml,
        decodeHtmlEntities,
        createMermaidErrorMarkup,
        createMermaidRenderId,
    };
});
