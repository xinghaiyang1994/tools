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
    }
];

// 获取DOM元素
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

// 初始化函数
function init() {
    // 从本地存储加载已保存的文本
    const savedText = localStorage.getItem(STORAGE_KEY);
    if (savedText) {
        textEditor.value = savedText;
        updateCharCount();
        showStatus('已加载保存的内容', 'success');
    }
    
    // 初始化模板按钮
    initTemplateButtons();
    
    // 添加输入事件监听器
    textEditor.addEventListener('input', handleInput);
    
    // 添加键盘事件监听器以支持Tab缩进
    textEditor.addEventListener('keydown', handleKeyDown);
    
    // 窗口关闭前保存
    window.addEventListener('beforeunload', () => {
        saveToLocalStorage();
    });
    
    // 预览切换按钮事件
    togglePreviewBtn.addEventListener('click', togglePreview);
    
    // 配置 marked.js
    marked.setOptions({
        highlight: function(code, lang) {
            // 简单的代码高亮模拟
            return `<code class="language-${lang}">${code}</code>`;
        },
        breaks: true,
        gfm: true
    });
    
    // 初始聚焦到编辑器
    textEditor.focus();
}

// 初始化模板按钮
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

// 应用模板
function applyTemplate(content) {
    textEditor.value = content;
    updateCharCount();
    saveToLocalStorage();
    showStatus(`已应用模板: ${content.split('\n')[0].replace('#', '').trim()}`, 'success');
    
    // 如果预览区域是打开的，更新预览
    if (!previewContainer.classList.contains('hidden')) {
        updatePreview();
    }
    
    // 聚焦到编辑器
    textEditor.focus();
}

// 处理输入事件
function handleInput() {
    updateCharCount();
    debounce(saveToLocalStorage, 500)();
    showStatus('保存中...', 'saving');
    
    // 如果预览区域是打开的，更新预览
    if (!previewContainer.classList.contains('hidden')) {
        debounce(updatePreview, 300)();
    }
}

// 更新字符计数
function updateCharCount() {
    const count = textEditor.value.length;
    const lines = textEditor.value.split('\n').length;
    charCountElement.textContent = `${count} 字符, ${lines} 行`;
}

// 保存到本地存储
function saveToLocalStorage() {
    const text = textEditor.value;
    localStorage.setItem(STORAGE_KEY, text);
    showStatus('已保存', 'success');
}

// 显示状态信息
function showStatus(message, type) {
    statusElement.textContent = message;
    
    // 根据类型设置颜色
    if (type === 'success') {
        statusElement.style.color = '#28a745';
    } else if (type === 'saving') {
        statusElement.style.color = '#ffc107';
    } else {
        statusElement.style.color = '#6c757d';
    }
}

// 防抖函数
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

// 处理键盘事件（支持Tab缩进）
function handleKeyDown(e) {
    if (e.key === 'Tab') {
        e.preventDefault();
        
        const start = textEditor.selectionStart;
        const end = textEditor.selectionEnd;
        
        // 插入Tab字符
        textEditor.value = textEditor.value.substring(0, start) + '\t' + textEditor.value.substring(end);
        
        // 设置光标位置
        textEditor.selectionStart = textEditor.selectionEnd = start + 1;
        
        // 触发输入事件以保存
        textEditor.dispatchEvent(new Event('input'));
    }
}

// 切换预览
function togglePreview() {
    if (previewContainer.classList.contains('hidden')) {
        // 显示预览
        previewContainer.classList.remove('hidden');
        editorContainer.classList.add('half-width');
        togglePreviewBtn.textContent = '隐藏markdown';
        updatePreview();
    } else {
        // 隐藏预览
        previewContainer.classList.add('hidden');
        editorContainer.classList.remove('half-width');
        togglePreviewBtn.textContent = '预览markdown';
    }
}

// 更新预览内容
function updatePreview() {
    const markdownText = textEditor.value;
    try {
        previewContent.innerHTML = marked.parse(markdownText);
    } catch (error) {
        previewContent.innerHTML = `<div style="color: #e53e3e; padding: 20px; background: #fed7d7; border-radius: 8px;">
            <strong>渲染错误:</strong> ${error.message}
        </div>`;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);