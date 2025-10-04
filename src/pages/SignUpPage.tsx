import { Button, Card, Divider, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@main/lib/auth';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '@main/components/auth/AuthLayout';
import AuthHero from '@main/components/auth/AuthHero';
import ConsentCheckboxes, { ConsentState } from '@main/components/auth/ConsentCheckboxes';
import { useI18n } from '@main/lib/i18n';

export default function SignUpPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [consent, setConsent] = useState<ConsentState | null>(null);
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const { register, loading, user } = useAuth();
    const navigate = useNavigate();
    const { t } = useI18n();

    // 이미 로그인된 사용자는 메인으로 리다이렉트
    useEffect(() => {
        if (user && !loading) {
            navigate('/', { replace: true });
        }
    }, [user, loading, navigate]);

    const passwordMismatch = passwordConfirm.length > 0 && passwordConfirm !== password;
    const canSubmit = name && email && password && !passwordMismatch && consent?.terms && consent?.privacy && (consent?.age ?? true);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!canSubmit) return;
        try {
            await register(name, email, password);
            // 회원가입 성공 후 즉시 리다이렉트
            navigate('/', { replace: true });
        } catch {
            // 회원가입 실패 시 error는 context에서 설정됨
        }
    };

    return (
        <AuthLayout hero={<AuthHero variant="signup" />}>
            <Card withBorder component="section" p="xl" radius="lg" shadow="md">
                <form onSubmit={handleSubmit}>
                    <Stack gap="lg">
                        <div>
                            <Title fw={700} order={3} size={26}>
                                {t('auth.signUp')}
                            </Title>
                            <Text c="dimmed" mt={4} size="sm">
                                {t('auth.subtitleSignUp')}
                            </Text>
                        </div>
                        <Stack gap="sm">
                            <TextInput autoComplete="name" label={t('auth.name')} placeholder="홍길동" size="sm" value={name} onChange={(e) => setName(e.target.value)} />
                            <TextInput autoComplete="email" label={t('auth.email')} placeholder="you@email.com" size="sm" value={email} onChange={(e) => setEmail(e.target.value)} />
                            <TextInput
                                autoComplete="new-password"
                                label={t('auth.passwordLabel')}
                                placeholder="••••••"
                                size="sm"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <TextInput
                                autoComplete="new-password"
                                error={passwordMismatch ? t('auth.password.mismatch') : undefined}
                                label={t('auth.confirmPassword')}
                                placeholder="••••••"
                                size="sm"
                                type="password"
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                            />
                        </Stack>
                        {passwordMismatch && (
                            <Text c="red" fz={12} mt={-4} pb={0}>
                                {t('auth.password.mismatch')}
                            </Text>
                        )}
                        <ConsentCheckboxes requireAge onChange={setConsent} />
                        <Button disabled={!canSubmit} leftSection={<UserPlus size={14} />} loading={loading} size="sm" type="submit">
                            {t('auth.signUp')}
                        </Button>
                        <Divider label={t('auth.haveAccount')} labelPosition="center" my="xs" />
                        <Group justify="space-between">
                            <Text c="dimmed" size="sm">
                                {t('auth.haveAccount')}{' '}
                                <Text component={Link} fw={600} size="sm" to="/signin">
                                    {t('auth.signIn')}
                                </Text>
                            </Text>
                        </Group>
                    </Stack>
                </form>
            </Card>
        </AuthLayout>
    );
}
