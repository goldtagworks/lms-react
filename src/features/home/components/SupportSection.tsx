import React, { memo } from 'react';
import { Container, Card, Group, Title, Text } from '@mantine/core';
import { LinkButton } from '@main/components/LinkButton';
import { useI18n } from '@main/lib/i18n';

interface SupportSectionProps {
    title?: string;
    email?: string;
    phone?: string;
    hours?: string;
    faqHref?: string;
    contactHref?: string;
    bare?: boolean;
}

function SupportSectionBase({ title, email = 'help@example.com', phone = '02-0000-0000', hours, faqHref = '/faq', contactHref = '/support/new', bare }: SupportSectionProps) {
    const { t } = useI18n();
    const finalTitle = title || t('home.support.title');
    const finalHours = hours || t('home.support.hours');
    const content = (
        <Card withBorder p={{ base: 'lg', md: 'xl' }} radius="lg" shadow="md">
            <Group align="center" justify="space-between">
                <div>
                    <Title mb="sm" order={3}>
                        {finalTitle}
                    </Title>
                    <Text c="dimmed">{t('home.support.meta', { hours: finalHours, email, phone })}</Text>
                </div>
                <Group gap="sm">
                    <LinkButton color="accent" href={faqHref} label={t('home.support.faq')} size="md" variant="light" />
                    <LinkButton color="primary" href={contactHref} label={t('home.support.contact')} size="md" />
                </Group>
            </Group>
        </Card>
    );

    if (bare) return content;

    return (
        <Container py="xl" size="lg">
            {content}
        </Container>
    );
}

export const SupportSection = memo(SupportSectionBase);
export default SupportSection;
