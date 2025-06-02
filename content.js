// 定义需要脱敏文本
let sensitiveWords = [];

// 存储目标网址的变量
let targetUrls = [];

// 是否替换图片
let replaceImages = true;

// 从存储中加载目标网址和敏感词
function loadSettings() {
    chrome.storage.local.get(['targetUrls', 'sensitiveWords', 'replaceImages'], function (data) {
        // 加载目标网址
        if (data.targetUrls && Array.isArray(data.targetUrls)) {
            targetUrls = data.targetUrls;
        } else {
            // 初始默认值
            targetUrls = [];
            // 保存默认值到存储
            chrome.storage.local.set({ targetUrls: targetUrls });
        }

        // 加载敏感词
        if (data.sensitiveWords && Array.isArray(data.sensitiveWords)) {
            sensitiveWords = data.sensitiveWords;
        } else {
            // 初始默认值
            sensitiveWords = [];
            // 保存默认值到存储
            chrome.storage.local.set({ sensitiveWords: sensitiveWords });
        }

        // 加载图片替换设置
        if (data.replaceImages !== undefined) {
            replaceImages = data.replaceImages;
        } else {
            // 初始默认值
            replaceImages = true;
            // 保存默认值到存储
            chrome.storage.local.set({ replaceImages: replaceImages });
        }

        // 加载完成后处理页面
        processPage();
    });
}

// 检查当前页面是否需要处理
function shouldProcessPage() {
    return targetUrls.some(url => window.location.href.includes(url));
}

// 将敏感词替换为星号的函数
function maskWord(word) {
    return '*'.repeat(word.length);
}

// 处理图片的函数 - 替换为随机图片
function processImage(img) {
    // 如果不需要替换图片，直接返回
    if (!replaceImages) {
        return;
    }

    // 检查图片是否已经被处理过
    if (img.getAttribute('data-processed') === 'true') {
        return;
    }

    // 保存原始尺寸
    const width = img.width || 300;
    const height = img.height || 200;

    // 替换为随机图片
    img.src = `https://picsum.photos/${width}/${height}?random=${Math.random()}`;

    // 标记图片已处理
    img.setAttribute('data-processed', 'true');
}

// 处理视频的函数
function processVideo(video) {
    // 添加模糊效果的CSS
    video.style.filter = 'blur(8px)';

    // 添加鼠标悬停时取消模糊的效果
    video.addEventListener('mouseover', function () {
        this.style.filter = 'none';
    });

    // 鼠标移出时恢复模糊
    video.addEventListener('mouseout', function () {
        this.style.filter = 'blur(8px)';
    });
}

// 处理所有图片
function processAllImages() {
    if (!shouldProcessPage()) return;

    const images = document.getElementsByTagName('img');
    for (let img of images) {
        processImage(img);
    }
}

// 处理所有视频
function processAllVideos() {
    if (!shouldProcessPage()) return;

    const videos = document.getElementsByTagName('video');
    for (let video of videos) {
        processVideo(video);
    }
}

// 遍历DOM树并替换文本的函数
function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        let text = node.textContent;
        let changed = false;

        sensitiveWords.forEach(word => {
            if (text.includes(word)) {
                text = text.replace(new RegExp(word, 'g'), maskWord(word));
                changed = true;
            }
        });

        if (changed) {
            node.textContent = text;
        }
    } else {
        // 如果不是文本节点，则递归处理其子节点
        Array.from(node.childNodes).forEach(child => processNode(child));
    }
}

// 定义一个函数来处理整个页面
function processPage() {
    if (!shouldProcessPage()) return;

    processNode(document.body);
    processAllImages();
    processAllVideos();
}

// 监听存储变化
chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace === 'local') {
        // 检查目标网址是否有变化
        if (changes.targetUrls) {
            targetUrls = changes.targetUrls.newValue;
            processPage();
        }

        // 检查敏感词是否有变化
        if (changes.sensitiveWords) {
            sensitiveWords = changes.sensitiveWords.newValue;
            processPage();
        }

        // 检查图片替换设置是否有变化
        if (changes.replaceImages !== undefined) {
            replaceImages = changes.replaceImages.newValue;
            processPage();
        }
    }
});

// 初始加载设置并处理
loadSettings();

// 创建一个观察器来处理动态加载的内容
const observer = new MutationObserver((mutations) => {
    if (!shouldProcessPage()) return;

    mutations.forEach(mutation => {
        // 立即处理变化的节点
        mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                processNode(node);
                if (node.tagName === 'IMG') {
                    processImage(node);
                }
                if (node.tagName === 'VIDEO') {
                    processVideo(node);
                }
            }
        });

        // 处理修改的节点
        if (mutation.type === 'characterData') {
            processNode(mutation.target);
        }
    });

    // 延迟后再次处理整个页面，以确保捕获所有变化
    setTimeout(processPage, 1000);
});

// 配置观察器，监视更多的变化类型
observer.observe(document.body, {
    childList: true,    // 监视子节点的添加或删除
    subtree: true,      // 监视所有后代节点
    characterData: true, // 监视文本内容的变化
    characterDataOldValue: true // 保留文本变化的旧值
});

// 定期扫描整个页面
setInterval(processPage, 3000);

// 在页面滚动时也触发处理
document.addEventListener('scroll', () => {
    processPage();
});

// 在页面加载完成后再次处理
window.addEventListener('load', () => {
    // 延迟1秒后再次处理，以确保处理到延迟加载的内容
    setTimeout(processPage, 1000);
});