<template>
    <article ref="vueMarkdownCard" class="vue-markdown-card">
        <VueMarkdownRenderer
            :source="source"
            :theme="theme"
            :components-map="componentsMap"
            :remark-plugins="remarkPlugins"
            :rehype-plugins="rehypePlugins"
            :extra-langs="extraLangs"
            @images-count-updated="handleImagesCountUpdated"
        >
            <template #think-block="slotProps">
                <slot name="think-block" v-bind="slotProps"></slot>
            </template>
            <template #think-header="slotProps">
                <slot name="think-header" v-bind="slotProps"></slot>
            </template>
            <template #think-content="slotProps">
                <slot name="think-content" v-bind="slotProps"></slot>
            </template>
        </VueMarkdownRenderer>
    </article>
</template>

<script setup lang="ts">
import VueMarkdownRenderer from '../core/VueMarkdownRenderer';
import ThinkBlock from './ThinkBlock.vue';
import { type PluggableList } from 'unified';
import { Langs } from '../core/highlight/shiki';
import { computed, onBeforeUnmount, onMounted, ref, useSlots, watchEffect } from 'vue';
import Viewer from 'viewerjs';
import 'viewerjs/dist/viewer.css';

const props = withDefaults(
    defineProps<{
        source: string;
        theme: 'dark' | 'light' | 'auto';
        useSelection: boolean;
        remarkPlugins?: PluggableList;
        rehypePlugins?: PluggableList;
        extraLangs?: Langs[];
        enableMath?: boolean;
        enableMermaid?: boolean;
        enableEmoji?: boolean;
        enableImagePreview?: boolean;
    }>(),
    {
        theme: 'light',
        useSelection: false,
        enableImagePreview: true,
    },
);

const slots = useSlots();

const vueMarkdownCard = ref<HTMLElement>();
const isDark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches);
const theme = computed(() => (props.theme === 'auto' ? (isDark.value ? 'dark' : 'light') : props.theme));
const componentsMap = {
    think: ThinkBlock,
};

function convertLatexDelimiters(text) {
    const pattern = /(```[\S\s]*?```|`.*?`)|\\\[([\S\s]*?[^\\])\\]|\\\((.*?)\\\)/g;
    return text.replaceAll(pattern, (match, codeBlock, squareBracket, roundBracket) => {
        if (codeBlock !== undefined) {
            return codeBlock;
        } else if (squareBracket !== undefined) {
            return `$$${squareBracket}$$`;
        } else if (roundBracket !== undefined) {
            return `$${roundBracket}$`;
        }
        return match;
    });
}

const source = computed(() => convertLatexDelimiters(props.source));

const remarkPlugins = ref<PluggableList>(props.remarkPlugins ?? []);
const rehypePlugins = ref<PluggableList>(props.rehypePlugins ?? []);

async function loadPlugins() {
    const remarkList = [...(props.remarkPlugins ?? [])];
    const rehypeList = [...(props.rehypePlugins ?? [])];

    if (props.enableMath) {
        const { default: remarkMath } = await import('remark-math');
        const { default: rehypeKatex } = await import('rehype-katex');
        remarkList.push(remarkMath);
        rehypeList.push(rehypeKatex);
    }
    if (props.enableEmoji) {
        const { default: remarkEmoji } = await import('remark-emoji');
        remarkList.push([remarkEmoji, { emoticon: true }]);
    }
    if (props.enableMermaid) {
        const { default: rehypeMermaidjs } = await import('rehype-mermaidjs');
        rehypeList.push(rehypeMermaidjs);
    }

    remarkPlugins.value = remarkList;
    rehypePlugins.value = rehypeList;
}

watchEffect(() => {
    loadPlugins();
});

let gallery: Viewer | null = null;

// 处理图片数量更新
const handleImagesCountUpdated = (count: number) => {
    if (gallery && props.enableImagePreview) {
        gallery.update();
    }
};

