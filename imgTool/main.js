/**
 * 图片处理工具 - 主逻辑文件
 * 提供图片导入、尺寸调整、下载等功能
 */

// DOM 元素引用
const importBtn = document.getElementById('importBtn');
const fileInput = document.getElementById('fileInput');
const compareImportBtn = document.getElementById('compareImportBtn');
const compareFileInput = document.getElementById('compareFileInput');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const lockRatio = document.getElementById('lockRatio');
const confirmBtn = document.getElementById('confirmBtn');
const downloadBtn = document.getElementById('downloadBtn');
const previewImage = document.getElementById('previewImage');
const compareImage = document.getElementById('compareImage');
const placeholder = document.getElementById('placeholder');

// 全局状态
let originalWidth = 0;           // 图片原始宽度
let originalHeight = 0;          // 图片原始高度
let aspectRatio = 1;             // 宽高比
let currentImageSrc = null;      // 当前图片的 Data URL
let compareImageSrc = null;      // 对比图片的 Data URL

/**
 * 触发文件选择对话框
 * 当用户点击"导入图片"按钮时调用此方法
 * 
 * @returns {void} 无返回值
 */
function handleImportClick() {
    fileInput.click();
}

/**
 * 处理文件选择事件
 * 当用户在文件对话框中选择图片后调用
 * 
 * @param {Event} event - 文件输入框的 change 事件对象
 * @returns {void} 无返回值
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        loadImage(file);
    }
}

/**
 * 读取并加载图片文件
 * 使用 FileReader API 将图片文件转换为 Data URL 并显示
 * 
 * @param {File} file - 用户选择的图片文件对象
 * @returns {void} 无返回值
 */
function loadImage(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // 保存原始图片信息
            currentImageSrc = e.target.result;
            updateImageInfo(img);
            
            // 显示图片
            previewImage.src = currentImageSrc;
            previewImage.hidden = false;
            placeholder.hidden = true;
            
            // 启用导入对比图片按钮
            compareImportBtn.disabled = false;
        };
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

/**
 * 更新图片尺寸信息
 * 将图片的原始宽高保存并填充到输入框中
 * 
 * @param {HTMLImageElement} img - 加载完成的图片元素
 * @returns {void} 无返回值
 */
function updateImageInfo(img) {
    originalWidth = img.naturalWidth;
    originalHeight = img.naturalHeight;
    aspectRatio = originalWidth / originalHeight;
    
    widthInput.value = originalWidth;
    heightInput.value = originalHeight;
}

/**
 * 处理宽度输入变化
 * 当宽高锁定时，同步调整高度以保持比例
 * 
 * @param {Event} event - 输入框的 input 事件对象
 * @returns {void} 无返回值
 */
function handleWidthChange(event) {
    if (lockRatio.checked) {
        const newWidth = parseInt(event.target.value) || 0;
        const newHeight = calculateProportionalSize(newWidth, true);
        heightInput.value = newHeight;
    }
}

/**
 * 处理高度输入变化
 * 当宽高锁定时，同步调整宽度以保持比例
 * 
 * @param {Event} event - 输入框的 input 事件对象
 * @returns {void} 无返回值
 */
function handleHeightChange(event) {
    if (lockRatio.checked) {
        const newHeight = parseInt(event.target.value) || 0;
        const newWidth = calculateProportionalSize(newHeight, false);
        widthInput.value = newWidth;
    }
}

/**
 * 计算等比例尺寸
 * 根据宽高比计算另一维度的尺寸
 * 
 * @param {number} value - 当前输入的尺寸值（宽度或高度）
 * @param {boolean} isWidth - true 表示输入的是宽度，false 表示输入的是高度
 * @returns {number} 计算得到的另一维度尺寸（四舍五入后的整数）
 */
function calculateProportionalSize(value, isWidth) {
    if (isWidth) {
        // 输入的是宽度，计算高度
        return Math.round(value / aspectRatio);
    } else {
        // 输入的是高度，计算宽度
        return Math.round(value * aspectRatio);
    }
}

/**
 * 应用新的宽高到图片
 * 点击"确定"按钮后，按输入框中的值调整图片显示尺寸
 * 
 * @returns {void} 无返回值
 */
