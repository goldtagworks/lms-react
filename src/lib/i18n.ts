// Minimal i18n utility (stub) until full library integration.
// Loads copy catalog JSON and provides a simple t(key, locale='ko') function.
// NOTE: This is a lightweight client-only approach; replace with react-i18next later if needed.

import catalog from '../../docs/000. AI 학습데이터/051_copy_catalog.json';

export type Locale = 'ko' | 'en';

// Catalog shape: { [key: string]: { ko: string; en: string } }
const flat: Record<string, { ko: string; en?: string }> = catalog as any;

let currentLocale: Locale = 'ko';

export function setLocale(locale: Locale) {
    currentLocale = locale;
}

export function t(key: string, vars?: Record<string, string | number>, fallback?: string): string {
    const entry = flat[key];
    let base = (entry && (entry as any)[currentLocale]) || (entry && (entry as any).ko) || fallback || key;

    if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
            base = base.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
        });
    }

    return base;
}

export function hasKey(key: string) {
    return !!flat[key];
}
