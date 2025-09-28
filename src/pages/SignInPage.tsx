import { Button, Card, Divider, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { LogIn } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@main/lib/auth';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '@main/components/auth/AuthLayout';
import AuthHero from '@main/components/auth/AuthHero';

export default function SignInPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading } = useAuth();
    const navigate = useNavigate();

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
                                로그인
                            </Title>
                            <Text c="dimmed" mt={4} size="xs">
                                계정에 로그인하여 학습을 이어가세요.
                            </Text>
                        </div>
                        <Stack gap="sm">
                            <TextInput autoComplete="email" label="이메일" placeholder="you@email.com" size="sm" value={email} onChange={(e) => setEmail(e.target.value)} />
                            <TextInput autoComplete="current-password" label="비밀번호" placeholder="••••••" size="sm" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </Stack>
                        <Button disabled={disabled} leftSection={<LogIn size={14} />} loading={loading} size="sm" type="submit">
                            로그인
                        </Button>
                        <Divider label="이메일로 계속" labelPosition="center" my="xs" />
                        <Group justify="space-between">
                            <Text c="dimmed" size="xs">
                                아직 계정이 없나요?{' '}
                                <Text component={Link} fw={600} size="xs" to="/signup">
                                    회원가입
                                </Text>
                            </Text>
                            <Text c="dimmed" component={Link} size="xs" style={{ textDecoration: 'underline' }} to="/forgot">
                                비밀번호 재설정
                            </Text>
                        </Group>
                    </Stack>
                </form>
            </Card>
        </AuthLayout>
    );
}
