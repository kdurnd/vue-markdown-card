import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
    plugins: [vue()],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'VueMdrCard',
            fileName: format => `vue-mdr-card.${format}.js`,
            formats: ['es', 'cjs'],
        },
        rollupOptions: {
            // 确保外部化处理那些你不想打包进库的依赖
            external: ['vue'],
            output: {
                // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
                globals: {
                    vue: 'Vue',
                },
                // 确保 CSS 被单独提取
                assetFileNames: assetInfo => {
                    if (assetInfo.name === 'style.css') return 'vue-mdr-card.css';
                    return assetInfo.name!;
                },
            },
        },
        outDir: 'dist',
        emptyOutDir: true,
        // 启用 CSS 代码分割
        cssCodeSplit: false,
    },
});
