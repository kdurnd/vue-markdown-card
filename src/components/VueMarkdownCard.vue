<template>
    <VueMarkdownRenderer
        :source="source"
        :theme="theme"
        :components-map="componentsMap"
        :remark-plugins="remarkPlugins"
        :rehype-plugins="rehypePlugins"
        :extra-langs="extraLangs"
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
</template>

<script setup lang="ts">
import VueMarkdownRenderer from '../core/VueMarkdownRenderer';
import SelectPopoverProvider from './SelectPopoverProvider.vue';
import ThinkBlock from './ThinkBlock.vue';
import { type PluggableList } from 'unified';
import { Langs } from '../core/highlight/shiki';
import { computed, onBeforeUnmount, onMounted, ref, useSlots, watchEffect } from 'vue';

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
    }>(),
    {
        theme: 'light',
        useSelection: false,
    },
);

const slots = useSlots();

const isDark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches);
const theme = computed(() => (isDark.value ? 'dark' : 'light'));
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

onMounted(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = e => {
        isDark.value = e.matches;
    };

    mediaQuery.addEventListener('change', handler);
});

onBeforeUnmount(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = e => {
        isDark.value = e.matches;
    };

    mediaQuery.removeEventListener('change', handler);
});
</script>
