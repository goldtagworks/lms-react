import { Box, Container, Group } from '@mantine/core';
import { ReactNode } from 'react';

interface AuthLayoutProps {
    hero: ReactNode;
    children: ReactNode;
}

// 2컬럼 (md+) / 1컬럼 (sm) 반응형 Auth 레이아웃
export function AuthLayout({ hero, children }: AuthLayoutProps) {
    return (
        <Box component="main" style={{ minHeight: 'calc(100vh - 64px)' }}>
            <Container px="md" py="xl" size="lg">
                <Group grow gap="xl" justify="center" style={{ flexWrap: 'wrap' }}>
                    <Box style={{ flex: '1 1 420px', maxWidth: 560 }}>{hero}</Box>
                    <Box style={{ flex: '1 1 360px', maxWidth: 520 }}>{children}</Box>
                </Group>
            </Container>
        </Box>
    );
}

export default AuthLayout;
