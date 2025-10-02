import { useState } from 'react';
import { Alert, Button, Card, Stack, Text, TextInput } from '@mantine/core';
import AuthLayout from '@main/components/auth/AuthLayout';
import AuthHero from '@main/components/auth/AuthHero';
import { useI18n } from '@main/lib/i18n';

// NOTE: 서버 연동 전까지 임시 처리
export default function PasswordResetRequestPage() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { t } = useI18n();

    function submit() {
        setError(null);
        if (!email.trim()) {
            setError(t('auth.reset.emailPrompt'));

            return;
        }
        setSent(true);
    }

    return (
        <AuthLayout hero={<AuthHero variant="reset" />}>
            <Card withBorder component="section" p="xl" radius="lg" shadow="md">
                <Stack gap="md">
                    <div>
                        <Text fw={600} size="lg">
                            {t('auth.resetTitle')}
                        </Text>
                        <Text c="dimmed" mt={4} size="sm">
                            {t('auth.resetSubtitle')}
                        </Text>
                    </div>
                    {sent ? (
                        <Alert color="teal" title={t('auth.reset.sent.title')}>
                            {t('auth.reset.sent.desc')}
                        </Alert>
                    ) : (
                        <>
                            <TextInput
                                autoComplete="email"
                                label={t('auth.email')}
                                placeholder={t('auth.reset.emailPlaceholder')}
                                size="sm"
                                value={email}
                                onChange={(e) => setEmail(e.currentTarget.value)}
                            />
                            {error && (
                                <Text c="red" size="sm">
                                    {error}
                                </Text>
                            )}
                            <Button size="sm" onClick={submit}>
                                {t('auth.reset.submit')}
                            </Button>
                        </>
                    )}
                </Stack>
            </Card>
        </AuthLayout>
    );
}
