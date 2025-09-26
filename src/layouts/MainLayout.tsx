import { AppShell, Container, Group, Box, Burger, Title, Text } from '@mantine/core';
import { ReactNode } from 'react';
import { useDisclosure } from '@mantine/hooks';

import { LinkButton } from '../components/LinkButton';

interface MainLayoutProps {
    children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const [navOpened, { toggle: toggleNav }] = useDisclosure(false);

    return (
        <AppShell bg="light-dark(#f8fafc, #181c1f)" footer={{ height: 80 }} header={{ height: 64 }} navbar={{ breakpoint: 'sm', collapsed: { mobile: !navOpened }, width: 240 }} padding={0}>
            <AppShell.Header bg="var(--mantine-color-body)">
                <Container h="100%" size="lg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Group gap="sm">
                        <Burger hiddenFrom="sm" opened={navOpened} size="sm" onClick={toggleNav} />
                        <Title fw={800} m={0} order={3} style={{ letterSpacing: '.2px' }}>
                            KSI Style LMS
                        </Title>
                    </Group>
                    <Group gap="md" visibleFrom="sm">
                        <LinkButton href="#courses" label="코스" variant="subtle" />
                        <LinkButton href="#guide" label="가이드" variant="subtle" />
                        <LinkButton href="#support" label="고객센터" variant="subtle" />
                        <LinkButton href="#login" label="로그인" variant="outline" />
                    </Group>
                </Container>
            </AppShell.Header>
            <AppShell.Navbar p="md">
                <Box aria-label="모바일 메뉴" component="nav" display="flex" style={{ flexDirection: 'column', gap: 8 }}>
                    <LinkButton color="primary" href="#courses" justify="flex-start" label="코스" variant="subtle" />
                    <LinkButton color="primary" href="#guide" justify="flex-start" label="가이드" variant="subtle" />
                    <LinkButton color="primary" href="#support" justify="flex-start" label="고객센터" variant="subtle" />
                    <LinkButton color="primary" href="#login" justify="flex-start" label="로그인" variant="light" />
                </Box>
            </AppShell.Navbar>
            <AppShell.Main bg="light-dark(#f8fafc, #181c1f)" id="main">
                {children}
            </AppShell.Main>
            <AppShell.Footer bg="var(--mantine-color-body)">
                <Container size="lg">
                    <Group gap="md" py="md">
                        <LinkButton bg="none" h="auto" href="#terms" label="이용약관" p={0} variant="subtle" />
                        <LinkButton bg="none" h="auto" href="#privacy" label="개인정보처리방침" p={0} variant="subtle" />
                        <LinkButton bg="none" h="auto" href="#reject" label="이메일무단수집거부" p={0} variant="subtle" />
                    </Group>
                    <Text c="dimmed" pb={16} size="sm">
                        COPYRIGHT © YOUR FOUNDATION · System Inquiries: +82-2-0000-0000
                    </Text>
                </Container>
            </AppShell.Footer>
        </AppShell>
    );
}
