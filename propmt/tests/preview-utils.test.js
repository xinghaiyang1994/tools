const test = require('node:test');
const assert = require('node:assert/strict');

const {
    escapeHtml,
    decodeHtmlEntities,
    createMermaidErrorMarkup,
    createMermaidRenderId,
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