function handleConfirm() {
    const newWidth = parseInt(widthInput.value) || originalWidth;
    const newHeight = parseInt(heightInput.value) || originalHeight;
    
    if (newWidth > 0 && newHeight > 0) {
        // 更新主图片尺寸
        previewImage.style.width = newWidth + 'px';
        previewImage.style.height = newHeight + 'px';
        previewImage.style.maxWidth = 'none';
        previewImage.style.maxHeight = 'none';
        
        // 如果对比图片存在，同步更新对比图片尺寸
        if (compareImageSrc) {
            compareImage.style.width = newWidth + 'px';
            compareImage.style.height = newHeight + 'px';
            compareImage.style.maxWidth = 'none';
            compareImage.style.maxHeight = 'none';
        }
    }
}

/**
 * 按当前宽高生成并下载图片
 * 使用 Canvas API 将图片按指定尺寸重新绘制并导出下载
 * 
 * @returns {void} 无返回值
 */
function handleDownload() {
    if (!currentImageSrc) {
        alert('请先导入图片');
        return;
    }
    
    const targetWidth = parseInt(widthInput.value) || originalWidth;
    const targetHeight = parseInt(heightInput.value) || originalHeight;
    
    if (targetWidth <= 0 || targetHeight <= 0) {
        alert('请输入有效的宽度和高度');
        return;
    }
    
    // 创建 canvas 元素
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    const ctx = canvas.getContext('2d');
    
    // 创建临时图片用于绘制
    const img = new Image();
    img.onload = function() {
        // 将图片绘制到 canvas 上（按目标尺寸缩放）
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        
        // 使用 toBlob 生成图片并下载
        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `image_${targetWidth}x${targetHeight}.png`;
            
            // 触发下载
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 释放 URL 对象
            URL.revokeObjectURL(url);
        }, 'image/png');
    };
    img.src = currentImageSrc;
}

/**
 * 触发对比图片文件选择对话框
 * 当用户点击"导入对比图片"按钮时调用此方法
 * 
 * @returns {void} 无返回值
 */
function handleCompareImportClick() {
    compareFileInput.click();
}

/**
 * 处理对比图片文件选择事件
 * 当用户在文件对话框中选择对比图片后调用
 * 
 * @param {Event} event - 文件输入框的 change 事件对象
 * @returns {void} 无返回值
 */
function handleCompareFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        loadCompareImage(file);
    }
}

/**
 * 读取并加载对比图片文件
 * 使用 FileReader API 将对比图片文件转换为 Data URL 并显示
 * 对比图片的宽高使用输入框中的当前值
 * 
 * @param {File} file - 用户选择的对比图片文件对象
 * @returns {void} 无返回值
 */
function loadCompareImage(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // 保存对比图片信息
            compareImageSrc = e.target.result;
            
            // 获取当前输入框中的宽高值
            const currentWidth = parseInt(widthInput.value) || originalWidth;
            const currentHeight = parseInt(heightInput.value) || originalHeight;
            
            // 显示对比图片，使用输入框中的宽高
            compareImage.src = compareImageSrc;
            compareImage.style.width = currentWidth + 'px';
            compareImage.style.height = currentHeight + 'px';
            compareImage.style.maxWidth = 'none';
            compareImage.style.maxHeight = 'none';
            compareImage.hidden = false;
        };
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

/**
 * 初始化事件监听器
 * 绑定所有按钮和输入框的事件处理函数
 * 
 * @returns {void} 无返回值
 */
function initEventListeners() {
    // 导入按钮点击事件
    importBtn.addEventListener('click', handleImportClick);
    
    // 文件选择事件
    fileInput.addEventListener('change', handleFileSelect);
    
    // 导入对比图片按钮点击事件
    compareImportBtn.addEventListener('click', handleCompareImportClick);
    
    // 对比图片文件选择事件
    compareFileInput.addEventListener('change', handleCompareFileSelect);
    
    // 宽度输入变化事件
    widthInput.addEventListener('input', handleWidthChange);
    
    // 高度输入变化事件
    heightInput.addEventListener('input', handleHeightChange);
    
    // 确定按钮点击事件
    confirmBtn.addEventListener('click', handleConfirm);
    
    // 下载按钮点击事件
    downloadBtn.addEventListener('click', handleDownload);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initEventListeners);
