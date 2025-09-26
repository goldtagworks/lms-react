import { Button, Card, Container, Stack, TextInput, Title } from '@mantine/core';
import { useState } from 'react';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

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
                    <Button fullWidth>회원가입</Button>
                </Stack>
            </Card>
        </Container>
    );
}
