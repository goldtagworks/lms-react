import { Box, Text } from '@mantine/core';
import { useI18n } from '@main/lib/i18n';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface MarkdownViewerProps {
    source?: string;
    emptyFallback?: React.ReactNode;
    maxHeight?: number;
}

/**
 * 간단한 Markdown 렌더러 (HTML 비허용 기본값 - react-markdown 기본 동작)
 * - GFM 지원 (테이블/체크박스 등)
 * - Mantine Typography와 기본 spacing 조정
 */
export default function MarkdownViewer({ source, emptyFallback, maxHeight }: MarkdownViewerProps) {
    const { t } = useI18n();
    const fallback = emptyFallback || (
        <Text c="dimmed" size="sm">
            {t('course.intro.missing')}
        </Text>
    );

    if (!source || !source.trim()) return <>{fallback}</>;

    return (
        <Box style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}>
            <ReactMarkdown
                components={{
                    a: (p) => (
                        <a {...p} rel="noopener noreferrer" style={{ color: '#1c7ed6' }} target="_blank">
                            {p.children}
                        </a>
                    ),
                    code: (p) => <code {...p} style={{ background: '#f5f5f5', borderRadius: 4, fontSize: 12, padding: '2px 4px' }} />,
                    h1: (p) => <Text {...p} fw={700} fz={24} mb={6} />,
                    h2: (p) => <Text {...p} fw={600} fz={20} mb={4} mt={16} />,
                    h3: (p) => <Text {...p} fw={600} fz={18} mb={4} mt={14} />,
                    li: (p) => <li {...p} style={{ marginBottom: 4, marginLeft: 20 }} />,
                    p: (p) => <Text {...p} fz={14} mb={8} style={{ lineHeight: 1.5 }} />,
                    pre: (p) => <pre {...p} style={{ background: '#f5f5f5', borderRadius: 6, fontSize: 12, overflowX: 'auto', padding: 12 }} />
                }}
                remarkPlugins={[remarkGfm]}
            >
                {source}
            </ReactMarkdown>
        </Box>
    );
}
