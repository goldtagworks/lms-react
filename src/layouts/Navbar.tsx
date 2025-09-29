import { Box, Divider, Stack, Text } from '@mantine/core';
import { useI18n } from '@main/lib/i18n';
import { LinkButton } from '@main/components/LinkButton';
import { filterNav, navGroups } from '@main/lib/nav';
import { useAuth } from '@main/lib/auth';
import { useLocation } from 'react-router-dom';

interface NavbarProps {
    closeNav?: () => void;
    firstFocusableRef?: React.RefObject<HTMLButtonElement | HTMLAnchorElement | null>;
}

const Navbar = ({ closeNav, firstFocusableRef }: NavbarProps) => {
    const { user } = useAuth();
    const { t } = useI18n();
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
        <Box aria-label={t('nav.menuMobile')} component="nav">
            <Stack gap="sm">
                {filtered.map((g, gi) => (
                    <Box key={g.id}>
                        <Text c="dimmed" fw={600} mb={4} size="sm" style={{ letterSpacing: 0.5 }} tt="uppercase">
                            {g.labelKey ? t(g.labelKey) : g.label || ''}
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

                                return g.items.map((it, idx) => {
                                    const active = it.href === activeItemHref;

                                    return (
                                        <LinkButton
                                            key={it.id}
                                            ref={idx === 0 && gi === 0 ? (firstFocusableRef as any) : undefined}
                                            color={active ? 'primary' : 'gray'}
                                            href={it.href}
                                            justify="flex-start"
                                            label={it.labelKey ? t(it.labelKey) : it.label || ''}
                                            style={active ? { fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 4 } : undefined}
                                            variant={active ? 'light' : 'subtle'}
                                            onClick={() => {
                                                // 모바일 링크 클릭 시 닫기
                                                closeNav?.();
                                            }}
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
                        <LinkButton color="primary" href="/signin" justify="flex-start" label={t('nav.login', {}, t('auth.signIn'))} variant="light" onClick={() => closeNav?.()} />
                        <LinkButton color="primary" href="/signup" justify="flex-start" label={t('nav.signup', {}, t('auth.signUp'))} variant="filled" onClick={() => closeNav?.()} />
                    </Stack>
                )}
            </Stack>
        </Box>
    );
};

export default Navbar;
