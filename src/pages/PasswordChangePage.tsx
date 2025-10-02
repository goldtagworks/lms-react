import { useState } from 'react';
import { Alert, Button, Card, PasswordInput, Stack, Text } from '@mantine/core';
import AuthLayout from '@main/components/auth/AuthLayout';
import AuthHero from '@main/components/auth/AuthHero';
import { useAuth } from '@main/lib/auth';
import { useI18n } from '@main/lib/i18n';

export default function PasswordChangePage() {
    const { user } = useAuth();
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const { t } = useI18n();

    async function handleSubmit() {
        setError(null);

        if (!currentPw || !newPw) {
            setError(t('auth.password.required'));

            return;
        }

        if (newPw.length < 8) {
            setError(t('auth.password.min'));

            return;
        }

        if (newPw !== confirmPw) {
            setError(t('auth.password.mismatch'));

            return;
        }

        setLoading(true);

        try {
            // TODO: 실제 비밀번호 변경 API 호출로 교체
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setDone(true);
            setCurrentPw('');
            setNewPw('');
            setConfirmPw('');
        } catch {
            setError(t('auth.password.updateError'));
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout hero={<AuthHero variant="change" />}>
            <Card withBorder component="section" p="xl" radius="lg" shadow="md">
                <Stack gap="md">
                    <div>
                        <Text fw={600} size="lg">
                            {t('auth.changeTitle')}
                        </Text>
                        <Text c="dimmed" mt={4} size="sm">
                            {t('auth.changeSubtitle')}
                        </Text>
                    </div>
                    {!user && (
                        <Alert color="red" title={t('auth.loginRequired.title')}>
                            {t('auth.loginRequired.message.generic')}
                        </Alert>
                    )}
                    {done && (
                        <Alert color="teal" title={t('auth.password.changed.title')}>
                            {t('auth.password.changed.desc')}
                        </Alert>
                    )}
                    <PasswordInput
                        disabled={!user}
                        label={t('auth.currentPassword')}
                        placeholder={t('auth.currentPassword')}
                        size="sm"
                        value={currentPw}
                        onChange={(e) => setCurrentPw(e.currentTarget.value)}
                    />
                    <PasswordInput disabled={!user} label={t('auth.newPassword')} placeholder={t('auth.newPassword')} size="sm" value={newPw} onChange={(e) => setNewPw(e.currentTarget.value)} />
                    <PasswordInput
                        disabled={!user}
                        label={t('auth.confirmPassword')}
                        placeholder={t('auth.confirmPassword')}
                        size="sm"
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.currentTarget.value)}
                    />
                    {error && (
                        <Text c="red" size="sm">
                            {error}
                        </Text>
                    )}
                    <Button disabled={!user} loading={loading} size="sm" onClick={handleSubmit}>
                        {t('auth.password.update')}
                    </Button>
                </Stack>
            </Card>
        </AuthLayout>
    );
}
