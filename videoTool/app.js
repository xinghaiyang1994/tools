/**
 * 视频处理应用 - 核心逻辑
 * 支持本地视频导入、尺寸调整、截图和下载功能
 */

// 全局变量
let videoElement = null;
let widthInput = null;
let heightInput = null;
let originalAspectRatio = 1;
let isUpdatingDimensions = false;

/**
 * 初始化应用
 * 在 DOM 加载完成后执行，绑定所有事件监听器和初始化 DOM 元素引用
 * @returns {void}
 */
function init() {
    // 获取 DOM 元素引用
    videoElement = document.getElementById('videoPlayer');
    widthInput = document.getElementById('widthInput');
    heightInput = document.getElementById('heightInput');
    const videoInput = document.getElementById('videoInput');
    const applyDimensionsBtn = document.getElementById('applyDimensionsBtn');
    const captureBtn = document.getElementById('captureBtn');

    // 绑定事件监听器
    videoInput.addEventListener('change', handleVideoImport);
    applyDimensionsBtn.addEventListener('click', handleApplyDimensions);
    captureBtn.addEventListener('click', handleCaptureScreenshot);
    
    // 绑定输入框事件，实现宽高比联动
    widthInput.addEventListener('input', () => handleDimensionInput('width'));
    heightInput.addEventListener('input', () => handleDimensionInput('height'));
}

/**
 * 处理视频文件导入
 * 当用户选择视频文件后，创建本地预览 URL 并加载视频
 * @param {Event} event - 文件输入变更事件对象
 * @returns {void}
 */
function handleVideoImport(event) {
    const file = event.target.files[0];
    
    // 验证文件是否存在
    if (!file) {
        return;
    }

    // 验证文件类型
    if (!file.type.startsWith('video/')) {
        alert('请选择有效的视频文件');
        return;
    }

    // 创建本地预览 URL
    const videoURL = URL.createObjectURL(file);
    videoElement.src = videoURL;

    // 监听视频元数据加载完成
    videoElement.addEventListener('loadedmetadata', loadVideoMetadata, { once: true });

    // 显示主体区域，隐藏导入区域
    document.getElementById('importArea').style.display = 'none';
    document.getElementById('mainArea').style.display = 'block';
}

/**
 * 加载视频元数据
 * 当视频元数据加载完成后，获取并填充原始宽高到输入框
 * @returns {void}
 */
function loadVideoMetadata() {
    // 获取视频原始宽高
    const originalWidth = videoElement.videoWidth;
    const originalHeight = videoElement.videoHeight;

    // 计算并保存原始宽高比
    originalAspectRatio = originalWidth / originalHeight;

    // 设置输入框默认值为原始尺寸
    widthInput.value = originalWidth;
    heightInput.value = originalHeight;

    // 设置视频初始显示尺寸
    videoElement.width = originalWidth;
    videoElement.height = originalHeight;
}

/**
 * 处理宽高输入框的输入事件
 * 当用户修改宽度或高度时，自动计算另一维度以保持宽高比
 * @param {string} changedDimension - 被修改的维度，'width' 或 'height'
 * @returns {void}
 */
function handleDimensionInput(changedDimension) {
    // 防止递归更新
    if (isUpdatingDimensions) {
        return;
    }

    isUpdatingDimensions = true;

    const width = parseInt(widthInput.value);
    const height = parseInt(heightInput.value);

    // 验证输入值
    if (isNaN(width) && isNaN(height)) {
        isUpdatingDimensions = false;
        return;
    }

    // 根据修改的维度计算另一维度
    if (changedDimension === 'width' && !isNaN(width)) {
        const newHeight = calculateAspectRatio('width', width, originalAspectRatio);
        heightInput.value = newHeight;
    } else if (changedDimension === 'height' && !isNaN(height)) {
        const newWidth = calculateAspectRatio('height', height, originalAspectRatio);
        widthInput.value = newWidth;
    }

    isUpdatingDimensions = false;
}

/**
 * 根据宽高比计算另一维度的值
 * 保持视频原始宽高比，避免画面变形
 * @param {string} changedDimension - 被修改的维度，'width' 或 'height'
 * @param {number} value - 被修改维度的新值
 * @param {number} aspectRatio - 原始宽高比（宽度/高度）
 * @returns {number} 计算得到的另一维度的值
 */
function calculateAspectRatio(changedDimension, value, aspectRatio) {
    if (changedDimension === 'width') {
        // 根据宽度计算高度
        return Math.round(value / aspectRatio);
    } else {
        // 根据高度计算宽度
        return Math.round(value * aspectRatio);
    }
}

/**
 * 处理应用尺寸按钮点击事件
 * 将输入框中的宽高应用到视频显示尺寸
 * @returns {void}
 */
