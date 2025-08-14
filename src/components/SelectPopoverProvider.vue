<template>
    <div class="select-popover-provider" ref="selectPopoverProvider">
        <slot></slot>
    </div>
    <div
        class="select-popover"
        :style="{
            position: strategy,
            top: `${y}px`,
            left: `${x}px`,
        }"
        v-if="selectPopoverVisible && !disabled"
        ref="selectPopover"
    >
        <slot name="reference" :range="currentRange">{{ '123123123123' }}</slot>
    </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue';
import { useFloating, offset, flip, shift, inline, autoUpdate } from '@floating-ui/vue';
import { debounce } from 'lodash-es';

const props = withDefaults(
    defineProps<{
        disabled?: boolean;
        blacklist?: string[]; // 新增黑名单参数，接受CSS选择器数组
        minCount?: number; // 新增最小选中字符数参数
    }>(),
    {
        disabled: false,
        blacklist: () => [], // 默认为空数组
        minCount: 3,
    },
);

const selectPopoverVisible = ref(false);
const selectPopoverProvider = ref<HTMLElement | null>(null);
const selectPopover = ref<HTMLElement | null>(null);

// 这里保存选区范围引用
const currentRange = ref<Range | null>(null);

const virtualEl = ref({
    getBoundingClientRect: () => (currentRange.value ? currentRange.value.getBoundingClientRect() : new DOMRect()),
    getClientRects: () =>
        currentRange.value ? currentRange.value.getClientRects() : document.createRange().getClientRects(),
    contextElement: selectPopoverProvider.value || document.body,
});

const { x, y, strategy, update } = useFloating(virtualEl, selectPopover, {
    placement: 'top',
    middleware: [flip(), shift(), inline()],
    whileElementsMounted: autoUpdate,
});

// 检查选中的内容是否在黑名单元素中
const isInBlacklist = (selection: Selection): boolean => {
    if (!props.blacklist.length) return false;
    
    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;
    
    // 获取包含选中内容的元素
    const containerElement = commonAncestor.nodeType === Node.TEXT_NODE 
        ? commonAncestor.parentElement 
        : commonAncestor as Element;
    
    if (!containerElement) return false;
    
    // 检查容器元素或其祖先元素是否匹配黑名单中的选择器
    for (const selector of props.blacklist) {
        try {
            if (containerElement.closest(selector)) {
                return true;
            }
        } catch (error) {
            console.warn(`Invalid selector in blacklist: ${selector}`, error);
        }
    }
    
    return false;
};

const handleSelectionChange = () => {
    const selection = window.getSelection();

    // 没有选中内容 -> 立即关闭
    if (
        !selection ||
        selection.isCollapsed ||
        !selectPopoverProvider.value?.contains(selection.anchorNode) ||
        !selectPopoverProvider.value?.contains(selection.focusNode)
    ) {
        selectPopoverVisible.value = false;
        currentRange.value = null;
        return;
    }

    // 检查是否在黑名单中 -> 立即关闭
    if (isInBlacklist(selection)) {
        selectPopoverVisible.value = false;
        currentRange.value = null;
        return;
    }

    // 有选中内容且不在黑名单中 -> 用 debounce 更新位置
    debouncedUpdateSelection();
};

const debouncedUpdateSelection = debounce(() => {
    const selection = window.getSelection();
    if (!selection) return;

    const range = selection.getRangeAt(0);
    if (range.toString().length < props.minCount) {
        selectPopoverVisible.value = false;
        currentRange.value = null;
        return;
    }
    currentRange.value = range;
    selectPopoverVisible.value = true;

    update();
}, 500);

watch(() => props.disabled, (newVal) => {
    if (newVal) {
        document.removeEventListener('selectionchange', handleSelectionChange);
    } else {
        document.addEventListener('selectionchange', handleSelectionChange);

    }
});

onMounted(() => {
    if (!props.disabled) {
        document.addEventListener('selectionchange', handleSelectionChange);
    }
});

onBeforeUnmount(() => {
    document.removeEventListener('selectionchange', handleSelectionChange);
});
</script>

<style scoped>
.select-popover {
    width: fit-content;
    z-index: 1000;
}
</style>
