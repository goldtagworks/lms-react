import { defineConfig, Plugin, PluginOption } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react-swc';
import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';

// https://vite.dev/config/
export default defineConfig(({}) => {
    return {
        base: '/',
        plugins: [mdx({ remarkPlugins: [remarkGfm] }), react(), tsconfigPaths()] as (Plugin | PluginOption)[],
        build: {
            emptyOutDir: true
        }
    };
});
