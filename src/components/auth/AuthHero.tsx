import { Box, List, rem, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { CheckCircle2 } from 'lucide-react';

interface AuthHeroProps {
    variant?: 'signin' | 'signup' | 'reset' | 'change';
}

export function AuthHero({ variant = 'signin' }: AuthHeroProps) {
    const isSignUp = variant === 'signup';
    const isReset = variant === 'reset';
    const isChange = variant === 'change';

    return (
        <Box p={{ base: 'lg', md: 'xl' }} style={{ background: 'var(--mantine-color-gray-0)', borderRadius: 'var(--mantine-radius-lg)' }}>
            <Stack gap="lg">
                <div>
                    <Title fw={800} mb={rem(4)} order={2} size={28}>
                        KSI LMS
                    </Title>
                    <Text c="dimmed" size="sm">
                        {isSignUp && '지금 계정을 만들고 성장 여정을 시작하세요.'}
                        {!isSignUp && !isReset && !isChange && '돌아오신 것을 환영합니다. 배움은 계속됩니다.'}
                        {isReset && '비밀번호를 잊으셨나요? 몇 단계만 거치면 다시 로그인할 수 있습니다.'}
                        {isChange && '보안을 강화하세요. 새 비밀번호는 이전 것과 충분히 달라야 합니다.'}
                    </Text>
                </div>
                {!isReset && !isChange && (
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
                )}
                {isReset && (
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
                        <List.Item>이메일 주소 확인</List.Item>
                        <List.Item>재설정 링크 전송</List.Item>
                        <List.Item>새 비밀번호 설정</List.Item>
                    </List>
                )}
                {isChange && (
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
                        <List.Item>강력한 조합 (문자+숫자)</List.Item>
                        <List.Item>다른 서비스와 다른 비밀번호</List.Item>
                        <List.Item>주기적 변경 권장</List.Item>
                    </List>
                )}
            </Stack>
        </Box>
    );
}

export default AuthHero;
