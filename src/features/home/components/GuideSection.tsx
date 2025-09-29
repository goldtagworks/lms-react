import React, { memo } from 'react';
import { Container, Title, Text } from '@mantine/core';
import { AppButton } from '@main/components/AppButton';
import { useI18n } from '@main/lib/i18n';

interface GuideSectionProps {
    title?: string;
    items?: { label: string; href?: string }[];
    bare?: boolean; // true면 외부에서 PageSection/Container 래핑
}

const defaultItems: { label: string; href?: string }[] = [
    { label: 'home.guide.item.guidePdf', href: '#' },
    { label: 'home.guide.item.resources', href: '#' },
    { label: 'home.guide.item.viewer', href: '#' }
];

function GuideSectionBase({ title, items = defaultItems, bare }: GuideSectionProps) {
    const { t } = useI18n();
    const content = (
        <>
            <Title mb="md" order={2} size="xl">
                {title || t('home.guide.title')}
            </Title>
            <Text c="dimmed" mb="md">
                {t('home.guide.intro')}
            </Text>
            <ul style={{ paddingLeft: 18, color: '#6B7280', margin: 0 }}>
                {items.map((item) => (
                    <li key={item.label}>
                        <AppButton bg="none" h="auto" label={t(item.label)} p={0} variant="subtle" />
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
