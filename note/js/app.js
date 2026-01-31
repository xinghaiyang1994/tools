/**
 * Web 笔记应用主脚本
 * 
 * 功能：
 * - Markdown 实时预览（使用 markdown-it）
 * - 代码语法高亮（使用 highlight.js）
 * - 本地数据持久化（使用 localStorage）
 * - Tab 键缩进支持
 */

/** localStorage 存储键名 */
const STORAGE_KEY = 'sea-web-note-content';

/** markdown-it 实例 */
let md = null;

/** DOM 元素引用 */
let editorWrapper = null;
let editor = null;
let preview = null;
let container = null;
let clearBtn = null;
let previewBtn = null;
let inputBtn = null;
let exportBtn = null;
let wordCountEl = null;

/** 状态标记 */
let isPreviewMode = false;
let isInputHidden = false;

/**
 * 初始化应用
 * 
 * 初始化 markdown-it 实例（配置 highlight.js），
 * 获取 DOM 元素引用，加载本地数据，绑定事件监听。
 * 
 * @returns {void}
 */
function init() {
    // 初始化 mermaid
    mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose'
    });

    // 初始化 markdown-it，配置代码高亮
    md = window.markdownit({
        html: true,
        linkify: true,
        typographer: true,
        highlight: function (str, lang) {
            // mermaid 代码块特殊处理
            if (lang === 'mermaid') {
                return '<div class="mermaid">' + str + '</div>';
            }
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return '<pre class="hljs"><code>' +
                        hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                        '</code></pre>';
                } catch (__) {}
            }
            return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
        }
    });

    // 添加任务列表（checkbox）支持
    enableTaskLists(md);

    // 获取 DOM 元素
    editorWrapper = document.getElementById('editorWrapper');
    editor = document.getElementById('editor');
    preview = document.getElementById('preview');
    container = document.getElementById('container');
    clearBtn = document.getElementById('clearBtn');
    previewBtn = document.getElementById('previewBtn');
    inputBtn = document.getElementById('inputBtn');
    exportBtn = document.getElementById('exportBtn');
    wordCountEl = document.getElementById('wordCount');

    // 加载本地数据
    const savedContent = loadFromLocal();
    if (savedContent) {
        editor.value = savedContent;
    }

    // 初始化字数统计
    updateWordCount(editor.value);

    // 绑定按钮点击事件
    clearBtn.addEventListener('click', clearContent);
    previewBtn.addEventListener('click', togglePreview);
    inputBtn.addEventListener('click', toggleInput);
    exportBtn.addEventListener('click', exportMarkdown);

    // 绑定文本输入事件
    editor.addEventListener('input', handleInput);

    // 绑定 Tab 键事件
    editor.addEventListener('keydown', handleTabKey);
}

/**
 * 清空输入区域内容
 * 
 * 清空 textarea 的内容，更新 localStorage，
 * 如果预览模式开启则同时清空预览区域。
 * 
 * @returns {void}
 */
function clearContent() {
    editor.value = '';
    saveToLocal('');
    updateWordCount('');
    
    if (isPreviewMode) {
        preview.innerHTML = '';
    }
}

/**
 * 切换预览模式
 * 
 * 开启预览时：添加 preview-mode 类，显示预览区域，渲染 Markdown 内容，
 * 按钮文本变为"隐藏预览"。
 * 隐藏预览时：移除 preview-mode 类，隐藏预览区域，
 * 按钮文本变为"开启预览"。
 * 
 * @returns {void}
 */
function togglePreview() {
    isPreviewMode = !isPreviewMode;

    if (isPreviewMode) {
        container.classList.add('preview-mode');
        previewBtn.textContent = '隐藏预览';
        renderMarkdown(editor.value);
    } else {
        container.classList.remove('preview-mode');
        previewBtn.textContent = '开启预览';
        preview.innerHTML = '';
    }
}

/**
 * 切换输入区域显示/隐藏
 * 
 * 隐藏输入时：添加 input-hidden 类，隐藏输入区域，
 * 按钮文本变为"开启输入"。
 * 开启输入时：移除 input-hidden 类，显示输入区域，
 * 按钮文本变为"隐藏输入"。
 * 
 * @returns {void}
 */
function toggleInput() {
    isInputHidden = !isInputHidden;

    if (isInputHidden) {
        container.classList.add('input-hidden');
        inputBtn.textContent = '开启输入';
    } else {
        container.classList.remove('input-hidden');
        inputBtn.textContent = '隐藏输入';
        // 重新聚焦到编辑器
        editor.focus();
    }
}

/**
 * 渲染 Markdown 内容到预览区域
 * 
 * 使用 markdown-it 将输入文本转换为 HTML，
 * 并显示在预览区域中。代码块会通过 highlight.js 进行语法高亮。
 * Mermaid 代码块会被渲染为图表。
 * 
 * @param {string} text - 要渲染的 Markdown 文本
 * @returns {void}
 */
function renderMarkdown(text) {
    if (!md) return;
    preview.innerHTML = md.render(text || '');
    
    // 渲染 mermaid 图表
    renderMermaid();
}

/**
 * 渲染预览区域中的 Mermaid 图表
 * 
 * 查找预览区域中所有 .mermaid 元素，
 * 使用 mermaid.js 将其渲染为 SVG 图表。
 * 
 * @returns {void}
 */
