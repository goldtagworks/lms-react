import { useState } from 'react';
import { Alert, Button, Card, Stack, Text, TextInput } from '@mantine/core';
import AuthLayout from '@main/components/auth/AuthLayout';
import AuthHero from '@main/components/auth/AuthHero';

// NOTE: 서버 연동 전까지 mock 처리
export default function PasswordResetRequestPage() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function submit() {
        setError(null);
        if (!email.trim()) {
            setError('이메일을 입력하세요');

            return;
        }
        setSent(true);
    }

    return (
        <AuthLayout hero={<AuthHero variant="reset" />}>
            <Card withBorder component="section" p="xl" radius="lg" shadow="md">
                <Stack gap="md">
                    <div>
                        <Text fw={600} size="lg">
                            비밀번호 재설정
                        </Text>
                        <Text c="dimmed" mt={4} size="sm">
                            가입한 이메일을 입력하면 재설정 링크(모의)를 전송합니다.
                        </Text>
                    </div>
                    {sent ? (
                        <Alert color="teal" title="전송됨">
                            재설정 링크를 보냈습니다 (mock). 메일함을 확인하세요.
                        </Alert>
                    ) : (
                        <>
                            <TextInput autoComplete="email" label="이메일" placeholder="you@example.com" size="sm" value={email} onChange={(e) => setEmail(e.currentTarget.value)} />
                            {error && (
                                <Text c="red" size="sm">
                                    {error}
                                </Text>
                            )}
                            <Button size="sm" onClick={submit}>
                                링크 보내기
                            </Button>
                        </>
                    )}
                </Stack>
            </Card>
        </AuthLayout>
    );
}
