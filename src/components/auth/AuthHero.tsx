import { Card, List, rem, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { CheckCircle2 } from 'lucide-react';
import { useI18n } from '@main/lib/i18n';

interface AuthHeroProps {
    variant?: 'signin' | 'signup' | 'reset' | 'change';
}

export function AuthHero({ variant = 'signin' }: AuthHeroProps) {
    const isSignUp = variant === 'signup';
    const isReset = variant === 'reset';
    const isChange = variant === 'change';
    const { t } = useI18n();

    return (
        <Card withBorder p={{ base: 'lg', md: 'xl' }} radius="lg" shadow="md">
            <Stack gap="lg">
                <div>
                    <Title fw={800} mb={rem(4)} order={2} size={28}>
                        KSI LMS
                    </Title>
                    <Text c="dimmed" size="sm">
                        {isSignUp && t('auth.hero.signUp')}
                        {!isSignUp && !isReset && !isChange && t('auth.hero.signIn')}
                        {isReset && t('auth.hero.reset')}
                        {isChange && t('auth.hero.change')}
                    </Text>
                </div>
                {!isReset && !isChange && (
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
                        <List.Item>{t('auth.list.signin.1')}</List.Item>
                        <List.Item>{t('auth.list.signin.2')}</List.Item>
                        <List.Item>{t('auth.list.signin.3')}</List.Item>
                    </List>
                )}
                {isReset && (
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
                        <List.Item>{t('auth.list.reset.1')}</List.Item>
                        <List.Item>{t('auth.list.reset.2')}</List.Item>
                        <List.Item>{t('auth.list.reset.3')}</List.Item>
                    </List>
                )}
                {isChange && (
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
                        <List.Item>{t('auth.list.change.1')}</List.Item>
                        <List.Item>{t('auth.list.change.2')}</List.Item>
                        <List.Item>{t('auth.list.change.3')}</List.Item>
                    </List>
                )}
            </Stack>
        </Card>
    );
}

export default AuthHero;
