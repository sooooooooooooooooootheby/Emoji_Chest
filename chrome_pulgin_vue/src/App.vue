<template>
    <div class="main">
        <div class="save">
            <input type="text" v-model="input" class="input" placeholder="输入link获取表情包" />
            <button @click="loadingNewEmojiList(input)" class="btn">save</button>
        </div>
        <div class="alert" v-if="msg">{{ msg }}</div>
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

const input = ref("");
let list = [];
const emojis = ref([]);
const msg = ref("");

const handleAlert = (text) => {
    msg.value = text;
    setTimeout(() => {
        msg.value = "";
    }, 3000);
};

const loadingEmojiList = (cdnList) => {
    cdnList.forEach(async (item, index) => {
        try {
            const result = await axios.get(`${item}/info.json`);
            emojis.value[index] = {
                name: result.data.name,
                items: [],
            };
            result.data.items.forEach((items) => {
                const url = `${result.data.folder}/${items}`;
                emojis.value[index].items.push({ name: items, url });
            });
        } catch (error) {
            console.error(error);
        }
    });
};

const loadingNewEmojiList = async (cdnList) => {
    if (!cdnList) {
        return;
    }

    try {
        const result = await axios.get(`${cdnList}/info.json`);
        if (!result.data.name) {
            handleAlert("获取失败, 请检查链接");
        }

        emojis.value[emojis.value.length] = {
            name: result.data.name,
            items: [],
        };
        result.data.items.forEach((items) => {
            const url = `${result.data.folder}/${items}`;
            emojis.value[emojis.value.length - 1].items.push({ name: items, url });
        });

        list.push(cdnList);
        localStorage.setItem("emojiList", JSON.stringify(list));
    } catch (error) {
        console.error(error);
    }
};

const read = () => {
    list = [];
    const data = JSON.parse(localStorage.getItem("emojiList"));
    if (data) {
        list = data;
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
    read();
    loadingEmojiList(list);
});
</script>

<style scoped>
.save {
    width: 100%;
    display: flex;
    margin-bottom: 12px;
}
.input {
    flex-grow: 1;
}
.btn {
    margin-left: 10px;
    cursor: pointer;
    transition: 0.2s;
}
.btn:hover {
    background-color: #b697f3;
}
.input,
.btn {
    padding: 6px;
    border: none;
    outline: none;
    background: none;
    border: 1px solid #b697f3;
    border-radius: 4px;
    color: #f2f2f2;
}
.alert {
    padding: 8px 12px;
    background-color: #fefaf0;
    color: #f3b918;
    font-size: 0.8rem;
    border-radius: 4px;
}

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
