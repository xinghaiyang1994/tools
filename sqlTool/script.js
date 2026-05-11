(function () {
  "use strict";

  var EMPTY_MESSAGE = "请先输入 SQL 语句。";
  var COPY_SUCCESS_MESSAGE = "结果已复制到剪贴板。";
  var COPY_FAILURE_MESSAGE = "复制失败，请手动选择结果内容。";

  /**
   * 将 SQL 文本中的连续空白字符压缩成单个空格。
   *
   * @param {string} sql - 用户输入的原始 SQL 文本。
   * @returns {string} 返回去除首尾空白并压缩连续空白后的 SQL 文本。
   */
  function normalizeWhitespace(sql) {
    return String(sql || "").replace(/\s+/g, " ").trim();
  }

  /**
   * 将 SQL 文本转换为单行展示形式。
   *
   * @param {string} sql - 用户输入的原始 SQL 文本。
   * @returns {string} 返回单行 SQL；如果输入为空则返回空字符串。
   */
  function toSingleLineSql(sql) {
    return normalizeWhitespace(sql);
  }

  /**
   * 在指定 SQL 关键字前插入换行符，提升查询结构的可读性。
   *
   * @param {string} sql - 已完成空白压缩的单行 SQL。
   * @returns {string} 返回按主要 SQL 关键字换行后的 SQL 文本。
   */
  function breakBeforeMajorKeywords(sql) {
    var majorKeywordPattern =
      /\b(select|from|where|left\s+join|right\s+join|inner\s+join|outer\s+join|full\s+join|cross\s+join|join|group\s+by|order\s+by|having|limit|offset|values|set|insert\s+into|update|delete\s+from)\b/gi;

    return sql.replace(majorKeywordPattern, function (keyword, _match, offset) {
      return offset === 0 ? keyword : "\n" + keyword;
    });
  }

  /**
   * 在条件连接关键字前插入缩进换行，便于阅读 WHERE 和 HAVING 条件。
   *
   * @param {string} sql - 已按主要 SQL 关键字换行的 SQL 文本。
   * @returns {string} 返回对 AND/OR 增加缩进后的 SQL 文本。
   */
  function indentConditionKeywords(sql) {
    return sql.replace(/\s+\b(and|or)\b\s+/gi, function (_match, keyword) {
      return "\n  " + keyword + " ";
    });
  }

  /**
   * 对 SQL 文本执行基础格式化。
   *
   * @param {string} sql - 用户输入的原始 SQL 文本。
   * @returns {string} 返回格式化后的多行 SQL；如果输入为空则返回空字符串。
   */
  function formatSql(sql) {
    var normalizedSql = normalizeWhitespace(sql);

    if (!normalizedSql) {
      return "";
    }

    return indentConditionKeywords(breakBeforeMajorKeywords(normalizedSql));
  }

  /**
   * 将处理结果渲染到输出区域。
   *
   * @param {HTMLElement} outputElement - 用于展示结果的页面元素。
   * @param {string} result - 需要展示的 SQL 处理结果。
   * @returns {void} 无返回值。
   */
  function renderResult(outputElement, result) {
    outputElement.textContent = result || EMPTY_MESSAGE;
  }

  /**
   * 读取输入框内容并按指定处理器生成 SQL 结果。
   *
   * @param {HTMLTextAreaElement} inputElement - SQL 输入框元素。
   * @param {HTMLElement} outputElement - SQL 输出区域元素。
   * @param {Function} transformer - SQL 转换函数。
   * @returns {void} 无返回值。
   */
  function handleTransform(inputElement, outputElement, transformer) {
    renderResult(outputElement, transformer(inputElement.value));
  }

  /**
   * 将输出区域内容复制到系统剪贴板，并在输出为空时给出提示。
   *
   * @param {HTMLElement} outputElement - SQL 输出区域元素。
   * @returns {Promise<void>} 返回复制流程的 Promise。
   */
  function copyOutput(outputElement) {
    var content = outputElement.textContent.trim();

    if (!content || content === EMPTY_MESSAGE) {
      renderResult(outputElement, "");
      return Promise.resolve();
    }

    if (!navigator.clipboard) {
      outputElement.textContent = COPY_FAILURE_MESSAGE + "\n\n" + content;
      return Promise.resolve();
    }

    return navigator.clipboard
      .writeText(content)
      .then(function () {
        outputElement.textContent = COPY_SUCCESS_MESSAGE + "\n\n" + content;
      })
      .catch(function () {
        outputElement.textContent = COPY_FAILURE_MESSAGE + "\n\n" + content;
      });
  }

  /**
   * 绑定页面按钮事件，启动 SQL 格式化工具。
   *
   * @returns {void} 无返回值。
   */
  function initSqlTool() {
    var inputElement = document.getElementById("sqlInput");
    var outputElement = document.getElementById("sqlOutput");
    var formatButton = document.getElementById("formatButton");
    var singleLineButton = document.getElementById("singleLineButton");
    var copyButton = document.getElementById("copyButton");

    if (!inputElement || !outputElement || !formatButton || !singleLineButton || !copyButton) {
      return;
    }

    formatButton.addEventListener("click", function () {
      handleTransform(inputElement, outputElement, formatSql);
    });

    singleLineButton.addEventListener("click", function () {
      handleTransform(inputElement, outputElement, toSingleLineSql);
    });

    copyButton.addEventListener("click", function () {
      copyOutput(outputElement);
    });
  }

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", initSqlTool);
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      formatSql: formatSql,
      toSingleLineSql: toSingleLineSql,
      normalizeWhitespace: normalizeWhitespace
    };
  }
})();
