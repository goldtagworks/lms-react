import { useState } from 'react';
import { Alert, Button, Card, Stack, Text, TextInput } from '@mantine/core';
import AuthLayout from '@main/components/auth/AuthLayout';
import AuthHero from '@main/components/auth/AuthHero';
import { useI18n } from '@main/lib/i18n';
import { supabase } from '@main/lib/supabase';

export default function PasswordResetRequestPage() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { t } = useI18n();

    async function submit() {
        if (loading) return;
        setError(null);
        setSent(false);

        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            setError(t('auth.reset.emailPrompt'));

            return;
        }

        // 간단한 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(trimmedEmail)) {
            setError(t('auth.reset.emailPrompt')); // 기존 키 재사용

            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
                redirectTo: `${window.location.origin}/password/reset/confirm`
            });

            if (error) throw error;
            setSent(true);
        } catch (e: any) {
            setError(e.message || t('errors.unknown'));
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout hero={<AuthHero variant="reset" />}>
            <Card withBorder component="section" p={{ base: 'lg', md: 'xl' }} radius="lg" shadow="md">
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
                            <Button disabled={loading} loading={loading} size="sm" onClick={submit}>
                                {t('auth.reset.submit')}
                            </Button>
                        </>
                    )}
                </Stack>
            </Card>
        </AuthLayout>
    );
}
