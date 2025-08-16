<template>
    <!-- Block 插槽 - 最外层，可以完全自定义整个代码块 -->
    <div class="shiki-stream-code-block" ref="codeBlockRef">
        <slot name="code-block" :highlightVnode="highlightVnode" :slotProps="slotProps">
            <!-- Header 插槽 -->
            <slot name="code-header" :slotProps="slotProps">
                <div class="code-header">
                    <div class="code-language">
                        {{ slotProps.language }}
                    </div>
                    <div class="code-actions">
                        <div v-if="isMermaid && isRendered" class="vmc-mermaid-actions">
                            <button :class="{ active: showImg }" @click="showImg = true">图形</button>
                            <button :class="{ active: !showImg }" @click="showImg = false">代码</button>
                        </div>
                        <slot name="actions" :slotProps="slotProps">
                            <div class="custom-actions">
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
                            </div>
                        </slot>
                    </div>
                </div>
            </slot>
            <!-- Content 插槽，用于自定义代码内容渲染 -->
            <div class="code-content-wrapper">
                <CollapseTransition>
                    <div class="code-content" v-show="showContent">
                        <div v-show="showImg" class="vmc-mermaid-content"></div>
                        <slot name="code-content" :highlightVnode="highlightVnode" :slotProps="slotProps">
                            <component v-show="!showImg" :is="highlightVnode" />
                        </slot>
                    </div>
                </CollapseTransition>
            </div>
        </slot>
    </div>
</template>

<script setup lang="ts">
import { computed, h, nextTick, ref, VNode, watch } from 'vue';
import { ShikiCachedRenderer } from 'shiki-stream/vue';
import { useShiki } from '../core/ShikiProvider';
import { THEME } from '../core/highlight/codeTheme';
import { ElementNode } from '../core/segmentText';
import { useProxyProps } from '../core/useProxyProps';
import CollapseTransition from './CollapseTransition.vue';
import { RiFileCopyLine, RiCheckLine, RiCollapseVerticalFill } from '@remixicon/vue';
import { MermaidConfig } from '../core/MermaidService';
const FALLBACK_LANG = 'ts';

interface Props {
    nodeJSON: string;
    generated: boolean;
}

interface SlotProps {
    highlightVnode: VNode;
    language: string;
    code: string;
}

const props = defineProps<Props>();
const isRendered = ref(false);
const isMermaid = computed(() => slotProps.value.language.toLocaleLowerCase() === 'mermaid');
const showImg = ref(false);
const emit = defineEmits<{
    'mermaid-rendered': [count: number];
}>();

const proxyProps = useProxyProps();
const { highlighter } = useShiki();

const themeStyle = computed(() => {
    const theme = proxyProps.theme;
    return THEME[theme];
});

const codeBlockRef = ref<HTMLElement | null>(null);

function getCodeMeta() {
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

            let matchedMarkdownCount = 0;
            if (language === 'markdown') {
                lines.forEach(line => {
                    const trimStartLine = line.trimStart();
                    if (trimStartLine.startsWith('```')) {
                        matchedMarkdownCount++;
                    }
                });
                if (lastLine && lastLine.trimStart().startsWith('```') && matchedMarkdownCount % 2 === 0) {
                    code = codeText;
                }
            } else {
                if (lastLine && lastLine.trimStart().startsWith('`')) {
                    code = lines.slice(0, lines.length - 1).join('\n');
                } else {
                    code = codeText;
                }
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
}

let mermaidService: any = null;
const renderMermaid = async () => {
    if (slotProps.value.code === '') {
        return;
    }
    if (!mermaidService) {
        try {
            const { MermaidService } = await import('../core/MermaidService');
            const config: MermaidConfig = {
                theme: proxyProps.theme === 'dark' ? 'dark' : 'light',
            };
            mermaidService = new MermaidService(config);
        } catch (error) {
            console.error('Failed to load MermaidService:', error);
            return;
        }
    }
    nextTick(async () => {
        const container = codeBlockRef.value?.querySelector('.vmc-mermaid-content');
        if (container) {
            await mermaidService.renderToContainer(
                container,
                slotProps.value.code,
                proxyProps.theme as 'light' | 'dark',
            );
            isRendered.value = true;
            showImg.value = true;
            emit('mermaid-rendered', 1); // 发出 mermaid 图片渲染事件
        }
    });
};

const slotProps = ref<SlotProps>({
    highlightVnode: h('div'),
    language: '',
    code: '',
});

const showContent = ref(true);
const toggleCollapse = () => {
    showContent.value = !showContent.value;
};

const highlightVnode = computed(() => {
    const { highlightLang, language, code: codeChunk } = getCodeMeta();
    if (!highlighter!.value || codeChunk === '') return null;
    const node = h(ShikiCachedRenderer, {
        highlighter: highlighter!.value,
        code: codeChunk,
        lang: highlightLang,
        theme: 'css-variables',
        style: {
            ...themeStyle.value,
            background: 'var(--vercel-code-block-background)',
        },
    });
    slotProps.value = {
        highlightVnode: node,
        language: language,
        code: codeChunk,
    };
    return node;
});

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

watch([() => props.generated, () => proxyProps.theme], ([generated, theme], [oldGenerated, oldTheme]) => {
    // 当 generated 变为 false 或主题发生变化时，重新渲染 Mermaid
    if (isMermaid.value && !generated) {
        renderMermaid();
    }
});
</script>

<style scoped lang="scss">
.shiki-stream-code-block {
    position: relative;
    border-radius: var(--vmc-border-radius);

    .code-content pre {
        border-radius: 0;
    }
}

.vmc-mermaid-content {
    background-color: var(--vmc-code-bg);
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

    .code-actions {
        display: flex;
        gap: var(--vmc-spacing-md);
        .vmc-mermaid-actions {
            display: flex;
            align-items: center;
            gap: 0; /* 挨在一起 */
            border-radius: 8px;
            overflow: hidden;
        }

        .vmc-mermaid-actions button {
            padding: var(--vmc-spacing-xs) var(--vmc-spacing-md);
            font-size: 14px;
            border: none;
            outline: none;
            background-color: var(--vmc);
            color: #333;
            cursor: pointer;
        }

        .vmc-mermaid-actions button.active {
            background-color: var(--vmc-background);
        }

        .custom-actions {
            display: flex;
            align-items: center;
            gap: var(--vmc-spacing-xs);

            .actions-btn {
                cursor: pointer;
                border: none;
                background: none;
                outline: none;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        }
    }
}
</style>
