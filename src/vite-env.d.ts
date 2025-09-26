/// <reference types="vite/client" />

declare module '*.mdx' {
    import { ComponentType } from 'react';
    const MDXComponent: ComponentType<any>;
    export default MDXComponent;
}

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
    readonly VITE_APP_NAME?: string;
    readonly VITE_SITE?: 'admin' | 'teacher' | 'student';
    // 다른 환경변수도 여기에 추가 가능
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
