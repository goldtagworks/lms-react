import { useState } from 'react';
import { Alert, Button, Card, PasswordInput, Stack, Text } from '@mantine/core';
import AuthLayout from '@main/components/auth/AuthLayout';
import AuthHero from '@main/components/auth/AuthHero';
import { useAuth } from '@main/lib/auth';

export default function PasswordChangePage() {
    const { user } = useAuth();
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    function submit() {
        setError(null);
        if (!currentPw || !newPw) {
            setError('필수 입력이 비었습니다');

            return;
        }

        if (newPw.length < 8) {
            setError('비밀번호는 8자 이상이어야 합니다');

            return;
        }

        if (newPw !== confirmPw) {
            setError('비밀번호가 일치하지 않습니다');

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
                            비밀번호 변경
                        </Text>
                        <Text c="dimmed" mt={4} size="sm">
                            계정 보안을 위해 주기적으로 변경하세요.
                        </Text>
                    </div>
                    {!user && (
                        <Alert color="red" title="로그인 필요">
                            로그인 상태가 아닙니다. 먼저 로그인해주세요.
                        </Alert>
                    )}
                    {done && (
                        <Alert color="teal" title="완료">
                            비밀번호가 변경되었습니다 (mock).
                        </Alert>
                    )}
                    <PasswordInput disabled={!user} label="현재 비밀번호" placeholder="현재 비밀번호" size="sm" value={currentPw} onChange={(e) => setCurrentPw(e.currentTarget.value)} />
                    <PasswordInput disabled={!user} label="새 비밀번호" placeholder="새 비밀번호 (8자 이상)" size="sm" value={newPw} onChange={(e) => setNewPw(e.currentTarget.value)} />
                    <PasswordInput disabled={!user} label="비밀번호 확인" placeholder="새 비밀번호 확인" size="sm" value={confirmPw} onChange={(e) => setConfirmPw(e.currentTarget.value)} />
                    {error && (
                        <Text c="red" size="sm">
                            {error}
                        </Text>
                    )}
                    <Button disabled={!user} size="sm" onClick={submit}>
                        변경
                    </Button>
                </Stack>
            </Card>
        </AuthLayout>
    );
}