async function renderMermaid() {
    const mermaidElements = preview.querySelectorAll('.mermaid');
    if (mermaidElements.length === 0) return;
    
    // 为每个 mermaid 元素生成唯一 ID 并渲染
    for (let i = 0; i < mermaidElements.length; i++) {
        const element = mermaidElements[i];
        const graphDefinition = element.textContent;
        const id = `mermaid-${Date.now()}-${i}`;
        
        try {
            const { svg } = await mermaid.render(id, graphDefinition);
            element.innerHTML = svg;
        } catch (error) {
            element.innerHTML = `<pre class="mermaid-error">图表渲染失败: ${error.message}</pre>`;
        }
    }
}

/**
 * 处理 Tab 键按下事件
 * 
 * 阻止默认的 Tab 键行为（切换焦点），
 * 在光标位置插入制表符实现缩进功能。
 * 
 * @param {KeyboardEvent} event - 键盘事件对象
 * @returns {void}
 */
function handleTabKey(event) {
    if (event.key === 'Tab') {
        event.preventDefault();

        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const value = editor.value;

        // 在光标位置插入制表符
        editor.value = value.substring(0, start) + '\t' + value.substring(end);

        // 将光标移动到制表符之后
        editor.selectionStart = editor.selectionEnd = start + 1;

        // 触发 input 事件以保存和更新预览
        handleInput();
    }
}

/**
 * 处理输入事件
 * 
 * 当用户在 textarea 中输入内容时，
 * 保存内容到 localStorage，如果预览模式开启则更新预览。
 * 
 * @returns {void}
 */
function handleInput() {
    const content = editor.value;
    saveToLocal(content);
    updateWordCount(content);

    if (isPreviewMode) {
        renderMarkdown(content);
    }
}

/**
 * 保存内容到 localStorage
 * 
 * 将笔记内容存储到浏览器本地存储中，
 * 以便下次访问时可以恢复。
 * 
 * @param {string} content - 要保存的内容
 * @returns {void}
 */
function saveToLocal(content) {
    try {
        localStorage.setItem(STORAGE_KEY, content);
    } catch (e) {
        console.error('保存到本地存储失败:', e);
    }
}

/**
 * 从 localStorage 加载内容
 * 
 * 从浏览器本地存储中读取之前保存的笔记内容。
 * 
 * @returns {string|null} 返回保存的内容，如果没有则返回 null
 */
function loadFromLocal() {
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
        console.error('从本地存储加载失败:', e);
        return null;
    }
}

/**
 * 更新字数统计显示
 * 
 * 统计文本内容的字符数（不含空白字符）并更新状态栏显示。
 * 
 * @param {string} text - 要统计的文本内容
 * @returns {void}
 */
function updateWordCount(text) {
    if (!wordCountEl) return;
    
    // 移除空白字符后统计字数
    const count = (text || '').replace(/\s/g, '').length;
    wordCountEl.textContent = `字数：${count}`;
}

/**
 * 导出 Markdown 文件
 * 
 * 将输入区域的内容导出为 .md 文件，
 * 文件名格式为 note-年月日时分秒.md
 * 
 * @returns {void}
 */
function exportMarkdown() {
    const content = editor.value;
    
    // 生成文件名：note-YYYYMMDDHHmmss.md
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const filename = `note-${year}${month}${day}${hours}${minutes}${seconds}.md`;
    
    // 创建 Blob 对象
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    
    // 清理
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * 启用任务列表（checkbox）支持
 * 
 * 为 markdown-it 添加 GitHub 风格的任务列表渲染支持，
 * 将 `- [ ]` 渲染为未选中的复选框，`- [x]` 渲染为选中的复选框。
 * 
 * @param {Object} md - markdown-it 实例
 * @returns {void}
 */
function enableTaskLists(md) {
    // 保存原始的列表项渲染函数
    const originalListItemOpen = md.renderer.rules.list_item_open || function(tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
    };

    // 重写列表项渲染规则
    md.renderer.rules.list_item_open = function(tokens, idx, options, env, self) {
        const token = tokens[idx];
        
        // 查找列表项内容
        const contentToken = tokens[idx + 2];
        if (contentToken && contentToken.type === 'inline' && contentToken.content) {
            const content = contentToken.content;
            
            // 检查是否为任务列表项
            const checkedMatch = content.match(/^\[x\]\s+/i);
            const uncheckedMatch = content.match(/^\[\s?\]\s+/);
            
            if (checkedMatch) {
                // 选中状态
                token.attrPush(['class', 'task-list-item']);
                contentToken.content = content.replace(/^\[x\]\s+/i, '');
                contentToken.children[0].content = contentToken.children[0].content.replace(/^\[x\]\s+/i, '');
                return '<li class="task-list-item"><input type="checkbox" class="task-checkbox" checked disabled> ';
            } else if (uncheckedMatch) {
                // 未选中状态
                token.attrPush(['class', 'task-list-item']);
                contentToken.content = content.replace(/^\[\s?\]\s+/, '');
                contentToken.children[0].content = contentToken.children[0].content.replace(/^\[\s?\]\s+/, '');
                return '<li class="task-list-item"><input type="checkbox" class="task-checkbox" disabled> ';
            }
        }
        
        return originalListItemOpen(tokens, idx, options, env, self);
    };
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', init);
