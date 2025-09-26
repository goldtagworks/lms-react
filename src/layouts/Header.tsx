import React from 'react';
import { Container, Group, Title, Burger } from '@mantine/core';

import { LinkButton } from '../components/LinkButton';

interface HeaderProps {
    navOpened: boolean;
    toggleNav: () => void;
}

const Header = ({ navOpened, toggleNav }: HeaderProps) => (
    <Container component="header" h="100%" size="lg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
);

export default Header;
