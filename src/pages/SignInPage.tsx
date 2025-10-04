import { Button, Card, Divider, Group, Stack, Text, TextInput, Title, Alert } from '@mantine/core';
import { LogIn } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useAuth } from '@main/lib/auth';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '@main/components/auth/AuthLayout';
import AuthHero from '@main/components/auth/AuthHero';
import { useI18n } from '@main/lib/i18n';
// supabase 직접 signOut 사용 제거 (단순 로직)

export default function SignInPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading, error, user } = useAuth();
    const errorRef = useRef<HTMLDivElement | null>(null);
    const navigate = useNavigate();
    const { t } = useI18n();

    // 가장 단순: 이미 로그인되어 있으면 홈으로 내보낸다.
    useEffect(() => {
        if (user) navigate('/', { replace: true });
    }, [user, navigate]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!email || !password) return;
        try {
            await login(email, password);
            navigate('/', { replace: true });
        } catch {
            // error는 context에서 처리
        }
    };

    const disabled = !email || !password;

    return (
        <AuthLayout hero={<AuthHero variant="signin" />}>
            <Card withBorder component="section" p="xl" radius="lg" shadow="md">
                <form onSubmit={handleSubmit}>
                    <Stack gap="lg">
                        <div>
                            <Title fw={700} order={3} size={26}>
                                {t('auth.signIn')}
                            </Title>
                            <Text c="dimmed" mt={4} size="sm">
                                {t('auth.subtitleSignIn')}
                            </Text>
                        </div>
                        {error && (
                            <Alert ref={errorRef} aria-live="assertive" color="red" radius="md" title={t('auth.signInFailed', undefined, '로그인 실패')} variant="light">
                                {error}
                            </Alert>
                        )}
                        <Stack gap="sm">
                            <TextInput autoComplete="email" label={t('auth.email')} placeholder="you@email.com" size="sm" value={email} onChange={(e) => setEmail(e.target.value)} />
                            <TextInput
                                autoComplete="current-password"
                                label={t('auth.passwordLabel')}
                                placeholder="••••••"
                                size="sm"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </Stack>
                        <Button disabled={disabled} leftSection={<LogIn size={14} />} loading={loading} size="sm" type="submit">
                            {t('auth.signIn')}
                        </Button>
                        <Divider label={t('auth.continueWithEmail')} labelPosition="center" my="xs" />
                        <Group justify="space-between">
                            <Text c="dimmed" size="sm">
                                {t('auth.noAccountYet')}{' '}
                                <Text component={Link} fw={600} size="sm" to="/signup">
                                    {t('auth.signUp')}
                                </Text>
                            </Text>
                            <Text c="dimmed" component={Link} size="sm" style={{ textDecoration: 'underline' }} to="/password/reset">
                                {t('auth.forgot')}
                            </Text>
                        </Group>
                    </Stack>
                </form>
            </Card>
        </AuthLayout>
    );
}
