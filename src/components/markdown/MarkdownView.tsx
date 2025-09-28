import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box, Text } from '@mantine/core';

interface MarkdownViewProps {
    source?: string | null;
    className?: string;
    compact?: boolean;
    clampLines?: number; // 프리뷰 용 line clamp
}

// 간단 sanitize: react-markdown 기본 escape + disallowedElements (script 등) 제거
// 추가 보안이 필요하면 rehype-sanitize 도입 (현재 입력은 내부 작성자 한정 가정)
const disallowed: string[] = ['script', 'iframe', 'style'];

export default function MarkdownView({ source, className, compact, clampLines }: MarkdownViewProps) {
    const content = (source || '').trim();
    const isEmpty = content.length === 0;

    const components = useMemo(
        () => ({
            h1: (props: any) => <Text component="h1" fw={700} fz={24} mb={8} mt={compact ? 12 : 24} {...props} />,
            h2: (props: any) => <Text component="h2" fw={600} fz={20} mb={6} mt={compact ? 10 : 20} {...props} />,
            h3: (props: any) => <Text component="h3" fw={600} fz={17} mb={4} mt={compact ? 8 : 16} {...props} />,
            p: (props: any) => <Text component="p" fz={14} lh={1.6} mb={8} {...props} />,
            li: (props: any) => <li style={{ marginBottom: 4 }}>{props.children}</li>,
            code: (props: any) => (
                <code
                    style={{
                        background: 'var(--mantine-color-gray-1)',
                        padding: '2px 4px',
                        borderRadius: 4,
                        fontSize: 13
                    }}
                    {...props}
                />
            ),
            pre: (props: any) => (
                <pre
                    style={{
                        background: 'var(--mantine-color-dark-6)',
                        color: 'var(--mantine-color-white)',
                        padding: '12px 14px',
                        borderRadius: 8,
                        overflowX: 'auto',
                        fontSize: 13,
                        lineHeight: 1.5,
                        margin: compact ? '12px 0' : '20px 0'
                    }}
                    {...props}
                />
            ),
            a: (props: any) => (
                <a rel="noopener noreferrer" style={{ color: 'var(--mantine-color-blue-6)' }} target="_blank" {...props}>
                    {props.children ? props.children : <span aria-label="링크">링크</span>}
                </a>
            )
        }),
        [compact]
    );

    if (isEmpty) {
        return (
            <Text c="dimmed" fz={compact ? 'xs' : 'sm'}>
                내용이 없습니다.
            </Text>
        );
    }

    return (
        <Box
            className={className}
            style={{
                lineHeight: 1.55,
                fontSize: 14,
                wordBreak: 'break-word',
                display: '-webkit-box',
                WebkitLineClamp: clampLines ? clampLines : 'unset',
                WebkitBoxOrient: clampLines ? ('vertical' as any) : 'unset',
                overflow: clampLines ? 'hidden' : undefined
            }}
        >
            <ReactMarkdown skipHtml disallowedElements={disallowed} remarkPlugins={[remarkGfm]}>
                {content}
            </ReactMarkdown>
        </Box>
    );
}
