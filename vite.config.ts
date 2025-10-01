import { defineConfig, Plugin, PluginOption } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';

// https://vite.dev/config/
export default defineConfig(({}) => {
    return {
        base: '/',
        plugins: [mdx({ remarkPlugins: [remarkGfm] }), react(), tsconfigPaths()] as (Plugin | PluginOption)[],
        build: {
            emptyOutDir: true,
            rollupOptions: {
                output: {
                    manualChunks: {
                        'chunk-react': ['react', 'react-dom', 'react-router-dom'],
                        'chunk-mantine': ['@mantine/core', '@mantine/hooks', '@mantine/form', '@mantine/dates', '@mantine/notifications', '@mantine/modals'],
                        'chunk-i18n': ['i18next', 'react-i18next'],
                        'chunk-supabase': ['@supabase/supabase-js'],
                        'chunk-dayjs': ['dayjs'],
                        'chunk-icons': ['lucide-react']
                    }
                }
            }
        }
    };
});
