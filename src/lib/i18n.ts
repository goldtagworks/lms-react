// Namespace-based i18n loader (client-side) supporting dynamic locale switch and variable interpolation.
// Design goals:
// - Keep bundle lean via dynamic imports (one JSON per namespace per locale)
// - Provide minimal API (init, setLocale, t, hasKey, preloadNamespace, ensureNamespaces)
// - React integration via lightweight external store (useI18n)
// - Compatible key pattern: "namespace.key" (e.g. "auth.email")
// - Fallback order: requested locale → ko → key itself

import { useEffect, useSyncExternalStore } from 'react';

export type Locale = 'ko' | 'en';
export const DEFAULT_LOCALE: Locale = 'ko';
let currentLocale: Locale = DEFAULT_LOCALE;
let version = 0; // increments on locale or namespace load to trigger subscribers

// Loaded resources cache: locale -> namespace -> record
const resources: Record<Locale, Record<string, Record<string, string>>> = {
    ko: {},
    en: {}
};

// Known namespaces (mirrors src/locales/*/*.json). Update when adding a new file.
export const NAMESPACES = [
    'common',
    'nav',
    'auth',
    'consent',
    'action',
    'home',
    'course',
    'my',
    'player',
    'pay',
    'exam',
    'certificate',
    'errors',
    'a11y',
    'price',
    'filter',
    'sort',
    'review',
    'status',
    'reviewExtra',
    'qna',
    'wishlist',
    'terms',
    'instructor',
    'coupon',
    'category',
    'time',
    'notify',
    'lesson',
    'validation',
    'admin'
];

type LoadFn = () => Promise<Record<string, string>>;

// --- Event Emitter (minimal) -------------------------------------------------
type I18nEvent = 'localeChanged' | 'namespacesLoaded';
type Listener = () => void;
const listeners: Record<I18nEvent, Set<Listener>> = {
    localeChanged: new Set(),
    namespacesLoaded: new Set()
};

function emit(ev: I18nEvent) {
    if (ev === 'localeChanged' || ev === 'namespacesLoaded') version++;
    listeners[ev].forEach((l) => {
        try {
            l();
        } catch {
            // swallow
        }
    });
}

export function onLocaleChange(fn: Listener) {
    listeners.localeChanged.add(fn);

    return () => listeners.localeChanged.delete(fn);
}

export function onNamespacesLoaded(fn: Listener) {
    listeners.namespacesLoaded.add(fn);

    return () => listeners.namespacesLoaded.delete(fn);
}

// Dynamic import map generator
function nsImporter(locale: Locale, ns: string): LoadFn {
    return () => import(`../locales/${locale}/${ns}.json`) as Promise<any>;
}

async function loadNamespace(locale: Locale, ns: string) {
    if (resources[locale][ns]) return;
    try {
        const mod: any = await nsImporter(locale, ns)();
        const data: Record<string, string> = (mod && (mod.default || mod)) as Record<string, string>;

        resources[locale][ns] = data || {};
    } catch {
        // Silently ignore missing namespace (caller may fallback)
        resources[locale][ns] = {};
    }
}

export async function initI18n(initialLocale: Locale = DEFAULT_LOCALE, preloadAll = false) {
    currentLocale = initialLocale;
    if (preloadAll) {
        await Promise.all(NAMESPACES.map((ns) => loadNamespace(initialLocale, ns)));
    } else {
        // Minimal critical namespaces first
        await Promise.all(['common', 'nav', 'auth'].map((ns) => loadNamespace(initialLocale, ns)));
    }
}

export async function setLocale(locale: Locale, preload = true) {
    if (locale === currentLocale) return;
    currentLocale = locale;
    if (preload) {
        await Promise.all(NAMESPACES.map((ns) => loadNamespace(locale, ns)));
        emit('namespacesLoaded');
    }
    emit('localeChanged');
}

export async function preloadNamespace(ns: string) {
    await loadNamespace(currentLocale, ns);
    emit('namespacesLoaded');
}

export async function ensureNamespaces(list: string[]) {
    await Promise.all(list.map((ns) => loadNamespace(currentLocale, ns)));
    emit('namespacesLoaded');
}

function resolveKeyParts(fullKey: string): { ns: string; key: string } {
    const idx = fullKey.indexOf('.');

    if (idx === -1) return { ns: 'common', key: fullKey };

    return { ns: fullKey.slice(0, idx), key: fullKey.slice(idx + 1) };
}

export function hasKey(fullKey: string): boolean {
    const { ns, key } = resolveKeyParts(fullKey);
    const locRes = resources[currentLocale][ns];
    const koRes = resources.ko[ns];

    return !!(locRes && key in locRes) || !!(koRes && key in koRes);
}

export function t(fullKey: string, vars?: Record<string, string | number>, fallback?: string): string {
    const { ns, key } = resolveKeyParts(fullKey);
    const locRes = resources[currentLocale][ns];
    const koRes = resources.ko[ns];
    let base = (locRes && locRes[key]) || (koRes && koRes[key]) || fallback || fullKey;

    if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
            base = base.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
        });
    }

    return base;
}

// Convenience synchronous guard: ensure at least core namespaces are loaded.
(async () => {
    await initI18n();
})();

// --- React hook integration --------------------------------------------------
function subscribe(callback: () => void) {
    const off1 = onLocaleChange(callback);
    const off2 = onNamespacesLoaded(callback);

    return () => {
        off1();
        off2();
    };
}

function getSnapshot() {
    // include version to ensure namespace load triggers re-render even if locale unchanged
    return `${currentLocale}:${version}`;
}

export function useI18n() {
    useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    useEffect(() => {
        // placeholder for side-effects (e.g., persisting locale) – kept lightweight
    }, [currentLocale]);

    return { t, locale: currentLocale, setLocale, ensureNamespaces };
}
