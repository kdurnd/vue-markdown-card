import { computed, defineComponent, h, PropType, VNode, VueElement } from 'vue';
import { ElementNode, TextNode } from './segmentText';
import { useProxyProps } from './useProxyProps';

export const ThinkBlock = defineComponent({
    name: 'think-wrapper',
    props: {
        node: {
            type: Object as PropType<ElementNode>,
            required: true,
        },
        generated: {
            type: Boolean,
            default: false,
        },
    },
    setup(props) {
        const proxyProps = useProxyProps();
        const thinkBlockRenderer = computed(() => {
            return proxyProps.thinkBlockRenderer || ThinkBlock;
        });

        function renderHtmlAstNode(node: any): any {
            if (node.type === 'text') {
                return node.value;
            }
            if (node.type === 'element') {
                const children = node.children?.map(renderHtmlAstNode) || [];
                return h(node.tagName, node.properties || {}, children);
            }
            // 其它类型你可以根据需求扩展
            return null;
        }

        return () => {
            const thinkContentVNode = renderHtmlAstNode(props.node);

            if (thinkBlockRenderer.value) {
                return h(thinkBlockRenderer.value, {
                    isThinking: props.generated,
                    thinkContentVNode: thinkContentVNode,
                });
            }
            return thinkContentVNode;
        };
    },
});
