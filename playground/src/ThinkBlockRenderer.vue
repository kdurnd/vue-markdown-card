<template>
    <div class="think-block">
        <header class="think-block-header" @click="toggleThinkContent">
            <div>{{ isThinking ? '正在思考中...' : '思考结束' }}</div>
        </header>
        <main class="think-content-wrapper">
            <Transition name="think">
                <div class="think-block-content" v-if="thinkContentVisible">
                    <component :is="thinkContentVNode" />
                </div>
            </Transition>
        </main>
    </div>
</template>

<script lang="ts" setup>
import { ref, VNode } from 'vue';

const props = defineProps<{
   isThinking: boolean;
   thinkContentVNode: VNode;
}>();

const thinkContentVisible = ref(true);
const toggleThinkContent = () => {
    thinkContentVisible.value = !thinkContentVisible.value;
};
</script>

<style lang="scss" scoped>
.think-enter-active,
.think-leave-active {
    transition: all 0.5s ease;
}

.think-enter-from,
.think-leave-to {
    transform: translateY(-20px);
    opacity: 0;
}

.think-content-wrapper {
    overflow: hidden;

    .think-block-content {
        padding: 0.5em 1em;
        border-left: 0.25em solid #ccc;
    }
}
</style>
