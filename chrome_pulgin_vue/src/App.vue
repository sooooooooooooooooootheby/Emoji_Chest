<template>
    <div class="main">
        <ul>
            <li v-for="(item, index) in emojis" :key="index">
                <p class="title">{{ item.name }}</p>
                <ul class="emojiList">
                    <li v-for="items in item.items" :key="items" class="emoji" @click="copy(items.url, items.name)">
                        <img :src="items.url" :alt="items.name" class="item" />
                    </li>
                </ul>
            </li>
        </ul>
    </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import axios from "axios";

let list = [];
let cdn = "";
let info = [];

const emojis = ref([]);

const getEmojiListInfo = async () => {
    try {
        const result = await axios.get("/info.json");
        list = result.data.list;
        cdn = result.data.cdn;
    } catch (error) {
        console.error(error);
    }
};

const fetchInfoSequentially = async () => {
    for (const item of list) {
        const url = `${cdn}${item}/info.json`;

        try {
            const result = await axios.get(url);
            info.push(result.data);
        } catch (error) {
            console.error(error);
        }
    }
};

const getEmoji = () => {
    for (const item of info) {
        emojis.value.push({
            name: item.name,
            items: [],
        });
        for (const items of item.items) {
            const url = `${cdn}${item.name}/${items}`;
            emojis.value[emojis.value.length - 1].items.push({ name: items, url });
        }
    }
};

const copy = async (url, name) => {
    const text = `<img src="${url}" alt="${name}" class="emoji emoji-custom only-emoji">`;

    try {
        await navigator.clipboard.writeText(text);
        console.log("Copied to clipboard:", text);

        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        console.log("Current tab:", tab.id);

        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (injectedText) => {
                console.log("Injected script running...");
                const textareas = document.getElementsByTagName("textarea");
                Array.from(textareas).forEach((textarea) => {
                    textarea.value += injectedText;
                    textarea.dispatchEvent(new Event("input", { bubbles: true }));
                });
            },
            args: [text],
        });
    } catch (error) {
        console.error("操作失败:", error);
    }
};

onMounted(async () => {
    await getEmojiListInfo();
    await fetchInfoSequentially();
    getEmoji();
});
</script>

<style scoped>
li {
    list-style: none;
}

.main {
    width: 100%;
    height: 100%;
    overflow: scroll;
    scrollbar-width: none;
    -ms-overflow-style: none;
}
.main::-webkit-scrollbar {
    display: none;
}
.title {
    font-weight: bold;
    font-synthesis: 1.2rem;
    margin: 4px;
}
.emojiList {
    display: flex;
    flex-wrap: wrap;
}
.item {
    width: 32px;
    height: 32px;
    margin: 4px;
    cursor: pointer;
    transition: 0.2s;
}
.item:hover {
    scale: 1.2;
}
.item:active {
    transform: scale(1.1);
    transition: 0.1s;
}
</style>
