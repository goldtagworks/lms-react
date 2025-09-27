import React from 'react';
import { Burger, Container, Group, Title, Button, Menu, rem } from '@mantine/core';
import { LinkButton } from '@main/components/LinkButton';
import { useAuth } from '@main/lib/auth';
import { filterNav, navGroups } from '@main/lib/nav';
import { useLocation, Link } from 'react-router-dom';

interface HeaderProps {
    navOpened: boolean;
    toggleNav: () => void;
}

const Header = ({ navOpened, toggleNav }: HeaderProps) => {
    const { user, logout } = useAuth();

    const role = user?.role ?? null;
    const location = useLocation();
    const pathname = location.pathname;
    const filtered = filterNav(navGroups, { isAuthenticated: !!user, role });

    return (
        <Container component="header" h="100%" size="lg">
            <Group align="center" gap="lg" h="100%" justify="space-between" wrap="nowrap">
                <Group gap="sm">
                    <Burger hiddenFrom="sm" opened={navOpened} size="sm" onClick={toggleNav} />
                    <Link aria-label="홈으로 이동" style={{ color: 'inherit', textDecoration: 'none' }} to="/">
                        <Title className="ls-tight" fw={800} m={0} order={3}>
                            KSI Style LMS
                        </Title>
                    </Link>
                </Group>
                <Group gap="md" visibleFrom="sm">
                    {filtered.map((g) => {
                        // 그룹 활성 판단: 그룹 내 어떤 item이 현재 경로 prefix 매칭
                        const groupActive = g.items.some((it) => pathname === it.href || (it.href !== '/' && pathname.startsWith(it.href)));

                        return (
                            <Menu key={g.id} withinPortal closeDelay={120} openDelay={80} position="bottom-start" shadow="md" trigger="hover" width={200}>
                                <Menu.Target>
                                    <Button
                                        px={rem(4)}
                                        style={groupActive ? { fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 4 } : undefined}
                                        variant={groupActive ? 'light' : 'subtle'}
                                    >
                                        {g.label}
                                    </Button>
                                </Menu.Target>
                                <Menu.Dropdown aria-label={`${g.label} 메뉴`}>
                                    {g.items.map((it) => {
                                        const itemActive = pathname === it.href || (it.href !== '/' && pathname.startsWith(it.href));

                                        return (
                                            <Menu.Item key={it.id} component={Link} style={itemActive ? { background: 'var(--mantine-color-blue-light)', fontWeight: 600 } : undefined} to={it.href}>
                                                {it.label}
                                            </Menu.Item>
                                        );
                                    })}
                                </Menu.Dropdown>
                            </Menu>
                        );
                    })}
                    {!user && <LinkButton href="/signin" label="로그인" variant="outline" />}
                    {!user && <LinkButton href="/signup" label="회원가입" variant="filled" />}
                    {user && (
                        <Menu withinPortal position="bottom-end" shadow="md" width={180}>
                            <Menu.Target>
                                <Button variant="light">{user.name}</Button>
                            </Menu.Target>
                            <Menu.Dropdown aria-label="계정 메뉴">
                                <Menu.Label>계정</Menu.Label>
                                <Menu.Item component="a" href="/my">
                                    마이페이지
                                </Menu.Item>
                                <Menu.Item onClick={logout}>로그아웃</Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    )}
                </Group>
            </Group>
        </Container>
    );
};

// letter-spacing 유틸 클래스 (TODO: 전역 typography tokens으로 이동)
// .ls-tight { letter-spacing: .2px; }

export default Header;
