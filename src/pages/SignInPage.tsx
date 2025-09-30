import { Button, Card, Divider, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { LogIn } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@main/lib/auth';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '@main/components/auth/AuthLayout';
import AuthHero from '@main/components/auth/AuthHero';
import { useI18n } from '@main/lib/i18n';

export default function SignInPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading } = useAuth();
    const navigate = useNavigate();
    const { t } = useI18n();

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!email || !password) return;
        await login(email, password);
        navigate('/');
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
