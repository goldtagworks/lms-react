import { Box, Container, Group } from '@mantine/core';
import { ReactNode } from 'react';

interface HeroLayoutProps {
    hero: ReactNode;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * 왼쪽에 Hero, 오른쪽에 메인 컨텐츠를 배치하는 2컬럼 레이아웃
 * 모바일에서는 1컬럼으로 변경됨
 */
export function HeroLayout({ hero, children, size = 'lg' }: HeroLayoutProps) {
    return (
        <Box component="main" style={{ minHeight: 'calc(100vh - 64px)' }}>
            <Container px="md" py="xl" size={size}>
                <Group grow gap="xl" justify="center" style={{ flexWrap: 'wrap' }}>
                    <Box style={{ flex: '1 1 420px', maxWidth: 560 }}>{hero}</Box>
                    <Box style={{ flex: '1 1 360px', maxWidth: 520 }}>{children}</Box>
                </Group>
            </Container>
        </Box>
    );
}

export default HeroLayout;
