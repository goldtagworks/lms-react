import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface MDXModule {
    default: React.ComponentType<any>;
    frontmatter?: {
        order?: number;
        slug?: string;
        question?: string;
    };
}

interface FaqEntry {
    slug: string;
    order: number;
    question: string;
    Component: React.ComponentType<any>;
}

// locale 분기 (현재 ko만, 다국어 확장 시 디렉터리 분기 예정)
const mdxModules = import.meta.glob('../faq/ko/*.mdx');

export default function FAQPage() {
    const { t, i18n } = useTranslation();
    const [entries, setEntries] = useState<FaqEntry[]>([]);
    const locale = i18n.language.split('-')[0]; // 'ko-KR' -> 'ko'

    useEffect(() => {
        let cancelled = false;

        async function load() {
            const loaded: FaqEntry[] = [];

            for (const [path, loader] of Object.entries(mdxModules)) {
                // 간단한 locale 필터 (현재 ko만 존재)
                if (!path.includes(`/${locale}/`)) continue;
                const mod = (await loader()) as MDXModule;
                const fm = mod.frontmatter || {};

                loaded.push({
                    slug:
                        fm.slug ||
                        path
                            .split('/')
                            .pop()!
                            .replace(/\.mdx?$/, ''),
                    order: fm.order ?? 999,
                    question: fm.question || fm.slug || '—',
                    Component: mod.default
                });
            }
            loaded.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
            if (!cancelled) setEntries(loaded);
        }
        load();

        return () => {
            cancelled = true;
        };
    }, [locale]);

    const content = useMemo(() => entries, [entries]);

    return (
        <div>
            <h1>{t('faq.title')}</h1>
            <p>{t('faq.subtitle')}</p>
            <dl>
                {content.map((item) => {
                    const C = item.Component;

                    return (
                        <div key={item.slug} style={{ marginBottom: '1.5rem' }}>
                            <dt style={{ fontWeight: 600 }}>{item.question}</dt>
                            <dd>
                                <C />
                            </dd>
                        </div>
                    );
                })}
            </dl>
        </div>
    );
}
