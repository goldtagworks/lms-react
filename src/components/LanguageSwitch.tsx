import React, { useCallback, useEffect, useState } from 'react';
import { SegmentedControl } from '@mantine/core';
import { Locale, setLocale, useI18n, ensureNamespaces } from '@main/lib/i18n';

const STORAGE_KEY = 'app.locale';
const OPTIONS: { label: string; value: Locale }[] = [
    { label: '한국어', value: 'ko' },
    { label: 'EN', value: 'en' }
];

export function LanguageSwitch({ size = 'xs' }: { size?: 'xs' | 'sm' | 'md' }) {
    const { locale } = useI18n();
    const [value, setValue] = useState<Locale>(locale);

    useEffect(() => {
        const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;

        if (stored && stored !== locale) {
            // preload minimal namespaces for smoother swap
            ensureNamespaces(['common', 'nav']).then(() => setLocale(stored));
        }
    }, []); // intentional one-time init

    useEffect(() => {
        setValue(locale);
    }, [locale]);

    const onChange = useCallback(
        (val: string) => {
            const next = val as Locale;

            if (next === locale) return;

            window.localStorage.setItem(STORAGE_KEY, next);
            // preload core namespaces before switching to reduce flash of keys
            ensureNamespaces(['common', 'nav', 'auth']).then(() => setLocale(next));
        },
        [locale]
    );

    return <SegmentedControl aria-label="Language switch" data={OPTIONS.map((o) => ({ label: o.label, value: o.value }))} size={size} value={value} onChange={onChange} />;
}

export default LanguageSwitch;
