<template>
    <div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 20px" class="p-2">
            <Button @click="clickHandle" :disabled="isRender">re-grenerate ~</Button>
            <a href="https://github.com/linzhe141/vue-markdown-renderer">
                <svg
                    class="fill-black dark:fill-white"
                    height="32"
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    version="1.1"
                    width="32"
                    data-view-component="true"
                >
                    <path
                        d="M12.5.75C6.146.75 1 5.896 1 12.25c0 5.089 3.292 9.387 7.863 10.91.575.101.79-.244.79-.546 0-.273-.014-1.178-.014-2.142-2.889.532-3.636-.704-3.866-1.35-.13-.331-.69-1.352-1.18-1.625-.402-.216-.977-.748-.014-.762.906-.014 1.553.834 1.769 1.179 1.035 1.74 2.688 1.25 3.349.948.1-.747.402-1.25.733-1.538-2.559-.287-5.232-1.279-5.232-5.678 0-1.25.445-2.285 1.178-3.09-.115-.288-.517-1.467.115-3.048 0 0 .963-.302 3.163 1.179.92-.259 1.897-.388 2.875-.388.977 0 1.955.13 2.875.388 2.2-1.495 3.162-1.179 3.162-1.179.633 1.581.23 2.76.115 3.048.733.805 1.179 1.825 1.179 3.09 0 4.413-2.688 5.39-5.247 5.678.417.36.776 1.05.776 2.128 0 1.538-.014 2.774-.014 3.162 0 .302.216.662.79.547C20.709 21.637 24 17.324 24 12.25 24 5.896 18.854.75 12.5.75Z"
                    ></path>
                </svg>
            </a>
            <Button @click="changeTheme">change theme to {{ switchTheme }}</Button>
        </div>
        <div class="vue-markdown-wrapper mx-auto my-10 max-w-4xl">
            <VueMarkdownCard
                :source="mdText"
                :theme="switchTheme === 'dark' ? 'light' : 'dark'"
                :components-map="componentsMap"
                :enableMath="true"
                :enable-emoji="true"
            >
            </VueMarkdownCard>
        </div>
    </div>
</template>

<script setup>
import { VueMarkdownCard } from '../../src';
import { onMounted, ref, shallowRef } from 'vue';
import './animation.css';
import Button from './Button.vue';
import java from '@shikijs/langs/java';
import 'katex/dist/katex.min.css';
import BarChart from './BarChart.vue';
import Placeholder from './Placeholder.vue';
import CodeBlockRendererComp from './CodeBlockRenderer.vue';

// 安全的对象序列化函数，避免循环引用
function safeStringify(obj, indent = 2) {
    const seen = new WeakSet();
    return JSON.stringify(
        obj,
        (key, val) => {
            if (val != null && typeof val === 'object') {
                if (seen.has(val)) {
                    return '[Circular Reference]';
                }
                seen.add(val);
            }
            // 过滤掉VNode的复杂属性，但保留简单的原始数据
            if (key === 'thinkContentVNode') {
                return '[VNode - 已过滤]';
            }
            if (key === 'component' || key === 'vnode' || key === 'el' || key === 'parent') {
                return '[VNode Property]';
            }
            return val;
        },
        indent,
    );
}

function createStream(text, chunkSize = 15, delay = 50) {
    let position = 0;
    return new ReadableStream({
        pull(controller) {
            return new Promise(resolve => {
                setTimeout(() => {
                    if (position >= text.length) {
                        controller.close();
                        resolve();
                        return;
                    }

                    const chunk = text.slice(position, position + chunkSize);
                    position += chunkSize;
                    controller.enqueue(chunk);

                    resolve();
                }, delay);
            });
        },
    });
}
const mdText = ref('');
const isRender = ref(true);
async function clickHandle() {
    mdText.value = '';
    isRender.value = true;
    const res = await fetch('./md.md');
    const md = await res.text();
    const stream = createStream(md);
    // ios 不支持 Symbol.asyncIterator
    const reader = stream.getReader();
    while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        mdText.value += chunk;
    }
    isRender.value = false;
}

onMounted(clickHandle);

const switchTheme = ref('dark');

function changeTheme() {
    switchTheme.value = switchTheme.value === 'dark' ? 'light' : 'dark';
}

const componentsMap = {
    BarChart,
    Placeholder,
};
const extraLangs = [java];

// 代码复制功能
function copyCode(code) {
    if (!code) return;
    navigator.clipboard
        .writeText(code)
        .then(() => {
            console.log('代码已复制到剪贴板');
            // 这里可以添加一个提示消息
        })
        .catch(err => {
            console.error('复制失败:', err);
            // 降级方案：使用传统的复制方法
            const textArea = document.createElement('textarea');
            textArea.value = code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        });
}
</script>

<style scoped>
/* 自定义代码块样式 */
.custom-code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-size: 14px;
    border-radius: 6px 6px 0 0;
}

.language-badge {
    background: rgba(255, 255, 255, 0.2);
    padding: 2px 8px;
    border-radius: 12px;
    font-weight: 500;
    text-transform: uppercase;
    font-size: 12px;
}

.code-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}

.copy-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: background 0.2s;
}

.copy-btn:hover {
    background: rgba(255, 255, 255, 0.3);
}

.lines-count {
    font-size: 12px;
    opacity: 0.8;
}

/* Block 插槽自定义样式 */
.custom-code-block-wrapper {
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    background: white;
    margin: 16px 0;
}

.custom-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    color: white;
}

.lang-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.language-tag {
    background: rgba(255, 255, 255, 0.2);
    padding: 4px 12px;
    border-radius: 16px;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.char-count {
    font-size: 12px;
    opacity: 0.9;
}

.custom-copy-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    padding: 6px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
}

.custom-copy-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
}

.custom-code-wrapper {
    background: #f8fafc;
    overflow-x: auto;
}

.custom-footer {
    padding: 8px 16px;
    background: #f1f5f9;
    border-top: 1px solid #e2e8f0;
    color: #64748b;
    font-size: 12px;
    text-align: right;
}

/* 深色主题适配 */
:global(.dark) .custom-code-block-wrapper {
    background: #1e293b;
    border-color: #374151;
}

:global(.dark) .custom-code-wrapper {
    background: #0f172a;
}

:global(.dark) .custom-footer {
    background: #1e293b;
    border-color: #374151;
    color: #94a3b8;
}
</style>
