import { useEffect, useMemo, useState } from 'react';
import PageContainer from '@main/components/layout/PageContainer';
import { useI18n } from '@main/lib/i18n';

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
    const { t, locale } = useI18n();
    const [entries, setEntries] = useState<FaqEntry[]>([]);
    // i18n 초기화 지연 시 language가 undefined일 수 있으므로 방어
    // locale already normalized in useI18n

    useEffect(() => {
        let cancelled = false;

        async function load() {
            const loaded: FaqEntry[] = [];

            for (const [path, loader] of Object.entries(mdxModules)) {
                // 간단한 locale 필터 (현재 ko만 존재)
                if (!path.includes(`/${locale}/`)) continue;
                const mod = (await loader()) as MDXModule;
                const fm = mod.frontmatter || {};
                const derivedSlug =
                    fm.slug ||
                    path
                        .split('/')
                        .pop()!
                        .replace(/\.mdx?$/, '');
                // i18n key 우선: faq.items.<slug>.question → 없으면 fm.question → slug
                const question = fm.question || t(`faq.items.${derivedSlug}.question`, undefined, derivedSlug);

                loaded.push({
                    slug: derivedSlug,
                    order: fm.order ?? 999,
                    question,
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
        <PageContainer roleMain py={48} size="sm">
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
        </PageContainer>
    );
}
