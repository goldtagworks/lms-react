import { Card, List, rem, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { CheckCircle2 } from 'lucide-react';
import { useI18n } from '@main/lib/i18n';

export interface PaymentHeroProps {
    variant: 'enroll' | 'pay' | 'success' | 'fail';
}

export function PaymentHero({ variant }: PaymentHeroProps) {
    const { t } = useI18n();

    const ns = `paymentHero.${variant}`;

    const items = [t(`${ns}.li1`), t(`${ns}.li2`), t(`${ns}.li3`)];

    return (
        <Card withBorder p={{ base: 'lg', md: 'xl' }} radius="lg" shadow="md">
            <Stack gap="lg">
                <div>
                    <Title fw={800} mb={rem(4)} order={2} size={28}>
                        {t(`${ns}.title`)}
                    </Title>
                    <Text c="dimmed" size="sm">
                        {t(`${ns}.subtitle`)}
                    </Text>
                </div>
                <List
                    center
                    icon={
                        <ThemeIcon color="primary" radius="xl" size={22} variant="light">
                            <CheckCircle2 size={14} />
                        </ThemeIcon>
                    }
                    size="sm"
                    spacing={6}
                >
                    {items.map((li, i) => (
                        <List.Item key={i}>{li}</List.Item>
                    ))}
                </List>
            </Stack>
        </Card>
    );
}

export default PaymentHero;
