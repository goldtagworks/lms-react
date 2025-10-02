import { useState, useEffect } from 'react';
import { Alert, Button, Card, PasswordInput, Stack, Text } from '@mantine/core';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '@main/components/auth/AuthLayout';
import AuthHero from '@main/components/auth/AuthHero';
import { useI18n } from '@main/lib/i18n';
import { supabase } from '@main/lib/supabase';

export default function PasswordResetConfirmPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { t } = useI18n();

    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    useEffect(() => {
        // URL에서 토큰 추출하여 세션 설정
        if (accessToken && refreshToken) {
            supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
            });
        }
    }, [accessToken, refreshToken]);

    async function handleSubmit() {
        if (loading) return;
        setError(null);

        if (!password) {
            setError(t('auth.password.required'));

            return;
        }

        if (password.length < 8) {
            setError(t('auth.password.min'));

            return;
        }

        if (password !== confirmPassword) {
            setError(t('auth.password.mismatch'));

            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });

            if (error) throw error;
            setSuccess(true);
            // 3초 후 로그인 페이지로 리다이렉트
            setTimeout(() => navigate('/signin'), 3000);
        } catch (e: any) {
            setError(e.message || t('errors.unknown'));
        } finally {
            setLoading(false);
        }
    }

    if (!accessToken || !refreshToken) {
        return (
            <AuthLayout hero={<AuthHero variant="reset" />}>
                <Card withBorder component="section" p="xl" radius="lg" shadow="md">
                    <Alert color="red" title={t('errors.error')}>
                        {t('auth.reset.invalidLink')}
                    </Alert>
                </Card>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout hero={<AuthHero variant="reset" />}>
            <Card withBorder component="section" p="xl" radius="lg" shadow="md">
                <Stack gap="md">
                    <div>
                        <Text fw={600} size="lg">
                            {t('auth.reset.newPasswordTitle')}
                        </Text>
                        <Text c="dimmed" mt={4} size="sm">
                            {t('auth.reset.newPasswordSubtitle')}
                        </Text>
                    </div>
                    {success ? (
                        <Alert color="teal" title={t('auth.reset.success.title')}>
                            {t('auth.reset.success.desc')}
                        </Alert>
                    ) : (
                        <>
                            <PasswordInput
                                autoComplete="new-password"
                                label={t('auth.newPassword')}
                                placeholder="••••••••"
                                size="sm"
                                value={password}
                                onChange={(e) => setPassword(e.currentTarget.value)}
                            />
                            <PasswordInput
                                autoComplete="new-password"
                                label={t('auth.confirmPassword')}
                                placeholder="••••••••"
                                size="sm"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                            />
                            {error && (
                                <Text c="red" size="sm">
                                    {error}
                                </Text>
                            )}
                            <Button disabled={loading} loading={loading} size="sm" onClick={handleSubmit}>
                                {t('auth.reset.confirm')}
                            </Button>
                        </>
                    )}
                </Stack>
            </Card>
        </AuthLayout>
    );
}
