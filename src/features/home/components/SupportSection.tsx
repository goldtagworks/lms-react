import React, { memo } from 'react';
import { Container, Card, Group, Title, Text } from '@mantine/core';
import { LinkButton } from '@main/components/LinkButton';

interface SupportSectionProps {
    title?: string;
    email?: string;
    phone?: string;
    hours?: string;
    faqHref?: string;
    contactHref?: string;
}

function SupportSectionBase({
    title = '도움이 필요하신가요?',
    email = 'help@example.com',
    phone = '02-0000-0000',
    hours = '평일 09:00–18:00',
    faqHref = '#faq',
    contactHref = '#contact'
}: SupportSectionProps) {
    return (
        <Container py="xl" size="lg">
            <Card withBorder radius="md">
                <Group align="center" justify="space-between">
                    <div>
                        <Title mb="sm" order={3}>
                            {title}
                        </Title>
                        <Text c="dimmed">
                            운영시간 {hours} · {email} · {phone}
                        </Text>
                    </div>
                    <Group gap="sm">
                        <LinkButton color="accent" href={faqHref} label="FAQ" size="md" variant="light" />
                        <LinkButton color="primary" href={contactHref} label="1:1 문의" size="md" />
                    </Group>
                </Group>
            </Card>
        </Container>
    );
}

export const SupportSection = memo(SupportSectionBase);
export default SupportSection;
