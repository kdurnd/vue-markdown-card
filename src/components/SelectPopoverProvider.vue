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
        <slot name="reference" :range="currentRange">弹出层</slot>
    </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue';
import { useFloating, offset, flip, shift, inline, autoUpdate } from '@floating-ui/vue';
import { debounce } from 'lodash-es';

const props = withDefaults(
    defineProps<{
        disabled?: boolean;
    }>(),
    {
        disabled: false,
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

    // 有选中内容 -> 用 debounce 更新位置
    debouncedUpdateSelection();
};

const debouncedUpdateSelection = debounce(() => {
    const selection = window.getSelection();
    if (!selection) return;

    const range = selection.getRangeAt(0);
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
