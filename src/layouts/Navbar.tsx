import { Box, Divider, Stack, Text } from '@mantine/core';
import { LinkButton } from '@main/components/LinkButton';
import { filterNav, navGroups } from '@main/lib/nav';
import { useAuth } from '@main/lib/auth';
import { useLocation } from 'react-router-dom';

const Navbar = () => {
    const { user } = useAuth();
    const role = user?.role ?? null;
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
    const { pathname } = useLocation();

    return (
        <Box aria-label="모바일 메뉴" component="nav">
            <Stack gap="sm">
                {filtered.map((g, gi) => (
                    <Box key={g.id}>
                        <Text c="dimmed" fw={600} mb={4} size="sm" style={{ letterSpacing: 0.5 }} tt="uppercase">
                            {g.label}
                        </Text>
                        <Stack gap={4} mb="xs">
                            {(() => {
                                // 모바일에서도 동일한 최장 경로 우선 규칙 적용
                                const matchCandidates = g.items.filter((it) => {
                                    if (pathname === it.href) return true;
                                    if (it.href !== '/' && pathname.startsWith(it.href + '/')) return true;

                                    return false;
                                });
                                const activeItemHref = matchCandidates.length
                                    ? matchCandidates.reduce((longest, current) => (current.href.length > longest.href.length ? current : longest)).href
                                    : null;

                                return g.items.map((it) => {
                                    const active = it.href === activeItemHref;

                                    return (
                                        <LinkButton
                                            key={it.id}
                                            color={active ? 'primary' : 'gray'}
                                            href={it.href}
                                            justify="flex-start"
                                            label={it.label}
                                            style={active ? { fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 4 } : undefined}
                                            variant={active ? 'light' : 'subtle'}
                                        />
                                    );
                                });
                            })()}
                        </Stack>
                        {gi < filtered.length - 1 && <Divider my="sm" />}
                    </Box>
                ))}
                {!user && (
                    <Stack gap={6} pt="sm">
                        <LinkButton color="primary" href="/signin" justify="flex-start" label="로그인" variant="light" />
                        <LinkButton color="primary" href="/signup" justify="flex-start" label="회원가입" variant="filled" />
                    </Stack>
                )}
            </Stack>
        </Box>
    );
};

export default Navbar;
