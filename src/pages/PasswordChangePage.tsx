import { useState } from 'react';
import { Alert, Button, Card, PasswordInput, Stack, Text } from '@mantine/core';
import AuthLayout from '@main/components/auth/AuthLayout';
import AuthHero from '@main/components/auth/AuthHero';
import { useAuth } from '@main/lib/auth';
import { useI18n } from '@main/lib/i18n';
import { supabase } from '@main/lib/supabase';

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
        if (loading) return;
        setError(null);
        setDone(false);

        if (!user) {
            setError(t('auth.loginRequired.message.generic'));

            return;
        }
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
        if (currentPw === newPw) {
            setError(t('auth.password.same'));

            return;
        }

        setLoading(true);
        try {
            // 1) 현재 비밀번호 검증을 위해 재로그인 시도 (Supabase는 updateUser에 현재 PW 요구 X 이지만 사용자 검증 UX용)
            const email = user.email;
            const reAuth = await supabase.auth.signInWithPassword({ email, password: currentPw });

            if (reAuth.error) throw reAuth.error;
            // 2) 비밀번호 변경
            const { error: updErr } = await supabase.auth.updateUser({ password: newPw });

            if (updErr) throw updErr;
            setDone(true);
            setCurrentPw('');
            setNewPw('');
            setConfirmPw('');
        } catch (e: any) {
            const msg = e?.message?.toLowerCase() || '';

            if (msg.includes('invalid login credentials')) setError(t('auth.password.required'));
            else setError(e.message || t('errors.unknown'));
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout hero={<AuthHero variant="change" />}>
            <Card withBorder component="section" p={{ base: 'lg', md: 'xl' }} radius="lg" shadow="md">
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
                        <Alert color="teal" title={t('auth.password.change')}>
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
                    <Button disabled={!user} loading={loading} size="sm" onClick={handleSubmit}>
                        {t('auth.password.change')}
                    </Button>
                </Stack>
            </Card>
        </AuthLayout>
    );
}
