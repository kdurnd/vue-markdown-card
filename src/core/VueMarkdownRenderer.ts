import { h, defineComponent, type PropType, computed, type Component } from 'vue';
import { Fragment } from 'vue/jsx-runtime';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { VFile } from 'vfile';
import { unified, type PluggableList } from 'unified';
import { segmentTextComponents } from './segmentText';
import { ShikiProvider } from './ShikiProvider';
import { Langs } from './highlight/shiki';
import { remarkComponentCodeBlock, ComponentCodeBlock } from './plugin/remarkComponentCodeBlock';
import { rehypePassGeneratedProp } from './plugin/rehypePassGeneratedProp';
import { ShikiStreamCodeBlock } from './ShikiStreamCodeBlock';
import { provideProxyProps } from './useProxyProps';
import SelectPopoverProvider from '../components/SelectPopoverProvider.vue';
import ThinkBlock from '../components/ThinkBlock.vue';
interface RemarkRehypeOptions {
    allowDangerousHtml?: boolean;
    [key: string]: any;
}

function jsx(type: any, props: Record<any, any>, key: any) {
    const { children } = props;
    delete props.children;
    if (arguments.length > 2) {
        props.key = key;
    }
    if (type === Fragment) {
        return h(type, props, children);
    } else if (typeof type !== 'string') {
        if (type === ShikiStreamCodeBlock) {
            // 使用json字符串作为prop的目的是防止ShikiStreamCodeBlock组件不必要的re-render
            const nodeJSON = JSON.stringify(props.node);
            delete props.node;
            return h(type, { ...props, nodeJSON });
        }
        return h(type, props);
    }
    return h(type, props, children);
}

export default defineComponent({
    name: 'VueMarkdownRenderer',
    props: {
        source: {
            type: String as PropType<string>,
            required: true,
        },
        theme: {
            type: String as PropType<'light' | 'dark'>,
            required: true,
        },
        componentsMap: {
            type: Object as PropType<Record<string, Component>>,
        },
        codeBlockRenderer: {
            type: Object as PropType<Component>,
        },
        extraLangs: {
            type: Array as PropType<Langs[]>,
            default: () => [],
        },
        rehypePlugins: {
            type: Array as PropType<PluggableList>,
            default: () => [],
        },
        remarkPlugins: {
            type: Array as PropType<PluggableList>,
            default: () => [],
        },
        remarkRehypeOptions: {
            type: Object as PropType<RemarkRehypeOptions>,
            default: () => ({ allowDangerousHtml: true }),
        },
    },
    errorCaptured(e) {
        console.error('VueMarkdownRenderer captured error', e);
    },
    setup(props, { slots }) {
        provideProxyProps(props);

        // 在setup内部定义jsx函数以访问slots
        function jsx(type: any, props: Record<any, any>, key: any) {
            const { children } = props;
            delete props.children;
            if (arguments.length > 2) {
                props.key = key;
            }
            if (type === Fragment) {
                return h(type, props, children);
            } else if (typeof type !== 'string') {
                if (type === ShikiStreamCodeBlock) {
                    // 使用json字符串作为prop的目的是防止ShikiStreamCodeBlock组件不必要的re-render
                    const nodeJSON = JSON.stringify(props.node);
                    delete props.node;
                    return h(type, { ...props, nodeJSON });
                }
                if (type === ThinkBlock) {
                    // 为ThinkBlock组件添加插槽支持
                    return h(type, props, {
                        'think-block': (slotProps: any) => slots['think-block']?.(slotProps),
                        'think-header': (slotProps: any) => slots['think-header']?.(slotProps),
                        'think-content': (slotProps: any) => slots['think-content']?.(slotProps),
                    });
                }
                return h(type, props);
            }
            return h(type, props, children);
        }

        const computedProcessor = computed(() => {
            const { rehypePlugins, remarkPlugins, remarkRehypeOptions } = props;
            const processor = unified()
                .use(remarkParse)
                .use(remarkGfm)
                .use(remarkComponentCodeBlock)
                .use(remarkPlugins)
                .use(remarkRehype, remarkRehypeOptions)
                .use(rehypeRaw)
                .use(rehypePassGeneratedProp)
                .use(rehypePlugins);
            return processor;
        });

        const createFile = (md: string) => {
            const file = new VFile();
            file.value = md;
            return file;
        };

        const generateVueNode = (tree: any) => {
            const vueVnode = toJsxRuntime(tree, {
                components: {
                    ...segmentTextComponents,
                    ComponentCodeBlock,
                    pre: ShikiStreamCodeBlock,
                    think: ThinkBlock,
                    ...props.componentsMap,
                },
                Fragment,
                jsx: jsx,
                jsxs: jsx,
                passKeys: true,
                passNode: true,
            });
            return vueVnode;
        };

        const computedVNode = computed(() => {
            const processor = computedProcessor.value;
            const file = createFile(props.source);
            return generateVueNode(processor.runSync(processor.parse(file), file));
        });

        return () => {
            return h(
                ShikiProvider,
                null,
                h(SelectPopoverProvider, null, {
                    default: h('div', { class: 'vue-markdown-renderer' }, computedVNode.value),
                }),
            );
        };
    },
});
