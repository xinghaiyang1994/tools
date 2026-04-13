const test = require('node:test');
const assert = require('node:assert/strict');

const {
    clampMermaidScale,
    computeScaledSize,
    computeFitScale,
    createMermaidToolbarMarkup,
    escapeHtml,
    decodeHtmlEntities,
    createMermaidErrorMarkup,
    createMermaidRenderId,
    getSvgViewBoxSize,
    resolveInputVisibilityState,
    wrapTablesForPreview,
} = require('../assets/js/preview-utils.js');

/**
 * 验证 Mermaid 错误态源码区域中的 HTML 特殊字符会被安全转义。
 *
 * @returns {void}
 */
test('createMermaidErrorMarkup should escape source code and preserve error message', () => {
    const markup = createMermaidErrorMarkup('graph TD;<A>-->B', 'Parse error');

    assert.match(markup, /Parse error/);
    assert.match(markup, /graph TD;&lt;A&gt;--&gt;B/);
});

/**
 * 验证 Markdown 渲染后的代码块内容可以被正确解码回 Mermaid 原文。
 *
 * @returns {void}
 */
test('decodeHtmlEntities should decode common HTML entities used in code blocks', () => {
    const decoded = decodeHtmlEntities('A &gt; B &amp;&amp; C &lt; D &#39;X&#39; &quot;Y&quot;');

    assert.equal(decoded, 'A > B && C < D \'X\' "Y"');
});

/**
 * 验证 Mermaid 渲染容器 ID 具备稳定前缀，便于逐块渲染和定位。
 *
 * @returns {void}
 */
test('createMermaidRenderId should create stable ids for diagram containers', () => {
    assert.equal(createMermaidRenderId(3), 'mermaid-diagram-3');
});

/**
 * 验证转义工具会对注入敏感字符进行编码。
 *
 * @returns {void}
 */
test('escapeHtml should escape sensitive html characters', () => {
    assert.equal(
        escapeHtml('<div class="x">Tom & Jerry</div>'),
        '&lt;div class=&quot;x&quot;&gt;Tom &amp; Jerry&lt;/div&gt;'
    );
});

/**
 * 验证 Markdown 表格会被独立的横向滚动容器包裹，避免宽表格被预览区裁切。
 *
 * @returns {void}
 */
test('wrapTablesForPreview should wrap table markup with a scroll shell', () => {
    const html = '<p>before</p><table><thead><tr><th>A</th></tr></thead><tbody><tr><td>B</td></tr></tbody></table><p>after</p>';
    const wrappedHtml = wrapTablesForPreview(html);

    assert.match(wrappedHtml, /<div class="table-scroll-shell"><table>/);
    assert.match(wrappedHtml, /<\/table><\/div><p>after<\/p>/);
});

/**
 * 验证 Mermaid 缩放比例会被约束在允许区间内，避免过小或过大。
 *
 * @returns {void}
 */
test('clampMermaidScale should constrain scale within the provided range', () => {
    assert.equal(clampMermaidScale(0.2, 0.6, 2.5), 0.6);
    assert.equal(clampMermaidScale(3.1, 0.6, 2.5), 2.5);
    assert.equal(clampMermaidScale(1.4, 0.6, 2.5), 1.4);
});

/**
 * 验证 Mermaid 初始缩放会按容器宽度自适应，避免默认出现横向滚动条。
 *
 * @returns {void}
 */
test('computeFitScale should fit content into container width without enlarging small diagrams', () => {
    assert.equal(computeFitScale(1200, 400, 600, null), 0.5);
    assert.equal(computeFitScale(400, 300, 600, null), 1);
    assert.equal(computeFitScale(400, 1200, 600, 300), 0.25);
});

/**
 * 验证缩放后的宽高会按比例同步变化，便于直接设置 SVG 尺寸而不是使用 transform。
 *
 * @returns {void}
 */
test('computeScaledSize should return scaled width and height', () => {
    assert.deepEqual(computeScaledSize(200, 100, 0.5), { width: 100, height: 50 });
    assert.deepEqual(computeScaledSize(120, 80, 1.2), { width: 144, height: 96 });
});

/**
 * 验证 Mermaid 工具栏会输出缩放和查看大图所需的操作按钮。
 *
 * @returns {void}
 */
test('createMermaidToolbarMarkup should include zoom and modal actions', () => {
    const markup = createMermaidToolbarMarkup();

    assert.match(markup, /data-action="zoom-in"/);
    assert.match(markup, /data-action="zoom-out"/);
    assert.match(markup, /data-action="zoom-reset"/);
    assert.match(markup, /data-action="open-modal"/);
});

/**
 * 验证 Mermaid SVG 可从 viewBox 中提取真实尺寸，避免默认显示过小。
 *
 * @returns {void}
 */
test('getSvgViewBoxSize should parse width and height from viewBox', () => {
    assert.deepEqual(getSvgViewBoxSize('0 0 124 382'), { width: 124, height: 382 });
    assert.equal(getSvgViewBoxSize(null), null);
});

/**
 * 验证输入区显隐状态会正确驱动按钮文案和预览全宽布局。
 *
 * @returns {void}
 */
test('resolveInputVisibilityState should return button label and preview width mode', () => {
    assert.deepEqual(resolveInputVisibilityState(false, false), {
        toggleLabel: '隐藏输入',
        shouldHideEditor: false,
        shouldExpandPreview: false,
    });
    assert.deepEqual(resolveInputVisibilityState(true, true), {
        toggleLabel: '显示输入',
        shouldHideEditor: true,
        shouldExpandPreview: true,
    });
    assert.deepEqual(resolveInputVisibilityState(true, false), {
        toggleLabel: '显示输入',
        shouldHideEditor: true,
        shouldExpandPreview: false,
    });
});
