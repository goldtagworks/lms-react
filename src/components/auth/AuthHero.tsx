import { Box, List, rem, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { CheckCircle2 } from 'lucide-react';

interface AuthHeroProps {
    variant?: 'signin' | 'signup';
}

export function AuthHero({ variant = 'signin' }: AuthHeroProps) {
    const isSignUp = variant === 'signup';

    return (
        <Box p={{ base: 'lg', md: 'xl' }} style={{ background: 'var(--mantine-color-gray-0)', borderRadius: 'var(--mantine-radius-lg)' }}>
            <Stack gap="lg">
                <div>
                    <Title fw={800} mb={rem(4)} order={2} size={28}>
                        KSI LMS
                    </Title>
                    <Text c="dimmed" size="sm">
                        {isSignUp ? '지금 계정을 만들고 성장 여정을 시작하세요.' : '돌아오신 것을 환영합니다. 배움은 계속됩니다.'}
                    </Text>
                </div>
                <List
                    center
                    icon={
                        <ThemeIcon color="primary" radius="xl" size={22} variant="light">
                            <CheckCircle2 size={14} />
                        </ThemeIcon>
                    }
                    size="sm"
                    spacing={6}
                >
                    <List.Item>언제든 빠르게 재개</List.Item>
                    <List.Item>진도 자동 저장·연동</List.Item>
                    <List.Item>수료증 발급 지원</List.Item>
                </List>
            </Stack>
        </Box>
    );
}

export default AuthHero;
