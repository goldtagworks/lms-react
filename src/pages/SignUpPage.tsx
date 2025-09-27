import { Button, Card, Container, Stack, TextInput, Title } from '@mantine/core';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@main/lib/auth';
import { useNavigate } from 'react-router-dom';

export default function SignUpPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const { register, loading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async () => {
        await register(name, email, password);
        navigate('/');
    };

    return (
        <Container py="xl" size="xs">
            <Card withBorder padding="xl" radius="md" shadow="sm">
                <Title mb="md" order={3}>
                    회원가입
                </Title>
                <Stack>
                    <TextInput label="이름" placeholder="홍길동" value={name} onChange={(e) => setName(e.target.value)} />
                    <TextInput label="이메일" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <TextInput label="비밀번호" placeholder="비밀번호" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <Button fullWidth disabled={!email || !password || !name} leftSection={<UserPlus size={16} />} loading={loading} onClick={handleSubmit}>
                        회원가입
                    </Button>
                </Stack>
            </Card>
        </Container>
    );
}
