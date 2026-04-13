const test = require('node:test');
const assert = require('node:assert/strict');

const {
    INDENT_UNIT,
    indentSelection,
    outdentSelection,
} = require('../assets/js/editor-indent-utils.js');

/**
 * 验证单光标按下 `Tab` 时会在当前位置插入两个空格。
 *
 * @returns {void}
 */
test('indentSelection should insert two spaces at the caret for single-line input', () => {
    const result = indentSelection('abc', 1, 1);

    assert.equal(result.value, 'a  bc');
    assert.equal(result.selectionStart, 3);
    assert.equal(result.selectionEnd, 3);
    assert.equal(INDENT_UNIT, '  ');
});

/**
 * 验证多行选区按下 `Tab` 时会对选中的每一行统一增加两个空格缩进。
 *
 * @returns {void}
 */
test('indentSelection should indent every selected line by two spaces', () => {
    const source = 'alpha\nbeta\ngamma';
    const result = indentSelection(source, 2, source.length);

    assert.equal(result.value, '  alpha\n  beta\n  gamma');
    assert.equal(result.selectionStart, 4);
    assert.equal(result.selectionEnd, result.value.length);
});

/**
 * 验证单光标按下 `Shift+Tab` 时会删除当前行前导最多两个空格。
 *
 * @returns {void}
 */
test('outdentSelection should remove up to two leading spaces from the current line', () => {
    const source = '  alpha';
    const result = outdentSelection(source, 4, 4);

    assert.equal(result.value, 'alpha');
    assert.equal(result.selectionStart, 2);
    assert.equal(result.selectionEnd, 2);
});

/**
 * 验证多行选区按下 `Shift+Tab` 时会逐行删除前导最多两个空格。
 *
 * @returns {void}
 */
test('outdentSelection should outdent every selected line and tolerate short indentation', () => {
    const source = '  alpha\n beta\ngamma';
    const result = outdentSelection(source, 0, source.length);

    assert.equal(result.value, 'alpha\nbeta\ngamma');
    assert.equal(result.selectionStart, 0);
    assert.equal(result.selectionEnd, result.value.length);
});
