import { Button, Card, Stack, TextInput } from '@mantine/core';
import { LogIn } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@main/lib/auth';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@main/components/layout/PageContainer';
import PageHeader from '@main/components/layout/PageHeader';

export default function SignInPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async () => {
        await login(email, password);
        navigate('/');
    };

    return (
        <PageContainer roleMain size="xs">
            <PageHeader description="계정에 로그인하여 학습을 이어가세요." title="로그인" />
            <Card withBorder p="xl" radius="md" shadow="sm">
                <Stack>
                    <TextInput label="이메일" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <TextInput label="비밀번호" placeholder="비밀번호" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <Button fullWidth disabled={!email || !password} leftSection={<LogIn size={14} />} loading={loading} onClick={handleSubmit}>
                        로그인
                    </Button>
                </Stack>
            </Card>
        </PageContainer>
    );
}
