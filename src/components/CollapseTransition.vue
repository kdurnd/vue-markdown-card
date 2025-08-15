<template>
    <transition v-bind="transitionProps">
        <slot />
    </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    duration?: number;
    timingFunction?: string;
}

const props = withDefaults(defineProps<Props>(), {
    duration: 300,
    timingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
});

const transitionProps = computed(() => ({
    onBeforeEnter: (el: Element) => {
        const htmlEl = el as HTMLElement;
        htmlEl.dataset.oldPaddingTop = htmlEl.style.paddingTop;
        htmlEl.dataset.oldPaddingBottom = htmlEl.style.paddingBottom;
        htmlEl.style.maxHeight = '0';
        htmlEl.style.paddingTop = '0';
        htmlEl.style.paddingBottom = '0';
        htmlEl.style.transition = `max-height ${props.duration}ms ${props.timingFunction}, padding-top ${props.duration}ms ${props.timingFunction}, padding-bottom ${props.duration}ms ${props.timingFunction}, opacity ${props.duration}ms ${props.timingFunction}`;
    },
    onEnter: (el: Element) => {
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
    onAfterEnter: (el: Element) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.maxHeight = '';
        htmlEl.style.overflow = htmlEl.dataset.oldOverflow || '';
        htmlEl.style.transition = '';
    },
    onBeforeLeave: (el: Element) => {
        const htmlEl = el as HTMLElement;
        htmlEl.dataset.oldPaddingTop = htmlEl.style.paddingTop;
        htmlEl.dataset.oldPaddingBottom = htmlEl.style.paddingBottom;
        htmlEl.dataset.oldOverflow = htmlEl.style.overflow;
        htmlEl.style.maxHeight = htmlEl.scrollHeight + 'px';
        htmlEl.style.overflow = 'hidden';
        htmlEl.style.transition = `max-height ${props.duration}ms ${props.timingFunction}, padding-top ${props.duration}ms ${props.timingFunction}, padding-bottom ${props.duration}ms ${props.timingFunction}, opacity ${props.duration}ms ${props.timingFunction}`;
    },
    onLeave: (el: Element) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.scrollHeight !== 0) {
            htmlEl.style.maxHeight = '0';
            htmlEl.style.paddingTop = '0';
            htmlEl.style.paddingBottom = '0';
        }
    },
    onAfterLeave: (el: Element) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.maxHeight = '';
        htmlEl.style.overflow = htmlEl.dataset.oldOverflow || '';
        htmlEl.style.paddingTop = htmlEl.dataset.oldPaddingTop || '';
        htmlEl.style.paddingBottom = htmlEl.dataset.oldPaddingBottom || '';
        htmlEl.style.transition = '';
    },
}));
</script>
