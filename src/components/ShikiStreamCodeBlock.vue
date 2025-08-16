<template>
    <!-- Block 插槽 - 最外层，可以完全自定义整个代码块 -->
    <slot name="code-block" :highlightVnode="highlightVnode" :slotProps="slotProps">
        <div class="shiki-stream-code-block">
            <!-- Header 插槽 -->
            <slot name="code-header" :slotProps="slotProps">
                <div class="code-header">
                    <div class="code-language">
                        {{ slotProps.language }}
                    </div>
                    <div class="code-actions">
                        <slot name="actions" :slotProps="slotProps">
                            <button v-if="!isCopySuccess" @click="copyCode" class="actions-btn">
                                <RiFileCopyLine size="16" :color="proxyProps.theme === 'dark' ? '#fff' : '#000'" />
                            </button>
                            <RiCheckLine v-else size="16" color="#1afa29" />
                            <button @click="toggleCollapse" class="actions-btn">
                                <RiCollapseVerticalFill
                                    size="16"
                                    :color="proxyProps.theme === 'dark' ? '#fff' : '#000'"
                                />
                            </button>
                        </slot>
                    </div>
                </div>
            </slot>
            <!-- Content 插槽，用于自定义代码内容渲染 -->
            <div class="code-content-wrapper">
                <CollapseTransition>
                    <div class="code-content" v-show="showContent">
                        <slot name="code-content" :slotProps="slotProps">
                            <ShikiCachedRenderer
                                v-if="highlighter && codeMeta.code"
                                :highlighter="highlighter"
                                :code="codeMeta.code"
                                :lang="codeMeta.highlightLang"
                                theme="css-variables"
                                :style="{ ...themeStyle, background: 'var(--vercel-code-block-background)' }"
                            />
                        </slot>
                    </div>
                </CollapseTransition>
            </div>
        </div>
    </slot>
</template>

<script setup lang="ts">
import { computed, h, ref, VNode } from 'vue';
import { ShikiCachedRenderer } from 'shiki-stream/vue';
import { useShiki } from '../core/ShikiProvider';
import { THEME } from '../core/highlight/codeTheme';
import { ElementNode } from '../core/segmentText';
import { useProxyProps } from '../core/useProxyProps';
import CollapseTransition from './CollapseTransition.vue';
import { RiFileCopyLine, RiCheckLine, RiCollapseVerticalFill } from '@remixicon/vue';
const FALLBACK_LANG = 'ts';

interface Props {
    nodeJSON: string;
}

interface SlotProps {
    language: string;
    code: string;
}

const props = defineProps<Props>();

const proxyProps = useProxyProps();
const { highlighter } = useShiki();

const themeStyle = computed(() => {
    const theme = proxyProps.theme;
    return THEME[theme];
});

const codeMeta = computed(() => {
    const node = JSON.parse(props.nodeJSON) as ElementNode;
    const loadedLangs = highlighter!.value!.getLoadedLanguages();
    let language = '';
    let code = '';
    const codeNode = node.children[0];

    if (codeNode && codeNode.type === 'element' && codeNode.tagName === 'code') {
        const codeTextNode = codeNode.children[0];
        if (codeTextNode?.type === 'text') {
            const className = codeNode.properties.className as string[];
            if (className) {
                const languageClass = className.find(i => i.includes('language')) as string;
                if (languageClass) {
                    let [_, languageName] = languageClass.split('-');
                    language = languageName;
                }
            }

            const lastChar = codeTextNode.value.at(-1);
            const codeText = codeTextNode.value.slice(0, codeTextNode.value.length - (lastChar === '\n' ? 1 : 0));
            const lines = codeText.split('\n');
            const lastLine = lines.at(-1);

            if (lastLine && lastLine.trimStart().startsWith('`')) {
                code = lines.slice(0, lines.length - 1).join('\n');
            } else {
                code = codeText;
            }
        }
    }

    let highlightLang = language;
    if (!loadedLangs.includes(highlightLang)) highlightLang = FALLBACK_LANG;

    return {
        highlightLang,
        language,
        code,
    };
});

const showContent = ref(true);
const toggleCollapse = () => {
    showContent.value = !showContent.value;
};

const slotProps = computed(() => ({
    code: codeMeta.value.code,
    language: codeMeta.value.language,
}));

const isCopySuccess = ref(false);
const copyCode = () => {
    const { code } = slotProps.value;
    if (code) {
        navigator.clipboard
            .writeText(code)
            .then(() => {
                console.log('Code copied to clipboard');
                isCopySuccess.value = true;
                setTimeout(() => {
                    isCopySuccess.value = false;
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy code: ', err);
            });
    }
};
</script>

<style scoped lang="scss">
.shiki-stream-code-block {
    position: relative;
    border-radius: var(--vmc-border-radius);

    .code-content pre {
        border-radius: 0;
    }
}

.code-header {
    padding: 8px 16px;
    background-color: var(--vmc-code-header-bg);
    font-size: 12px;
    font-weight: 500;
    color: var(--vmc-text-secondary, #656d76);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .actions-btn {
        cursor: pointer;
    }
}
</style>
