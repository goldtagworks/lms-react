// -------------------------------------------------------------
// File: src/lib/supabase/client.ts
// -------------------------------------------------------------
import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!URL || !ANON_KEY) {
    throw new Error('Missing Supabase environment variables');
}

// 기존 로직 유지 (oauthLogin/keepLoggedIn) → 인증 클라이언트에서만 사용
const oauthLogin = localStorage.getItem('oauth_login') === 'true';
const keepLoggedIn = localStorage.getItem('auth_pref_keep_logged_in') === 'true';

// 인증 필요(로그인, 대시보드 등) 용 클라이언트
export const supabase: SupabaseClient = createClient(URL, ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'sb-lms-dev',
        storage: oauthLogin ? localStorage : keepLoggedIn ? localStorage : sessionStorage,
        flowType: 'pkce'
    },
    global: { headers: { 'x-app-name': '', 'x-site': '' } }
});

// 공개 조회 전용(항상 anon, 세션 저장 X)
export const supabasePublic: SupabaseClient = createClient(URL, ANON_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
        storageKey: 'sb-lms-public',
        flowType: 'pkce'
    },
    global: {
        headers: { 'x-app-name': '', 'x-site': '' },
        fetch: async (input, init) => {
            const req = input instanceof Request ? input : new Request(input, init);
            const headers = new Headers(req.headers);
            const auth = headers.get('Authorization');
            // anon 키를 Authorization 으로 보낼 때 401 (JWSInvalidSignature) 발생하는 환경 우회

            if (auth === `Bearer ${ANON_KEY}`) {
                headers.delete('Authorization');
            }
            const patched = new Request(req, { headers });
            const res = await fetch(patched);

            if (import.meta.env.DEV && res.status === 401) {
                // eslint-disable-next-line no-console
                console.debug('[supabasePublic][fetch][401] strippedAuth=', auth === `Bearer ${ANON_KEY}`);
            }

            return res;
        }
    }
});

export type { Session };
