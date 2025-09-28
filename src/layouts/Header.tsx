import React from 'react';
import { Burger, Container, Group, Title, Button, Menu, rem } from '@mantine/core';
import { LinkButton } from '@main/components/LinkButton';
import { useAuth } from '@main/lib/auth';
import { filterNav, navGroups } from '@main/lib/nav';
import { useLocation, Link, useNavigate } from 'react-router-dom';

interface HeaderProps {
    navOpened: boolean;
    toggleNav: () => void;
    burgerRef?: React.RefObject<HTMLButtonElement>;
}

const Header = ({ navOpened, toggleNav, burgerRef }: HeaderProps) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const role = user?.role ?? null;
    const location = useLocation();
    const pathname = location.pathname;
    const filtered = filterNav(
        navGroups.map((g) => ({
            ...g,
            items: g.items.map((it) => ({
                ...it,
                href: user ? it.href.replace('__USER_ID__', user.id) : it.href
            }))
        })),
        { isAuthenticated: !!user, role }
    );

    return (
        <Container component="header" h="100%" size="lg">
            <Group align="center" gap="lg" h="100%" justify="space-between" wrap="nowrap">
                <Group gap="sm">
                    <Burger ref={burgerRef} aria-controls="global-nav-panel" aria-expanded={navOpened} opened={navOpened} size="sm" onClick={toggleNav} />
                    <Link aria-label="홈으로 이동" style={{ color: 'inherit', textDecoration: 'none' }} to="/">
                        <Title className="ls-tight" fw={800} m={0} order={3}>
                            KSI Style LMS
                        </Title>
                    </Link>
                </Group>
                <Group gap={4} visibleFrom="sm">
                    {filtered.map((g) => {
                        // 활성 로직 (정확/최장 경로 우선):
                        // 1) 현재 pathname 과 일치하거나 세그먼트 경계(prefix + '/')로 시작하는 nav item 들 수집
                        // 2) 그 중 href 길이가 가장 긴(=가장 구체적인) 하나만 active 로 표시
                        // 예: pathname=/my/wishlist => 후보 [/my, /my/wishlist] 중 /my/wishlist 만 active
                        const matchCandidates = g.items.filter((it) => {
                            if (pathname === it.href) return true;
                            if (it.href !== '/' && pathname.startsWith(it.href + '/')) return true;

                            return false;
                        });
                        const activeItemHref = matchCandidates.length ? matchCandidates.reduce((longest, current) => (current.href.length > longest.href.length ? current : longest)).href : null;
                        const groupActive = !!activeItemHref;

                        return (
                            <Menu key={g.id} withinPortal closeDelay={120} openDelay={80} position="bottom-start" shadow="md" trigger="hover" width={200}>
                                <Menu.Target>
                                    <Button
                                        px={rem(16)}
                                        style={groupActive ? { fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 4 } : undefined}
                                        variant={groupActive ? 'light' : 'subtle'}
                                    >
                                        {g.label}
                                    </Button>
                                </Menu.Target>
                                <Menu.Dropdown aria-label={`${g.label} 메뉴`}>
                                    {g.items.map((it) => {
                                        const itemActive = it.href === activeItemHref; // 최장 매칭만 active

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
                                <Button variant="default">{user.name}</Button>
                            </Menu.Target>
                            <Menu.Dropdown aria-label="계정 메뉴">
                                <Menu.Label>계정</Menu.Label>
                                <Menu.Item component="a" href="/my">
                                    마이페이지
                                </Menu.Item>
                                <Menu.Item component="a" href="/password/change">
                                    비밀번호 변경
                                </Menu.Item>
                                <Menu.Item
                                    onClick={() => {
                                        logout();
                                        navigate('/');
                                    }}
                                >
                                    로그아웃
                                </Menu.Item>
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
