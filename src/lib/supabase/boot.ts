// supabase boot helper: 환경(URL) 변경 시 이전 세션 토큰 제거
// 이유: 다른 스택(access_token) 서명 불일치로 JWSInvalidSignature 발생 방지

const BASE_KEY = 'sb-base-url-v1';
const SESSION_KEY = 'sb-lms-dev'; // supabase.ts 의 storageKey 와 동일해야 함

try {
    const curr = (import.meta as any).env.VITE_SUPABASE_URL as string | undefined;

    if (curr) {
        const prev = localStorage.getItem(BASE_KEY);

        if (prev && prev !== curr) {
            // 환경이 바뀌었으므로 이전 세션 제거
            localStorage.removeItem(SESSION_KEY);
            // (필요시 refresh token 등 추가 키 제거 가능)
        }

        localStorage.setItem(BASE_KEY, curr);
    }
} catch {
    // SSR 또는 storage 접근 불가 환경 무시
}
