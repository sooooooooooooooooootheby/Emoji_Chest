// ==UserScript==
// @name         Emojer
// @namespace    http://tampermonkey.net/
// @version      0.1.1
// @description  为LINUX DO添加自定义Emoji插入功能，支持多个分类
// @author       Neuroplexus,s22y
// @match        https://linux.do/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    // 默认自定义Emoji分类和表情
    const defaultCategories = {
        '常用表情': {
            'custom_smile': 'https://example.com/smile.png',
            'custom_laugh': 'https://example.com/laugh.png',
            'custom_cool': 'https://example.com/cool.png',
        },
        '动物表情': {
            'custom_cat': 'https://example.com/cat.png',
            'custom_dog': 'https://example.com/dog.png',
        },
        '节日表情': {
            'custom_christmas': 'https://example.com/christmas.png',
            'custom_newyear': 'https://example.com/newyear.png',
        }
    };

    // 从存储中获取自定义表情分类，如果没有则使用默认值
    let customCategories = GM_getValue('customEmojiCategories', defaultCategories);

    // 动态加载Emoji列表
    const list = [
        "https://gcore.jsdelivr.net/gh/sooooooooooooooooootheby/Emoji_Chest@v1.0.1/package/mita",
        "https://gcore.jsdelivr.net/gh/sooooooooooooooooootheby/Emoji_Chest@v1.0.0/package/aurakingdom",
        "https://gcore.jsdelivr.net/gh/sooooooooooooooooootheby/Emoji_Chest@v1.0.0/package/r1999"
    ];
    let emojis = [];

    const loadingEmojiList = (cdnList) => {
        cdnList.forEach(async (item, index) => {
            try {
                fetch(`${item}/info.json`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(data => {
                        emojis[index] = {
                            name: data.name,
                            icon: `${data.folder}/${data.icon}`,
                            items: []
                        };
                        data.items.forEach((item) => {
                            const url = `${data.folder}${item}`;
                            emojis[index].items.push({ name: item, url });
                        });
                    })
                    .catch(error => {
                        console.log(error);
                    });
            } catch (error) {
                console.error(error);
            }
        });
    };

    // 加载Emoji列表
    loadingEmojiList(list);

    // 创建设置面板样式
    const createStyles = () => {
        const style = document.createElement('style');
        style.textContent = `
            .emojer-settings-overlay {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background-color: rgba(0, 0, 0, 0.7) !important;
                z-index: 10000 !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                opacity: 0 !important;
                transition: opacity 0.3s ease !important;
                visibility: hidden !important;
            }

            .emojer-settings-container {
                background-color: var(--secondary, white) !important;
                border-radius: 8px !important;
                padding: 20px !important;
                width: 80% !important;
                max-width: 800px !important;
                max-height: 80vh !important;
                overflow-y: auto !important;
                transform: scale(0.8) !important;
                transition: transform 0.3s ease !important;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2) !important;
                color: var(--primary, black) !important;
            }

            .emojer-settings-overlay.active {
                opacity: 1 !important;
                visibility: visible !important;
            }

            .emojer-settings-overlay.active .emojer-settings-container {
                transform: scale(1) !important;
            }

            .emojer-settings-header {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                margin-bottom: 20px !important;
                padding-bottom: 10px !important;
                border-bottom: 1px solid var(--primary-low, #eee) !important;
            }

            .emojer-settings-title {
                font-size: 24px !important;
                font-weight: bold !important;
                margin: 0 !important;
                color: var(--primary, black) !important;
            }

            .emojer-close-btn {
                background: none !important;
                border: none !important;
                font-size: 24px !important;
                cursor: pointer !important;
                color: var(--primary-medium, #666) !important;
            }

            .emojer-category {
                margin-bottom: 20px !important;
                border: 1px solid var(--primary-low, #ddd) !important;
                border-radius: 5px !important;
                padding: 15px !important;
                background-color: var(--secondary, white) !important;
            }

            .emojer-category-header {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                margin-bottom: 10px !important;
            }

            .emojer-category-name {
                font-size: 18px !important;
                font-weight: bold !important;
                margin: 0 !important;
                color: var(--primary, black) !important;
            }

            .emojer-emoji-list {
                display: grid !important;
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) !important;
                gap: 10px !important;
                margin-top: 10px !important;
            }

            .emojer-emoji-item {
                display: flex !important;
                align-items: center !important;
                padding: 5px !important;
                border: 1px solid var(--primary-low, #eee) !important;
                border-radius: 4px !important;
                background-color: var(--secondary, white) !important;
            }

            .emojer-emoji-img {
                width: 24px !important;
                height: 24px !important;
                margin-right: 10px !important;
            }

            .emojer-btn {
                padding: 5px 10px !important;
                background-color: var(--tertiary, #0078d7) !important;
                color: var(--secondary, white) !important;
                border: none !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                margin-left: 5px !important;
            }

            .emojer-btn:hover {
                background-color: var(--tertiary-hover, #0063b1) !important;
            }

            .emojer-btn.danger {
                background-color: var(--danger, #d73a49) !important;
            }

            .emojer-btn.danger:hover {
                background-color: var(--danger-hover, #cb2431) !important;
            }

            .emojer-add-form {
                display: flex !important;
                flex-wrap: wrap !important;
                gap: 10px !important;
                margin-top: 10px !important;
                align-items: center !important;
            }

            .emojer-input {
                padding: 5px 10px !important;
                border: 1px solid var(--primary-low, #ddd) !important;
                border-radius: 4px !important;
                flex-grow: 1 !important;
                background-color: var(--secondary, white) !important;
                color: var(--primary, black) !important;
            }

            .emojer-add-category {
                margin-top: 20px !important;
            }

            .emojer-animation {
                position: fixed !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                width: 0 !important;
                height: 0 !important;
                background-color: var(--tertiary, #0078d7) !important;
                z-index: 9999 !important;
                pointer-events: none !important;
                opacity: 0.7 !important;
                transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1) !important;
                aspect-ratio: 1 / 1 !important;
            }

            .emojer-animation.active {
                width: 150vmax !important;
                height: 150vmax !important;
            }

            /* 确保自定义分类按钮样式与原生一致 */
            .emoji-picker__section-btn[data-section^="custom-"] {
                order: -1 !important;
            }
        `;
        document.head.appendChild(style);
    };

    // 创建设置面板
    const createSettingsPanel = () => {
        // 创建动画元素
        const animation = document.createElement('div');
        animation.className = 'emojer-animation';
        document.body.appendChild(animation);

        // 创建设置面板
        const overlay = document.createElement('div');
        overlay.className = 'emojer-settings-overlay';

        const container = document.createElement('div');
        container.className = 'emojer-settings-container';

        const header = document.createElement('div');
        header.className = 'emojer-settings-header';

        const title = document.createElement('h2');
        title.className = 'emojer-settings-title';
        title.textContent = 'Emojer 设置';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'emojer-close-btn';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.remove();
            }, 300);
        });

        header.appendChild(title);
        header.appendChild(closeBtn);
        container.appendChild(header);

        // 渲染所有分类和表情
        Object.entries(customCategories).forEach(([categoryName, emojis]) => {
            const categoryEl = createCategoryElement(categoryName, emojis);
            container.appendChild(categoryEl);
        });

        // 添加新分类的表单
        const addCategorySection = document.createElement('div');
        addCategorySection.className = 'emojer-add-category';

        const addCategoryForm = document.createElement('div');
        addCategoryForm.className = 'emojer-add-form';

        const categoryNameInput = document.createElement('input');
        categoryNameInput.className = 'emojer-input';
        categoryNameInput.placeholder = '新分类名称';

        const addCategoryBtn = document.createElement('button');
        addCategoryBtn.className = 'emojer-btn';
        addCategoryBtn.textContent = '添加分类';
        addCategoryBtn.addEventListener('click', () => {
            const newCategoryName = categoryNameInput.value.trim();
            if (newCategoryName && !customCategories[newCategoryName]) {
                customCategories[newCategoryName] = {};
                GM_setValue('customEmojiCategories', customCategories);

                // 添加新分类到界面
                const newCategoryEl = createCategoryElement(newCategoryName, {});
                container.insertBefore(newCategoryEl, addCategorySection);

                categoryNameInput.value = '';
            }
        });

        addCategoryForm.appendChild(categoryNameInput);
        addCategoryForm.appendChild(addCategoryBtn);

        addCategorySection.appendChild(addCategoryForm);
        container.appendChild(addCategorySection);

        overlay.appendChild(container);
        document.body.appendChild(overlay);

        // 执行动画
        // 1. 首先显示动画方块
        setTimeout(() => {
            animation.classList.add('active');
        }, 10);

        // 2. 动画结束后显示设置面板，隐藏动画
        setTimeout(() => {
            overlay.classList.add('active');
            setTimeout(() => {
                animation.classList.remove('active');
                setTimeout(() => {
                    animation.remove();
                }, 300);
            }, 300);
        }, 500);
    };

    // 创建分类元素
    const createCategoryElement = (categoryName, emojis) => {
        const categoryEl = document.createElement('div');
        categoryEl.className = 'emojer-category';

        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'emojer-category-header';

        const categoryNameEl = document.createElement('h3');
        categoryNameEl.className = 'emojer-category-name';
        categoryNameEl.textContent = categoryName;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'emojer-btn danger';
        deleteBtn.textContent = '删除分类';
        deleteBtn.addEventListener('click', () => {
            if (confirm(`确定要删除分类 "${categoryName}" 及其所有表情吗？`)) {
                delete customCategories[categoryName];
                GM_setValue('customEmojiCategories', customCategories);
                categoryEl.remove();
            }
        });

        categoryHeader.appendChild(categoryNameEl);
        categoryHeader.appendChild(deleteBtn);
        categoryEl.appendChild(categoryHeader);

        // 添加表情列表
        const emojiList = document.createElement('div');
        emojiList.className = 'emojer-emoji-list';

        Object.entries(emojis).forEach(([emojiName, emojiUrl]) => {
            const emojiItem = document.createElement('div');
            emojiItem.className = 'emojer-emoji-item';

            const emojiImg = document.createElement('img');
            emojiImg.className = 'emojer-emoji-img';
            emojiImg.src = emojiUrl;
            emojiImg.alt = emojiName;

            const emojiNameEl = document.createElement('span');
            emojiNameEl.textContent = `:${emojiName}:`;

            const deleteEmojiBtn = document.createElement('button');
            deleteEmojiBtn.className = 'emojer-btn danger';
            deleteEmojiBtn.textContent = '删除';
            deleteEmojiBtn.style.marginLeft = 'auto';
            deleteEmojiBtn.addEventListener('click', () => {
                delete customCategories[categoryName][emojiName];
                GM_setValue('customEmojiCategories', customCategories);
                emojiItem.remove();
            });

            emojiItem.appendChild(emojiImg);
            emojiItem.appendChild(emojiNameEl);
            emojiItem.appendChild(deleteEmojiBtn);
            emojiList.appendChild(emojiItem);
        });

        categoryEl.appendChild(emojiList);

        // 添加新表情的表单
        const addForm = document.createElement('div');
        addForm.className = 'emojer-add-form';

        const nameInput = document.createElement('input');
        nameInput.className = 'emojer-input';
        nameInput.placeholder = '表情名称';

        const urlInput = document.createElement('input');
        urlInput.className = 'emojer-input';
        urlInput.placeholder = '表情图片URL';

        const addBtn = document.createElement('button');
        addBtn.className = 'emojer-btn';
        addBtn.textContent = '添加表情';
        addBtn.addEventListener('click', () => {
            const name = nameInput.value.trim();
            const url = urlInput.value.trim();

            if (name && url) {
                customCategories[categoryName][name] = url;
                GM_setValue('customEmojiCategories', customCategories);

                // 添加新表情到界面
                const emojiItem = document.createElement('div');
                emojiItem.className = 'emojer-emoji-item';

                const emojiImg = document.createElement('img');
                emojiImg.className = 'emojer-emoji-img';
                emojiImg.src = url;
                emojiImg.alt = name;

                const emojiNameEl = document.createElement('span');
                emojiNameEl.textContent = `:${name}:`;

                const deleteEmojiBtn = document.createElement('button');
                deleteEmojiBtn.className = 'emojer-btn danger';
                deleteEmojiBtn.textContent = '删除';
                deleteEmojiBtn.style.marginLeft = 'auto';
                deleteEmojiBtn.addEventListener('click', () => {
                    delete customCategories[categoryName][name];
                    GM_setValue('customEmojiCategories', customCategories);
                    emojiItem.remove();
                });

                emojiItem.appendChild(emojiImg);
                emojiItem.appendChild(emojiNameEl);
                emojiItem.appendChild(deleteEmojiBtn);
                emojiList.appendChild(emojiItem);

                nameInput.value = '';
                urlInput.value = '';
            }
        });

        addForm.appendChild(nameInput);
        addForm.appendChild(urlInput);
        addForm.appendChild(addBtn);

        categoryEl.appendChild(addForm);

        return categoryEl;
    };

    // 创建自定义Emoji部分
    function createCustomEmojiSection() {
        // 检查是否已存在自定义部分
        if (document.querySelector('.emoji-picker__section[data-section^="custom-"]')) {
            return;
        }

        // 等待Emoji选择器加载完成
        const checkExist = setInterval(() => {
            const emojiSections = document.querySelector('.emoji-picker__sections');
            const sectionsNav = document.querySelector('.emoji-picker__sections-nav');

            if (emojiSections && sectionsNav && emojis.length > 0) {
                clearInterval(checkExist);

                // 遍历动态加载的表情包
                emojis.forEach((emojiCategory, categoryIndex) => {
                    const sectionId = `custom-${categoryIndex}`;

                    // 创建导航按钮
                    const navButton = document.createElement('button');
                    navButton.className = 'btn no-text btn-flat emoji-picker__section-btn';
                    navButton.setAttribute('tabindex', '-1');
                    navButton.setAttribute('data-section', sectionId);
                    navButton.setAttribute('type', 'button');
                    navButton.innerHTML = `<img width="18" height="18" class="emoji" src="${emojiCategory.icon}">`;

                    // 添加导航按钮点击事件
                    navButton.addEventListener('click', function () {
                        // 移除其他按钮的active类
                        document.querySelectorAll('.emoji-picker__section-btn').forEach(btn => {
                            btn.classList.remove('active');
                        });

                        // 为当前按钮添加active类
                        this.classList.add('active');

                        // 隐藏所有section
                        document.querySelectorAll('.emoji-picker__section').forEach(section => {
                            section.style.display = 'none';
                        });

                        // 显示对应的section
                        const customSection = document.querySelector(`.emoji-picker__section[data-section="${sectionId}"]`);
                        if (customSection) {
                            customSection.style.display = 'block';
                        }
                    });

                    // 将自定义按钮插入到导航栏的最前面
                    sectionsNav.insertBefore(navButton, sectionsNav.firstChild);

                    // 创建自定义部分
                    const customSection = document.createElement('div');
                    customSection.className = 'emoji-picker__section';
                    customSection.setAttribute('data-section', sectionId);
                    customSection.setAttribute('role', 'region');
                    customSection.setAttribute('aria-label', emojiCategory.name);
                    customSection.style.display = 'none'; // 初始隐藏

                    // 创建标题容器
                    const titleContainer = document.createElement('div');
                    titleContainer.className = 'emoji-picker__section-title-container';

                    // 创建标题
                    const title = document.createElement('h2');
                    title.className = 'emoji-picker__section-title';
                    title.textContent = emojiCategory.name;
                    titleContainer.appendChild(title);

                    // 创建表情容器
                    const emojisContainer = document.createElement('div');
                    emojisContainer.className = 'emoji-picker__section-emojis';

                    // 添加动态加载的表情
                    emojiCategory.items.forEach(({ name, url }) => {
                        const emojiImg = document.createElement('img');
                        emojiImg.width = 32;
                        emojiImg.height = 32;
                        emojiImg.className = 'emoji';
                        emojiImg.src = url;
                        emojiImg.setAttribute('tabindex', '-1');
                        emojiImg.setAttribute('data-emoji', name);
                        emojiImg.setAttribute('alt', name);
                        emojiImg.setAttribute('title', `:${name}:`);
                        emojiImg.setAttribute('loading', 'lazy');

                        // 添加点击事件
                        emojiImg.addEventListener('click', function () {
                            insertCustomEmoji(name, url);
                        });

                        emojisContainer.appendChild(emojiImg);
                    });

                    // 组装部分
                    customSection.appendChild(titleContainer);
                    customSection.appendChild(emojisContainer);

                    // 添加到选择器
                    emojiSections.appendChild(customSection);
                });

                // 为所有原有的分类按钮添加点击事件
                addClickEventToSectionButtons();
            }
        }, 300);
    }

    // 为分类按钮添加点击事件
    function addClickEventToSectionButtons() {
        const sectionButtons = document.querySelectorAll('.emoji-picker__section-btn:not([data-section^="custom-"])');
        sectionButtons.forEach(button => {
            if (!button.hasAttribute('data-has-click-event')) {
                button.setAttribute('data-has-click-event', 'true');
                button.addEventListener('click', function() {
                    // 移除所有按钮的active类
                    document.querySelectorAll('.emoji-picker__section-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });

                    // 为当前按钮添加active类
                    this.classList.add('active');

                    // 隐藏所有section
                    document.querySelectorAll('.emoji-picker__section').forEach(section => {
                        section.style.display = 'none';
                    });

                    // 显示对应的section
                    const sectionName = this.getAttribute('data-section');
                    const targetSection = document.querySelector(`.emoji-picker__section[data-section="${sectionName}"]`);
                    if (targetSection) {
                        targetSection.style.display = 'block';
                    }
                });
            }
        });
    }

    // 插入自定义表情到编辑器
    function insertCustomEmoji(name, url) {
        const editor = document.querySelector('textarea.ember-text-area.ember-view.d-editor-input');
        if (editor) {
            const emojiCode = `:${name}:`;

            // 延时100毫秒后替换为HTML标签
            setTimeout(() => {
                // 生成HTML标签
                const htmlTag = `<img class="emoji emoji-custom only-emoji" src="${url}" alt="${name}" title=":${name}:" />`;

                // 替换最后插入的表情代码
                const currentText = editor.value;
                const lastIndex = currentText.lastIndexOf(emojiCode);

                if (lastIndex !== -1) {
                    editor.value = currentText.substring(0, lastIndex) +
                                  htmlTag +
                                  currentText.substring(lastIndex + emojiCode.length);

                    // 更新光标位置到标签后面
                    const newPos = lastIndex + htmlTag.length;
                    editor.setSelectionRange(newPos, newPos);

                    // 再次触发输入事件
                    editor.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }, 3);

            // 关闭emoji选择器
            const emojiPicker = document.querySelector('.emoji-picker');
            if (emojiPicker) {
                emojiPicker.style.display = 'none';
            }

            // 让编辑器获得焦点
            editor.focus();
        }
    }

    // 处理常用分类中的自定义表情
    function handleFrequentlyUsedEmojis() {
        // 查找常用分类
        const frequentlyUsedSection = document.querySelector('.emoji-picker__section[data-section="favorites"]');
        if (!frequentlyUsedSection) return;

        // 查找常用分类中的所有表情
        const emojis = frequentlyUsedSection.querySelectorAll('img.emoji');

        emojis.forEach(emoji => {
            const title = emoji.getAttribute('title');
            if (!title) return;

            // 检查是否是自定义表情（通过title属性中的名称判断）
            for (const [categoryName, categoryEmojis] of Object.entries(customCategories)) {
                for (const [name, url] of Object.entries(categoryEmojis)) {
                    const emojiCode = `:${name}:`;
                    if (title === emojiCode) {
                        // 如果是自定义表情，移除原有点击事件并添加新的点击事件
                        const newEmoji = emoji.cloneNode(true);
                        emoji.parentNode.replaceChild(newEmoji, emoji);

                        newEmoji.addEventListener('click', function(e) {
                            insertCustomEmoji(name, url);
                            return false;
                        });

                        // 标记为已处理
                        newEmoji.setAttribute('data-custom-handled', 'true');
                    }
                }
            }
        });
    }

    // 创建样式
    createStyles();

    // 注册用户脚本菜单命令
    GM_registerMenuCommand('Emojer 设置', createSettingsPanel);

    // 监听DOM变化，当emoji选择器出现或更新时处理
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    const node = mutation.addedNodes[i];
                    if (node.classList && node.classList.contains('emoji-picker')) {
                        createCustomEmojiSection();
                        // 初始处理常用分类
                        setTimeout(handleFrequentlyUsedEmojis, 500);
                    }
                }
            }

            // 检查常用分类是否有更新
            if (mutation.target && mutation.target.classList &&
                mutation.target.classList.contains('emoji-picker__section-emojis') &&
                mutation.target.parentNode &&
                mutation.target.parentNode.getAttribute('data-section') === 'favorites') {
                setTimeout(handleFrequentlyUsedEmojis, 100);
            }
        });
    });

    // 开始观察文档变化
    observer.observe(document.body, { childList: true, subtree: true });

    // 页面加载完成后检查是否已存在emoji选择器
    window.addEventListener('load', () => {
        if (document.querySelector('.emoji-picker')) {
            createCustomEmojiSection();
            setTimeout(handleFrequentlyUsedEmojis, 500);
        }
    });

    // 定期检查常用分类中的表情
    setInterval(() => {
        if (document.querySelector('.emoji-picker:not([style*="display: none"])')) {
            handleFrequentlyUsedEmojis();
        }
    }, 1000);
})();