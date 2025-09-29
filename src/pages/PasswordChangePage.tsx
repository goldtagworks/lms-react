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
    const [done, setDone] = useState(false);
    const { t } = useI18n();

    function submit() {
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
        // mock: 실제 서버 검증/업데이트 없음
        setDone(true);
        setCurrentPw('');
        setNewPw('');
        setConfirmPw('');
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
                        <Alert color="teal" title={t('common.ok')}>
                            {t('auth.password.changed')}
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
                    <Button disabled={!user} size="sm" onClick={submit}>
                        {t('auth.password.change')}
                    </Button>
                </Stack>
            </Card>
        </AuthLayout>
    );
}