onMounted(() => {
    if (vueMarkdownCard.value && props.enableImagePreview) {
        gallery = new Viewer(vueMarkdownCard.value, {
            toolbar: {
                zoomIn: 4,
                zoomOut: 4,
                oneToOne: 4,
                reset: 4,
                prev: 4,
                play: {
                    show: 4,
                    size: 'large',
                },
                next: 4,
                rotateLeft: 4,
                rotateRight: 4,
                flipHorizontal: 4,
                flipVertical: 4,
            },
        });
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = e => {
        isDark.value = e.matches;
    };

    mediaQuery.addEventListener('change', handler);
});

onBeforeUnmount(() => {
    if (gallery) {
        gallery.destroy();
        gallery = null;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = e => {
        isDark.value = e.matches;
    };

    mediaQuery.removeEventListener('change', handler);
});
</script>

<style scoped>
/* CSS 变量定义 - 默认亮色模式 */
.vue-markdown-card {
    /* 颜色变量 */
    --vmc-text-primary: rgb(51 65 85); /* slate-700 */
    --vmc-text-secondary: rgb(15 23 42); /* slate-900 */
    --vmc-text-muted: rgb(100 116 139); /* slate-500 */
    --vmc-background: rgb(255 255 255); /* white */
    --vmc-background-code: rgb(51 65 85); /* slate-700 */
    --vmc-border: rgb(226 232 240); /* slate-200 */
    --vmc-accent: rgb(15 118 110); /* teal-700 */

    /* ThinkBlock 专用变量 */
    --vmc-think-header-bg: rgb(248 250 252); /* slate-50 */
    --vmc-think-header-hover-bg: rgb(241 245 249); /* slate-100 */
    --vmc-think-content-border: rgb(59 130 246); /* blue-500 */
    --vmc-think-text: rgb(71 85 105); /* slate-600 */

    /* 尺寸变量 */
    --vmc-spacing-xs: 0.125rem;
    --vmc-spacing-sm: 0.25rem;
    --vmc-spacing-md: 0.5rem;
    --vmc-spacing-lg: 0.75em;
    --vmc-spacing-xl: 1em;
    --vmc-spacing-2xl: 1.25em;

    /* 字体变量 */
    --vmc-font-size-sm: 0.875em;
    --vmc-font-size-base: 1em;
    --vmc-font-size-lg: 1.25em;
    --vmc-font-size-xl: 1.5em;
    --vmc-font-size-2xl: 2.25em;

    --vmc-font-weight-normal: 400;
    --vmc-font-weight-medium: 500;
    --vmc-font-weight-semibold: 600;
    --vmc-font-weight-bold: 700;
    --vmc-font-weight-extrabold: 800;

    /* 行高变量 */
    --vmc-line-height-tight: 1.1111111;
    --vmc-line-height-snug: 1.3333333;
    --vmc-line-height-normal: 1.6;
    --vmc-line-height-relaxed: 1.7142857;

    /* 圆角变量 */
    --vmc-border-radius: 0.375rem;
}

/* 暗色模式 - 直接修改CSS变量值 */
.dark .vue-markdown-card,
.vue-markdown-card:where(.dark, .dark *) {
    --vmc-text-primary: rgb(226 232 240); /* slate-200 */
    --vmc-text-secondary: rgb(248 250 252); /* slate-50 */
    --vmc-background: rgb(0 0 0); /* black */
    --vmc-background-code: rgb(15 23 42); /* slate-900 */
    --vmc-border: rgb(71 85 105); /* slate-600 */
    --vmc-accent: rgb(94 234 212); /* teal-300 */

    /* ThinkBlock 暗色模式变量 */
    --vmc-think-header-bg: rgb(30 41 59); /* slate-800 */
    --vmc-think-header-hover-bg: rgb(51 65 85); /* slate-700 */
    --vmc-think-content-border: rgb(96 165 250); /* blue-400 */
    --vmc-think-text: rgb(148 163 184); /* slate-400 */
}

/* Vue Markdown Card 基础样式 */
.vue-markdown-card {
    /* 继承父元素的字体设置 */
    font-family: inherit;
    line-height: inherit;

    /* 使用CSS变量 */
    color: var(--vmc-text-primary);
    background-color: var(--vmc-background);
    padding: var(--vmc-spacing-sm);
    max-width: none;
}

/* Typography 样式 - 统一使用CSS变量 */
.vue-markdown-card :deep(h1) {
    color: var(--vmc-text-secondary);
    font-weight: var(--vmc-font-weight-extrabold);
    font-size: var(--vmc-font-size-2xl);
    margin-top: var(--vmc-spacing-xl);
    margin-bottom: var(--vmc-spacing-md);
    line-height: var(--vmc-line-height-tight);
}

.vue-markdown-card :deep(h2) {
    color: var(--vmc-text-secondary);
    font-weight: var(--vmc-font-weight-bold);
    font-size: var(--vmc-font-size-xl);
    margin-top: var(--vmc-spacing-xl);
    margin-bottom: var(--vmc-spacing-md);
    line-height: var(--vmc-line-height-snug);
}

.vue-markdown-card :deep(h3) {
    color: var(--vmc-text-secondary);
    font-weight: var(--vmc-font-weight-semibold);
    font-size: var(--vmc-font-size-lg);
    margin-top: var(--vmc-spacing-xl);
    margin-bottom: var(--vmc-spacing-md);
    line-height: var(--vmc-line-height-normal);
}

.vue-markdown-card :deep(p) {
    margin-top: var(--vmc-spacing-lg);
    margin-bottom: var(--vmc-spacing-lg);
}

.vue-markdown-card :deep(a) {
    color: var(--vmc-accent);
    text-decoration: underline;
    font-weight: var(--vmc-font-weight-medium);
}

.vue-markdown-card :deep(strong) {
    color: var(--vmc-text-secondary);
    font-weight: var(--vmc-font-weight-semibold);
}

.vue-markdown-card :deep(code) {
    color: var(--vmc-text-secondary);
    font-weight: var(--vmc-font-weight-semibold);
    font-size: var(--vmc-font-size-sm);
}

.vue-markdown-card :deep(pre) {
    color: var(--vmc-text-primary);
    background-color: var(--vmc-background-code);
    overflow-x: auto;
    font-weight: var(--vmc-font-weight-normal);
    font-size: var(--vmc-font-size-sm);
    line-height: var(--vmc-line-height-relaxed);
    margin-top: var(--vmc-spacing-md);
    margin-bottom: var(--vmc-spacing-md);
    border-radius: var(--vmc-border-radius);
    padding: var(--vmc-spacing-sm) var(--vmc-spacing-md);
}

.vue-markdown-card :deep(ul),
.vue-markdown-card :deep(ol) {
    margin-top: var(--vmc-spacing-lg);
    margin-bottom: var(--vmc-spacing-lg);
    padding-left: 1.625em;
}

.vue-markdown-card :deep(ul) {
    list-style-type: disc;
}

.vue-markdown-card :deep(ol) {
    list-style-type: decimal;
}

.vue-markdown-card :deep(li) {
    margin-top: var(--vmc-spacing-sm);
    margin-bottom: var(--vmc-spacing-sm);
}

.vue-markdown-card :deep(blockquote) {
    font-weight: var(--vmc-font-weight-medium);
    font-style: italic;
    color: var(--vmc-text-secondary);
    border-left-width: var(--vmc-spacing-xs);
    border-left-color: var(--vmc-border);
    border-left-style: solid;
    quotes: '\201C' '\201D' '\2018' '\2019';
    margin-top: var(--vmc-spacing-xl);
    margin-bottom: var(--vmc-spacing-xl);
    padding-left: var(--vmc-spacing-md);
}
</style>
