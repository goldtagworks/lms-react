import React, { memo } from 'react';
import { Container, Title, Text } from '@mantine/core';
import { AppButton } from '@main/components/AppButton';

interface GuideSectionProps {
    title?: string;
    items?: { label: string; href?: string }[];
    bare?: boolean; // true면 외부에서 PageSection/Container 래핑
}

const defaultItems: { label: string; href?: string }[] = [
    { label: '학습자 가이드 PDF', href: '#' },
    { label: '자료실 바로가기', href: '#' },
    { label: '파일 뷰어 다운로드', href: '#' }
];

function GuideSectionBase({ title = '수강생 이용 가이드', items = defaultItems, bare }: GuideSectionProps) {
    const content = (
        <>
            <Title mb="md" order={2} size="xl">
                {title}
            </Title>
            <Text c="dimmed" mb="md">
                수강 절차, 자료 다운로드, 뷰어 설치 안내를 확인하세요.
            </Text>
            <ul style={{ paddingLeft: 18, color: '#6B7280', margin: 0 }}>
                {items.map((item) => (
                    <li key={item.label}>
                        <AppButton bg="none" h="auto" label={item.label} p={0} variant="subtle" />
                    </li>
                ))}
            </ul>
        </>
    );

    if (bare) return content;

    return (
        <Container py="xl" size="lg">
            {content}
        </Container>
    );
}

export const GuideSection = memo(GuideSectionBase);
export default GuideSection;
