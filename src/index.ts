// 导出主要组件
export { default as VueMarkdownRenderer } from './core/VueMarkdownRenderer';
export { default as VueMarkdownCard } from './components/VueMarkdownCard.vue';
export { default as CollapseTransition } from './components/CollapseTransition.vue';
export { default as ShikiStreamCodeBlock } from './components/ShikiStreamCodeBlock.vue';
export { default as ThinkBlock } from './components/ThinkBlock.vue';
export { default as SelectPopoverProvider } from './components/SelectPopoverProvider.vue';

// 导出工具函数和类型
export * from './core/ShikiProvider';
export * from './core/useProxyProps';
export * from './core/segmentText';
export * from './core/symbol';

// 导出类型
export type { Langs } from './core/highlight/shiki';

// 导出样式
import './style.css';
