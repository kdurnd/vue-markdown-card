import { visit } from 'unist-util-visit';

/**
 * rehype 插件：把节点的 node.generated 转成 props.generated
 */
export function rehypePassGeneratedProp() {
    return (tree, file) => {
        const src = file.value;
        visit(tree, 'element', node => {
            // 处理 think 元素
            if (node.tagName === 'think') {
                const { start, end } = node.position;
                const slice = src.slice(start.offset, end.offset);
                node.properties = node.properties || {};
                node.properties.generated = slice.includes('</think>') ? false : true;
                return;
            }

            // 处理 pre 元素
            if (node.tagName === 'pre') {
                const { start, end } = node.position;
                const slice = src.slice(start.offset, end.offset);
                node.properties = node.properties || {};
                // 对于代码块，检查是否包含结束标签来判断是否完整生成
                node.properties.generated =
                    slice.includes('```') && slice.lastIndexOf('```') > slice.indexOf('```') ? false : true;
                return;
            }
        });
    };
}
