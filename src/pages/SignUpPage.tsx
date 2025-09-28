import { Button, Card, Divider, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@main/lib/auth';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '@main/components/auth/AuthLayout';
import AuthHero from '@main/components/auth/AuthHero';
import ConsentCheckboxes, { ConsentState } from '@main/components/auth/ConsentCheckboxes';

export default function SignUpPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [consent, setConsent] = useState<ConsentState | null>(null);
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const { register, loading } = useAuth();
    const navigate = useNavigate();

    const passwordMismatch = passwordConfirm.length > 0 && passwordConfirm !== password;
    const canSubmit = name && email && password && !passwordMismatch && consent?.terms && consent?.privacy && (consent?.age ?? true);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!canSubmit) return;
        await register(name, email, password);
        navigate('/');
    };

    return (
        <AuthLayout hero={<AuthHero variant="signup" />}>
            <Card withBorder component="section" p="xl" radius="lg" shadow="md">
                <form onSubmit={handleSubmit}>
                    <Stack gap="lg">
                        <div>
                            <Title fw={700} order={3} size={26}>
                                회원가입
                            </Title>
                            <Text c="dimmed" mt={4} size="xs">
                                지금 계정을 만들고 학습을 시작하세요.
                            </Text>
                        </div>
                        <Stack gap="sm">
                            <TextInput autoComplete="name" label="이름" placeholder="홍길동" size="sm" value={name} onChange={(e) => setName(e.target.value)} />
                            <TextInput autoComplete="email" label="이메일" placeholder="you@email.com" size="sm" value={email} onChange={(e) => setEmail(e.target.value)} />
                            <TextInput autoComplete="new-password" label="비밀번호" placeholder="••••••" size="sm" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                            <TextInput
                                autoComplete="new-password"
                                error={passwordMismatch ? '비밀번호가 일치하지 않습니다.' : undefined}
                                label="비밀번호 확인"
                                placeholder="••••••"
                                size="sm"
                                type="password"
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                            />
                        </Stack>
                        {passwordMismatch && (
                            <Text c="red" fz={12} mt={-4} pb={0}>
                                비밀번호가 서로 다릅니다. 다시 입력해주세요.
                            </Text>
                        )}
                        <ConsentCheckboxes requireAge onChange={setConsent} />
                        <Button disabled={!canSubmit} leftSection={<UserPlus size={14} />} loading={loading} size="sm" type="submit">
                            회원가입
                        </Button>
                        <Divider label="이미 계정이 있나요?" labelPosition="center" my="xs" />
                        <Group justify="space-between">
                            <Text c="dimmed" size="xs">
                                이미 계정이 있나요?{' '}
                                <Text component={Link} fw={600} size="xs" to="/signin">
                                    로그인
                                </Text>
                            </Text>
                        </Group>
                    </Stack>
                </form>
            </Card>
        </AuthLayout>
    );
}
