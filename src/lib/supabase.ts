// Supabase client 초기화 (단일 인스턴스)
// 주: 실제 프로젝트에서는 env 안전성/SSR 고려 필요. 여기서는 클라이언트 사이드 최소 설정.
// NOTE: 임시: Database 제네릭 적용으로 insert/update 가 never 로 추론되는 문제 회피 위해 generic 제거.
// 추후 타입 안정화 시 다시 createClient<Database>() 형태로 복원 예정.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// NOTE: Vite는 정적 프로퍼티 접근(import.meta.env.VITE_X)만 빌드 타임 치환.
// 동적 열거/구조분해는 빌드 후 undefined 가능 → 단순/직접 접근으로 교체.

declare global {
    interface Window {
        __SUPABASE_URL__?: string;
        __SUPABASE_ANON_KEY__?: string;
    }
}

function readMeta(name: string): string | undefined {
    if (typeof document === 'undefined') return undefined;
    const el = document.querySelector(`meta[name="${name}"]`);

    return el?.getAttribute('content') || undefined;
}

// 1차: Vite 정적 치환 (dev & build 모두 동작)
let SUPABASE_URL: string | undefined = (import.meta as any).env?.VITE_SUPABASE_URL;
let SUPABASE_ANON_KEY: string | undefined = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

// 2차: window 전역 (임시 런타임 주입 대응)
if (!SUPABASE_URL && typeof window !== 'undefined') SUPABASE_URL = window.__SUPABASE_URL__;
if (!SUPABASE_ANON_KEY && typeof window !== 'undefined') SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__;

// 3차: <meta name="supabase-url" content="..."> 형태 지원
if (!SUPABASE_URL) SUPABASE_URL = readMeta('supabase-url');
if (!SUPABASE_ANON_KEY) SUPABASE_ANON_KEY = readMeta('supabase-anon-key');

// 4차: Node(process.env) fallback (SSR / edge) - Vite 빌드 외 실행 대비
if (!SUPABASE_URL && typeof process !== 'undefined') SUPABASE_URL = process.env?.VITE_SUPABASE_URL;
if (!SUPABASE_ANON_KEY && typeof process !== 'undefined') SUPABASE_ANON_KEY = process.env?.VITE_SUPABASE_ANON_KEY;

// 전역 캐시 객체 타입 선언 (HMR 시 중복 생성 방지)
interface SupabaseGlobal {
    __SB_CLIENT__?: SupabaseClient<any>;
}
const sg = globalThis as unknown as SupabaseGlobal;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const missing = [!SUPABASE_URL && 'VITE_SUPABASE_URL', !SUPABASE_ANON_KEY && 'VITE_SUPABASE_ANON_KEY'].filter(Boolean).join(', ');

    // 환경 진단 도움 로그
    // eslint-disable-next-line no-console
    console.error('[supabase:env-missing]', {
        SUPABASE_URL,
        SUPABASE_ANON_KEY_PRESENT: !!SUPABASE_ANON_KEY,
        importMetaPresent: !!(import.meta as any).env,
        windowKeys: typeof window !== 'undefined' ? Object.keys(window).filter((k) => k.includes('SUPABASE')) : []
    });

    throw new Error(
        `[supabase] Missing required env variable(s): ${missing}.\n` +
            '확인 절차:\n' +
            '1) 루트 .env(.local)에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 정의\n' +
            '2) dev 서버 완전 재시작 (캐시/탭 폐쇄)\n' +
            '3) import.meta.env.VITE_SUPABASE_URL 브라우저 콘솔 확인\n' +
            '4) 빌드 산출물(dist) 직접 실행 중이면 Vite dev 로 재확인\n' +
            '5) 필요 시 index.html <meta name="supabase-url" content="..."> 주입 테스트'
    );
}

export const supabase: SupabaseClient<any> = sg.__SB_CLIENT__ ?? (sg.__SB_CLIENT__ = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true } }));

export type SupabaseClientType = typeof supabase;

// Typed helper to constrain table names (improves intellisense vs raw string)
export const table = (name: string) => supabase.from(name);

// Strongly typed from helper returning narrowed PostgrestQueryBuilder generics
