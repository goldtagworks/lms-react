// Namespace-based i18n loader (client-side) supporting dynamic locale switch and variable interpolation.
// Design goals:
// - Keep bundle lean via dynamic imports (one JSON per namespace per locale)
// - Provide minimal API (init, setLocale, t, hasKey, preloadNamespace, ensureNamespaces)
// - React integration via lightweight external store (useI18n)
// - Compatible key pattern: "namespace.key" (e.g. "auth.email")
// - Fallback order: requested locale → ko → key itself

import type { I18nKey } from '@main/types/i18n-keys';

import { useEffect, useSyncExternalStore, useState } from 'react';

import koUiStatic from '../locales/ko/ui.json';

export type Locale = 'ko' | 'en';
export const DEFAULT_LOCALE: Locale = 'ko';
let currentLocale: Locale = DEFAULT_LOCALE;
let version = 0; // increments on locale or namespace load to trigger subscribers
let ready = false; // 최초 필수 namespace 로드 여부

// Loaded resources cache: locale -> namespace -> record
const resources: Record<Locale, Record<string, Record<string, string>>> = {
    ko: {},
    en: {}
};

// Known namespaces (mirrors src/locales/*/*.json). Update when adding a new file.
// 단일 파일 통합 전략: locales/<locale>/ui.json 하나에 모든 키(flat) 포함
// 기존 namespace.key 형태 사용은 유지하되 실제 파일은 ui.json 하나만 존재.
// t() 함수에서 각 namespace 조회 실패 시 ui namespace(단일 파일)에서 fullKey 매칭을 재시도한다.
export const NAMESPACES = ['ui'];

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

function flattenRaw(raw: any): Record<string, string> {
    const out: Record<string, string> = {};
    const stack: Array<{ obj: any; prefix: string }> = [{ obj: raw, prefix: '' }];

    while (stack.length) {
        const { obj, prefix } = stack.pop()!;

        if (obj && typeof obj === 'object') {
            for (const [k, v] of Object.entries(obj)) {
                if (k === '__meta') continue;
                const nextPrefix = prefix ? `${prefix}.${k}` : k;

                if (v && typeof v === 'object') {
                    stack.push({ obj: v, prefix: nextPrefix });
                } else if (typeof v === 'string') {
                    out[nextPrefix] = v;
                }
            }
        }
    }

    return out;
}

async function loadNamespace(locale: Locale, ns: string) {
    if (resources[locale][ns]) return;
    try {
        const mod: any = await nsImporter(locale, ns)();
        const raw: any = mod && (mod.default || mod);

        resources[locale][ns] = flattenRaw(raw);
    } catch {
        resources[locale][ns] = {};
    }
}

export async function initI18n(initialLocale: Locale = DEFAULT_LOCALE) {
    currentLocale = initialLocale;
    await Promise.all(NAMESPACES.map((ns) => loadNamespace(initialLocale, ns)));
    ready = true;
    emit('namespacesLoaded');
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

// Cache for missing key warnings to avoid console spam
const missingWarned = new Set<string>();

// Overload for typed keys (generated). Fallback to string for dynamic cases.
export function t(fullKey: I18nKey, vars?: Record<string, string | number>, fallback?: string): string;
export function t(fullKey: string, vars?: Record<string, string | number>, fallback?: string): string {
    const { ns, key } = resolveKeyParts(fullKey);
    let locRes = resources[currentLocale][ns];
    let koRes = resources.ko[ns];
    let raw: string | undefined;

    if (locRes) raw = locRes[key];
    if (!raw && koRes) raw = koRes[key];

    // namespace 미존재 또는 키 미스 → 단일 ui namespace(flat)에서 fullKey 재탐색
    if (!raw) {
        const uiLoc = resources[currentLocale]['ui'];
        const uiKo = resources.ko['ui'];

        raw = (uiLoc && uiLoc[fullKey]) || (uiKo && uiKo[fullKey]);
    }

    let base = raw || fallback || fullKey;

    if (!raw && !fallback && process.env.NODE_ENV !== 'production') {
        if (!missingWarned.has(fullKey)) {
            // eslint-disable-next-line no-console
            console.warn(`[i18n] Missing key: ${fullKey}`);
            missingWarned.add(fullKey);
        }
    }

    if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
            base = base.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
        });
    }

    return base;
}

// --- Synchronous bootstrap (default ko locale) ------------------------------
if (!resources.ko['ui']) {
    resources.ko['ui'] = flattenRaw((koUiStatic as any).default || koUiStatic);
}

// 비동기 초기화 (기본 ko는 이미 채워짐)
initI18n().catch(() => {});

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
    const [isReady, setIsReady] = useState(ready);

    useEffect(() => {
        if (!isReady && ready) setIsReady(true);
    }, [isReady]);
    useEffect(() => {
        // placeholder for side-effects (e.g., persisting locale)
    }, [currentLocale]);

    return { t, locale: currentLocale, setLocale, ensureNamespaces, ready: isReady };
}
