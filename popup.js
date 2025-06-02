// DOM 元素
const urlInput = document.getElementById('urlInput');
const addUrlButton = document.getElementById('addUrlButton');
const urlList = document.getElementById('urlList');
const wordInput = document.getElementById('wordInput');
const addWordButton = document.getElementById('addWordButton');
const wordList = document.getElementById('wordList');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const replaceImagesToggle = document.getElementById('replaceImagesToggle');

// 标签切换功能
tabs.forEach(tab => {
    tab.addEventListener('click', function() {
        // 移除所有标签和内容区的active类
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // 给当前点击的标签添加active类
        this.classList.add('active');

        // 显示相应的内容区
        const tabName = this.getAttribute('data-tab');
        document.getElementById(`${tabName}-content`).classList.add('active');
    });
});

// 加载已保存的网站列表
function loadUrls() {
    chrome.storage.local.get('targetUrls', function(data) {
        const urls = data.targetUrls || [];
        renderList(urls, urlList, removeUrl);
    });
}

// 加载已保存的敏感词列表
function loadWords() {
    chrome.storage.local.get('sensitiveWords', function(data) {
        const words = data.sensitiveWords || [];
        renderList(words, wordList, removeWord);
    });
}

// 加载图片替换设置
function loadReplaceImagesSetting() {
    chrome.storage.local.get('replaceImages', function(data) {
        if (data.replaceImages !== undefined) {
            replaceImagesToggle.checked = data.replaceImages;
        } else {
            // 默认为开启状态
            replaceImagesToggle.checked = true;
            chrome.storage.local.set({ replaceImages: true });
        }
    });
}

// 通用列表渲染函数
function renderList(items, listElement, deleteCallback) {
    // 清空列表
    listElement.innerHTML = '';

    if (items.length === 0) {
        listElement.innerHTML = '<div class="empty-list">暂无添加的项目</div>';
        return;
    }

    // 添加每个项目到列表
    items.forEach((item, index) => {
        const listItem = document.createElement('div');
        listItem.className = 'list-item';

        const itemText = document.createElement('span');
        itemText.className = 'item-text';
        itemText.textContent = item;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '删除';
        deleteBtn.addEventListener('click', () => {
            deleteCallback(index);
        });

        listItem.appendChild(itemText);
        listItem.appendChild(deleteBtn);
        listElement.appendChild(listItem);
    });
}

// 添加新的网站
function addUrl() {
    const url = urlInput.value.trim();

    if (!url) {
        alert('请输入有效的网站地址');
        return;
    }

    chrome.storage.local.get('targetUrls', function(data) {
        const urls = data.targetUrls || [];

        // 检查是否已存在
        if (urls.includes(url)) {
            alert('该网站已添加');
            return;
        }

        // 添加新网站并保存
        const newUrls = [...urls, url];
        chrome.storage.local.set({targetUrls: newUrls}, function() {
            renderList(newUrls, urlList, removeUrl);
            urlInput.value = '';
        });
    });
}

// 添加新的敏感词
function addWord() {
    const word = wordInput.value.trim();

    if (!word) {
        alert('请输入有效的敏感词');
        return;
    }

    chrome.storage.local.get('sensitiveWords', function(data) {
        const words = data.sensitiveWords || [];

        // 检查是否已存在
        if (words.includes(word)) {
            alert('该敏感词已添加');
            return;
        }

        // 添加新敏感词并保存
        const newWords = [...words, word];
        chrome.storage.local.set({sensitiveWords: newWords}, function() {
            renderList(newWords, wordList, removeWord);
            wordInput.value = '';
        });
    });
}

// 删除网站
function removeUrl(index) {
    chrome.storage.local.get('targetUrls', function(data) {
        const urls = data.targetUrls || [];

        // 删除特定索引的网站
        const newUrls = urls.filter((_, i) => i !== index);

        // 保存更新后的列表
        chrome.storage.local.set({targetUrls: newUrls}, function() {
            renderList(newUrls, urlList, removeUrl);
        });
    });
}

// 删除敏感词
function removeWord(index) {
    chrome.storage.local.get('sensitiveWords', function(data) {
        const words = data.sensitiveWords || [];

        // 删除特定索引的敏感词
        const newWords = words.filter((_, i) => i !== index);

        // 保存更新后的列表
        chrome.storage.local.set({sensitiveWords: newWords}, function() {
            renderList(newWords, wordList, removeWord);
        });
    });
}

// 更新图片替换设置
function updateReplaceImagesSetting() {
    const replaceImages = replaceImagesToggle.checked;
    chrome.storage.local.set({ replaceImages: replaceImages });
}

// 添加按钮点击事件
addUrlButton.addEventListener('click', addUrl);
addWordButton.addEventListener('click', addWord);

// 输入框回车事件
urlInput.addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        addUrl();
    }
});

wordInput.addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        addWord();
    }
});

// 开关改变事件
replaceImagesToggle.addEventListener('change', updateReplaceImagesSetting);

// 初始加载数据
document.addEventListener('DOMContentLoaded', function() {
    loadUrls();
    loadWords();
    loadReplaceImagesSetting();
});