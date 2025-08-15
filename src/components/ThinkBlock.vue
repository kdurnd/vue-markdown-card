<template>
    <!-- 优先级1：整体自定义插槽 -->
    <div class="think-block">
        <slot name="think-block" v-bind="slotProps">
            <div class="think-header" @click="toggleContent">
                <slot name="think-header" v-bind="slotProps">
                    <div class="header-content">
                        {{ slotProps.isThinking ? '🤔 思考中...' : '💡 思考完成' }}
                        <RiArrowDownSLine v-if="!slotProps.isShowContent" size="14" />
                        <RiArrowUpSLine v-else size="14" />
                    </div>
                </slot>
            </div>
            <div class="think-content-wrapper">
                <CollapseTransition>
                    <div v-show="showContent" class="think-content">
                        <slot name="think-content" v-bind="slotProps">
                            <component :is="slotProps.thinkContentVNode" />
                        </slot>
                    </div>
                </CollapseTransition>
            </div>
        </slot>
    </div>
</template>

<script setup lang="ts">
import { computed, h, PropType, ref } from 'vue';
import { ElementNode } from '../core/segmentText';
import CollapseTransition from './CollapseTransition.vue';
import { RiArrowDownSLine, RiArrowUpSLine } from '@remixicon/vue';

const props = defineProps<{
    node: ElementNode;
    generated?: boolean;
}>();

function renderHtmlAstNode(node: any): any {
    if (node.type === 'text') {
        return node.value;
    }
    if (node.type === 'element') {
        const children = node.children?.map(renderHtmlAstNode) || [];
        // @ts-ignore
        return h(node.tagName, node.properties || {}, children);
    }
    return null;
}

const thinkContentVNode = computed(() => renderHtmlAstNode(props.node));

// 提取原始内容的函数
function extractRawContent(node: any): string {
    if (!node) return '';
    if (node.type === 'text') {
        return node.value || '';
    }
    if (node.type === 'element') {
        if (node.children && Array.isArray(node.children)) {
            return node.children.map(extractRawContent).join('');
        }
    }
    return '';
}

const showContent = ref(true);
function toggleContent() {
    showContent.value = !showContent.value;
}

const slotProps = computed(() => ({
    isThinking: props.generated,
    thinkContentVNode: thinkContentVNode.value, // 保留VNode用于渲染
    rawContent: extractRawContent(props.node), // 新增：原始文本内容
    originalNode: props.node, // 新增：原始节点数据（不包含VNode）
    isShowContent: showContent.value, // 新增：是否显示内容
}));
</script>

<style scoped>
.think-block {
    margin: var(--vmc-spacing-md) 0;
}

.think-header {
    cursor: pointer;
    font-size: var(--vmc-font-size-sm);
    margin-bottom: var(--vmc-spacing-sm);
    width: fit-content;
    border-radius: var(--vmc-border-radius);
    padding: var(--vmc-spacing-sm) var(--vmc-spacing-md);
    background-color: var(--vmc-think-header-bg);
    color: var(--vmc-think-text);
}
.header-content {
    display: flex;
    align-items: center;
}

.think-header:hover .header-content {
    background-color: var(--vmc-think-header-hover-bg);
}

.think-content-wrapper {
    font-size: var(--vmc-font-size-sm);
    color: var(--vmc-think-text);
}

.think-content {
    overflow: hidden;
    border-left: 3px solid var(--vmc-think-content-border);
    padding-left: var(--vmc-spacing-md);
    margin-top: var(--vmc-spacing-sm);
}
</style>
