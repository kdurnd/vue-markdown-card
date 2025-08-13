<template>
    <!-- 优先级1：整体自定义插槽 -->
    <slot name="think-block" v-bind="slotProps">
        <!-- 优先级2：分块插槽 -->
        <div class="think-block">
            <div class="think-header" @click="toggleContent">
                <slot name="think-header" v-bind="slotProps">
                    <div class="header-content">
                        {{ slotProps.isThinking ? '🤔 思考中...' : '💡 思考完成' }}
                    </div>
                </slot>
            </div>
            <div class="think-content-wrapper">
                <transition v-bind="collapseTransition">
                    <div v-show="showContent" class="think-content">
                        <slot name="think-content" v-bind="slotProps">
                            <component :is="slotProps.thinkContentVNode" />
                        </slot>
                    </div>
                </transition>
            </div>
        </div>
    </slot>
</template>

<script setup lang="ts">
import { computed, h, PropType, ref } from 'vue';
import { ElementNode } from '../core/segmentText';

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

const slotProps = computed(() => ({
    isThinking: props.generated,
    thinkContentVNode: thinkContentVNode.value, // 保留VNode用于渲染
    rawContent: extractRawContent(props.node), // 新增：原始文本内容
    originalNode: props.node, // 新增：原始节点数据（不包含VNode）
}));

const showContent = ref(true);
function toggleContent() {
    showContent.value = !showContent.value;
}

const collapseTransition = {
    onBeforeEnter(el: Element) {
        const htmlEl = el as HTMLElement;
        htmlEl.dataset.oldPaddingTop = htmlEl.style.paddingTop;
        htmlEl.dataset.oldPaddingBottom = htmlEl.style.paddingBottom;
        htmlEl.style.maxHeight = '0';
        htmlEl.style.paddingTop = '0';
        htmlEl.style.paddingBottom = '0';
    },
    onEnter(el: Element) {
        const htmlEl = el as HTMLElement;
        htmlEl.dataset.oldOverflow = htmlEl.style.overflow;
        if (htmlEl.scrollHeight !== 0) {
            htmlEl.style.maxHeight = htmlEl.scrollHeight + 'px';
            htmlEl.style.paddingTop = htmlEl.dataset.oldPaddingTop || '';
            htmlEl.style.paddingBottom = htmlEl.dataset.oldPaddingBottom || '';
        } else {
            htmlEl.style.maxHeight = '0';
            htmlEl.style.paddingTop = htmlEl.dataset.oldPaddingTop || '';
            htmlEl.style.paddingBottom = htmlEl.dataset.oldPaddingBottom || '';
        }
        htmlEl.style.overflow = 'hidden';
    },
    onAfterEnter(el: Element) {
        const htmlEl = el as HTMLElement;
        htmlEl.style.maxHeight = '';
        htmlEl.style.overflow = htmlEl.dataset.oldOverflow || '';
    },
    onBeforeLeave(el: Element) {
        const htmlEl = el as HTMLElement;
        htmlEl.dataset.oldPaddingTop = htmlEl.style.paddingTop;
        htmlEl.dataset.oldPaddingBottom = htmlEl.style.paddingBottom;
        htmlEl.dataset.oldOverflow = htmlEl.style.overflow;
        htmlEl.style.maxHeight = htmlEl.scrollHeight + 'px';
        htmlEl.style.overflow = 'hidden';
    },
    onLeave(el: Element) {
        const htmlEl = el as HTMLElement;
        if (htmlEl.scrollHeight !== 0) {
            htmlEl.style.maxHeight = '0';
            htmlEl.style.paddingTop = '0';
            htmlEl.style.paddingBottom = '0';
        }
    },
    onAfterLeave(el: Element) {
        const htmlEl = el as HTMLElement;
        htmlEl.style.maxHeight = '';
        htmlEl.style.overflow = htmlEl.dataset.oldOverflow || '';
        htmlEl.style.paddingTop = htmlEl.dataset.oldPaddingTop || '';
        htmlEl.style.paddingBottom = htmlEl.dataset.oldPaddingBottom || '';
    },
};
</script>

<style scoped>
.header-content {

}

.think-content {
    transition:
        max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
        padding-top 0.3s cubic-bezier(0.4, 0, 0.2, 1),
        padding-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1),
        opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
}

.think-header {
    cursor: pointer;
    user-select: none;
    font-size: 0.875rem;
}

.think-content-wrapper {
    position: relative;
    overflow: hidden;
}
</style>
