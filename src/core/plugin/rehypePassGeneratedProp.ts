import { visit } from 'unist-util-visit';

/**
 * rehype 插件：把节点的 node.generated 转成 props.generated
 */
export function rehypePassGeneratedProp() {
  return (tree, file) => {
    const src = file.value;
    visit(tree, 'element', (node) => {
        if (node.tagName !== 'think') return;
        const { start, end } = node.position;
        const slice = src.slice(start.offset, end.offset);
        node.properties = node.properties || {};
        node.properties.generated = slice.includes('</think>') ? false : true;
    });
  };
}
