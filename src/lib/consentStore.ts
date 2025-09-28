// 간단한 localStorage 기반 마케팅 동의 저장/조회 (추후 서버 동기화 가능)
// 키 네이밍: lms_consent_marketing_v1

const KEY = 'lms_consent_marketing_v1';

export function loadMarketingConsent(): boolean | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(KEY);

        if (raw === null) return null;

        return raw === '1';
    } catch {
        return null;
    }
}

export function saveMarketingConsent(v: boolean) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(KEY, v ? '1' : '0');
    } catch {
        // no-op
    }
}
