import { visit } from 'unist-util-visit';

export function rehypePreviewImg() {
    return (tree) => {
        visit(tree, 'element', node => {
            if (node.tagName !== 'img') return;
            node.properties = node.properties || {};
            node.properties.preview = true;
        });
    };
}
