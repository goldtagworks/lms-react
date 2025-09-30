// FAQPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { Accordion } from '@mantine/core';
import PageContainer from '@main/components/layout/PageContainer';
import { useI18n } from '@main/lib/i18n';
import { loadFaqEntries, FaqEntry } from '@main/faq/loader';
import { MDXProvider } from '@mdx-js/react';

// 메타 텍스트(h1/h2) 차단 컴포넌트
function MetaGuardHeading(props: React.HTMLAttributes<HTMLHeadingElement>) {
    const { children, ...rest } = props;
    const text = (Array.isArray(children) ? children : [children])
        .map((c) => (typeof c === 'string' ? c : ''))
        .join('')
        .trim();

    // 'order:', 'slug:', 'question:' 같은 메타 패턴이면 렌더하지 않음
    if (/(^|\s)(order|slug|question)\s*:/i.test(text) || /^order\s*:\s*\d+/i.test(text)) {
        return null;
    }

    // 정상 헤딩은 h3로 내린다(접근성 중복 방지)
    return <h3 {...rest}>{children}</h3>;
}

export default function FAQPage() {
    const { t, locale } = useI18n();
    const [all, setAll] = useState<FaqEntry[]>([]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const list = await loadFaqEntries(locale, 'ko');

            if (!cancelled) setAll(list);
        })();

        return () => {
            cancelled = true;
        };
    }, [locale]);

    const items = useMemo(() => all, [all]);

    return (
        <PageContainer roleMain py={48} size="sm">
            <h1>{t('faq.title')}</h1>
            <p>{t('faq.subtitle')}</p>

            <Accordion multiple>
                {items.map((it) => {
                    const label = t(`faq.items.${it.slug}.question`, undefined, it.slug);
                    const C = it.Component;

                    return (
                        <Accordion.Item key={it.slug} value={it.slug}>
                            <Accordion.Control id={`faq-q-${it.slug}`}>{label}</Accordion.Control>

                            <Accordion.Panel aria-labelledby={`faq-q-${it.slug}`}>
                                {/* ⬇️ MDX 내부의 h1/h2를 가로채어 메타 헤딩이면 제거 */}
                                <MDXProvider components={{ h1: MetaGuardHeading, h2: MetaGuardHeading }}>
                                    <C faqMeta={{ slug: it.slug, order: it.order, tags: it.tags, updatedAt: it.updatedAt, question: label }} />
                                </MDXProvider>
                            </Accordion.Panel>
                        </Accordion.Item>
                    );
                })}
            </Accordion>
        </PageContainer>
    );
}