function handleApplyDimensions() {
    const width = parseInt(widthInput.value);
    const height = parseInt(heightInput.value);

    // 验证输入值
    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
        alert('请输入有效的宽度和高度（正整数）');
        return;
    }

    // 更新视频显示尺寸
    updateVideoDimensions(width, height);
}

/**
 * 更新视频显示尺寸
 * 调整视频元素的宽度和高度属性
 * @param {number} width - 新的宽度值（像素）
 * @param {number} height - 新的高度值（像素）
 * @returns {void}
 */
function updateVideoDimensions(width, height) {
    videoElement.width = width;
    videoElement.height = height;
}

/**
 * 处理截图按钮点击事件
 * 截取当前视频帧并显示在页面上
 * @returns {void}
 */
function handleCaptureScreenshot() {
    // 验证视频是否已加载
    if (!videoElement.src || videoElement.readyState < 2) {
        alert('视频尚未加载完成，请稍后再试');
        return;
    }

    // 截取当前视频帧
    captureScreenshot();
}

/**
 * 截取当前视频帧
 * 使用 Canvas API 将当前视频画面绘制为图片
 * @returns {void}
 */
function captureScreenshot() {
    // 获取目标尺寸
    const width = parseInt(widthInput.value);
    const height = parseInt(heightInput.value);

    // 创建 Canvas 元素
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    // 获取 2D 绘图上下文
    const ctx = canvas.getContext('2d');

    // 将视频当前帧绘制到 Canvas
    ctx.drawImage(videoElement, 0, 0, width, height);

    // 生成时间戳
    const timestamp = generateTimestamp();

    // 将 Canvas 转换为 Blob 对象（JPEG 格式）
    canvas.toBlob((blob) => {
        if (blob) {
            displayScreenshot(blob, timestamp);
        } else {
            alert('截图失败，请重试');
        }
    }, 'image/jpeg', 0.95);
}

/**
 * 生成文件名时间戳
 * 格式：screenshot_YYYYMMDD_HHMMSS
 * @returns {string} 格式化的时间戳字符串
 */
function generateTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `screenshot_${year}${month}${day}_${hours}${minutes}${seconds}`;
}

/**
 * 在页面上显示截图
 * 创建截图卡片元素，包含预览图、下载按钮和删除按钮
 * @param {Blob} imageBlob - 图片 Blob 对象
 * @param {string} timestamp - 时间戳字符串，用于文件命名
 * @returns {void}
 */
function displayScreenshot(imageBlob, timestamp) {
    // 创建预览 URL
    const imageURL = URL.createObjectURL(imageBlob);

    // 获取当前截图的尺寸（从输入框获取）
    const width = parseInt(widthInput.value);
    const height = parseInt(heightInput.value);

    // 创建截图卡片元素
    const card = document.createElement('div');
    card.className = 'screenshot-card';

    // 创建图片元素
    const img = document.createElement('img');
    img.src = imageURL;
    img.alt = '视频截图';
    img.width = width;
    img.height = height;

    // 创建操作按钮容器
    const actions = document.createElement('div');
    actions.className = 'screenshot-actions';

    // 创建下载按钮
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn-download';
    downloadBtn.textContent = '下载';
    downloadBtn.onclick = () => downloadScreenshot(imageBlob, `${timestamp}.jpg`);

    // 创建删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = '删除';
    deleteBtn.onclick = () => deleteScreenshot(card, imageURL);

    // 组装元素
    actions.appendChild(downloadBtn);
    actions.appendChild(deleteBtn);
    card.appendChild(img);
    card.appendChild(actions);

    // 添加到截图容器
    const container = document.getElementById('screenshotsContainer');
    container.appendChild(card);
}

/**
 * 下载截图
 * 创建临时下载链接并触发下载
 * @param {Blob} imageBlob - 图片 Blob 对象
 * @param {string} filename - 下载文件名
 * @returns {void}
 */
function downloadScreenshot(imageBlob, filename) {
    // 创建临时 URL
    const url = URL.createObjectURL(imageBlob);

    // 创建隐藏的 <a> 元素
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    // 添加到 DOM，触发点击，然后移除
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 延迟释放 URL（给浏览器足够时间处理下载）
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 100);
}

/**
 * 删除截图
 * 从页面移除截图卡片并释放相关资源
 * @param {HTMLElement} cardElement - 截图卡片 DOM 元素
 * @param {string} imageURL - 图片 URL，用于释放内存
 * @returns {void}
 */
function deleteScreenshot(cardElement, imageURL) {
    // 释放 Blob URL
    URL.revokeObjectURL(imageURL);

    // 添加淡出动画
    cardElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    cardElement.style.opacity = '0';
    cardElement.style.transform = 'scale(0.9)';

    // 动画结束后移除元素
    setTimeout(() => {
        cardElement.remove();
    }, 300);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
