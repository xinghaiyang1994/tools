(function createEditorIndentUtilsModule(globalFactory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = globalFactory();
        return;
    }

    if (typeof window !== 'undefined') {
        window.EditorIndentUtils = globalFactory();
    }
})(function editorIndentUtilsFactory() {
    const INDENT_UNIT = '  ';

    /**
     * 计算指定位置所在行的起始下标。
     *
     * @param {string} value 当前完整文本内容。
     * @param {number} index 需要定位的原始下标。
     * @returns {number} 对应行的起始下标。
     */
    function getLineStartIndex(value, index) {
        const safeIndex = Math.max(0, Math.min(index, value.length));
        const previousBreakIndex = value.lastIndexOf('\n', Math.max(0, safeIndex - 1));
        return previousBreakIndex === -1 ? 0 : previousBreakIndex + 1;
    }

    /**
     * 计算指定位置所在行的结束下标，不包含换行符本身。
     *
     * @param {string} value 当前完整文本内容。
     * @param {number} index 需要定位的原始下标。
     * @returns {number} 对应行的结束下标。
     */
    function getLineEndIndex(value, index) {
        const safeIndex = Math.max(0, Math.min(index, value.length));
        const nextBreakIndex = value.indexOf('\n', safeIndex);
        return nextBreakIndex === -1 ? value.length : nextBreakIndex;
    }

    /**
     * 将任意选区扩展到完整行范围，便于按编辑器习惯进行逐行缩进。
     *
     * @param {string} value 当前完整文本内容。
     * @param {number} selectionStart 选区开始下标。
     * @param {number} selectionEnd 选区结束下标。
     * @returns {{ lineStart: number, lineEnd: number }} 覆盖完整行的选区范围。
     */
    function expandSelectionToLines(value, selectionStart, selectionEnd) {
        const lineStart = getLineStartIndex(value, selectionStart);
        const normalizedEnd = selectionEnd > selectionStart ? selectionEnd - 1 : selectionEnd;
        const lineEnd = getLineEndIndex(value, normalizedEnd);

        return {
            lineStart,
            lineEnd,
        };
    }

    /**
     * 根据每行前缀变更量，换算原始光标或选区下标在新文本中的位置。
     *
     * @param {number} index 原始文本中的下标。
     * @param {Array<{ lineStart: number, delta: number }>} lineChanges 逐行前缀变更列表。
     * @param {number} nextValueLength 变更后文本总长度。
     * @returns {number} 变更后的对应下标。
     */
    function transformSelectionIndex(index, lineChanges, nextValueLength) {
        const nextIndex = lineChanges.reduce((currentIndex, lineChange) => {
            if (lineChange.lineStart <= index) {
                return currentIndex + lineChange.delta;
            }

            return currentIndex;
        }, index);

        return Math.max(0, Math.min(nextIndex, nextValueLength));
    }

    /**
     * 对当前光标位置插入一个标准缩进单位。
     *
     * @param {string} value 当前完整文本内容。
     * @param {number} selectionStart 光标开始下标。
     * @param {number} selectionEnd 光标结束下标。
     * @returns {{ value: string, selectionStart: number, selectionEnd: number }} 插入缩进后的文本与光标位置。
     */
    function indentAtCaret(value, selectionStart, selectionEnd) {
        const nextValue = `${value.slice(0, selectionStart)}${INDENT_UNIT}${value.slice(selectionEnd)}`;
        const nextSelectionStart = selectionStart + INDENT_UNIT.length;

        return {
            value: nextValue,
            selectionStart: nextSelectionStart,
            selectionEnd: nextSelectionStart,
        };
    }

    /**
     * 将选区覆盖到的完整行统一增加两个空格缩进。
     *
     * @param {string} value 当前完整文本内容。
     * @param {number} selectionStart 选区开始下标。
     * @param {number} selectionEnd 选区结束下标。
     * @returns {{ value: string, selectionStart: number, selectionEnd: number }} 缩进后的文本与选区范围。
     */
    function indentSelection(value, selectionStart, selectionEnd) {
        if (selectionStart === selectionEnd) {
            return indentAtCaret(value, selectionStart, selectionEnd);
        }

        const { lineStart, lineEnd } = expandSelectionToLines(value, selectionStart, selectionEnd);
        const selectedBlock = value.slice(lineStart, lineEnd);
        const selectedLines = selectedBlock.split('\n');
        const lineChanges = [];
        let lineOffset = 0;

        const nextBlock = selectedLines.map((line) => {
            lineChanges.push({
                lineStart: lineStart + lineOffset,
                delta: INDENT_UNIT.length,
            });
            lineOffset += line.length + 1;
            return `${INDENT_UNIT}${line}`;
        }).join('\n');

        const nextValue = `${value.slice(0, lineStart)}${nextBlock}${value.slice(lineEnd)}`;

        return {
            value: nextValue,
            selectionStart: transformSelectionIndex(selectionStart, lineChanges, nextValue.length),
            selectionEnd: transformSelectionIndex(selectionEnd, lineChanges, nextValue.length),
        };
    }

    /**
     * 计算一行开头最多可删除的空格数量，作为反缩进单位。
     *
     * @param {string} line 当前行文本。
     * @returns {number} 实际可删除的前导空格数量。
     */
    function getRemovableIndentLength(line) {
        const matchedSpaces = line.match(/^ {1,2}/);
        return matchedSpaces ? matchedSpaces[0].length : 0;
    }

    /**
     * 对当前光标所在行执行反缩进，删除前导最多两个空格。
     *
     * @param {string} value 当前完整文本内容。
     * @param {number} selectionStart 光标开始下标。
     * @param {number} selectionEnd 光标结束下标。
     * @returns {{ value: string, selectionStart: number, selectionEnd: number }} 反缩进后的文本与光标位置。
     */
    function outdentAtCaret(value, selectionStart, selectionEnd) {
        const lineStart = getLineStartIndex(value, selectionStart);
        const lineEnd = getLineEndIndex(value, selectionStart);
        const lineContent = value.slice(lineStart, lineEnd);
        const removedLength = getRemovableIndentLength(lineContent);

        if (removedLength === 0) {
            return {
                value,
                selectionStart,
                selectionEnd,
            };
        }

        const nextValue = `${value.slice(0, lineStart)}${lineContent.slice(removedLength)}${value.slice(lineEnd)}`;
        const nextSelectionStart = Math.max(lineStart, selectionStart - removedLength);

        return {
            value: nextValue,
            selectionStart: nextSelectionStart,
            selectionEnd: nextSelectionStart,
        };
    }

    /**
     * 将选区覆盖到的完整行统一执行反缩进，逐行删除前导最多两个空格。
     *
     * @param {string} value 当前完整文本内容。
     * @param {number} selectionStart 选区开始下标。
     * @param {number} selectionEnd 选区结束下标。
     * @returns {{ value: string, selectionStart: number, selectionEnd: number }} 反缩进后的文本与选区范围。
     */
    function outdentSelection(value, selectionStart, selectionEnd) {
        if (selectionStart === selectionEnd) {
            return outdentAtCaret(value, selectionStart, selectionEnd);
        }

        const { lineStart, lineEnd } = expandSelectionToLines(value, selectionStart, selectionEnd);
        const selectedBlock = value.slice(lineStart, lineEnd);
        const selectedLines = selectedBlock.split('\n');
        const lineChanges = [];
        let lineOffset = 0;

        const nextBlock = selectedLines.map((line) => {
            const removedLength = getRemovableIndentLength(line);

            lineChanges.push({
                lineStart: lineStart + lineOffset,
                delta: -removedLength,
            });
            lineOffset += line.length + 1;

            return line.slice(removedLength);
        }).join('\n');

        const nextValue = `${value.slice(0, lineStart)}${nextBlock}${value.slice(lineEnd)}`;

        return {
            value: nextValue,
            selectionStart: transformSelectionIndex(selectionStart, lineChanges, nextValue.length),
            selectionEnd: transformSelectionIndex(selectionEnd, lineChanges, nextValue.length),
        };
    }

    return {
        INDENT_UNIT,
        indentSelection,
        outdentSelection,
    };
});
