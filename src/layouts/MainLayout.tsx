import { AppShell } from '@mantine/core';
import { ReactNode, useEffect, useMemo, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { useMediaQuery } from '@mantine/hooks';

import Header from './Header';
import Navbar from './Navbar';
import Footer from './Footer';

interface MainLayoutProps {
    children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
    const [navOpened, { toggle: toggleNav, close: closeNav }] = useDisclosure(false);
    const isMobile = useMediaQuery('(max-width: 48em)'); // Mantine sm breakpoint (≈768px)
    const burgerRef = useRef<HTMLButtonElement>(null!);
    const firstNavFocusRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);

    // 라우트 변화시 자동 닫기 제거: 사용자 의도 없이 패널 사라져 "깜박임" 인지 방지
    // (모바일에서도 사용자가 직접 링크 클릭했을 때 Navbar 컴포넌트 onClick 에서만 닫음)

    const panelStyle = useMemo<React.CSSProperties>(() => {
        return {
            position: 'fixed',
            top: 64,
            left: 0,
            width: isMobile ? '66vw' : 300,
            maxWidth: isMobile ? 420 : 360,
            height: 'calc(100vh - 64px)',
            overflowY: 'auto',
            zIndex: 600,
            background: 'var(--mantine-color-body)',
            boxShadow: 'var(--mantine-shadow-md)'
        };
    }, [isMobile]);

    // Body scroll lock while overlay open (모바일/데스크탑 공통)
    useEffect(() => {
        if (!navOpened) return;
        const prev = document.body.style.overflow;

        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = prev;
        };
    }, [navOpened]);

    // Focus management: overlay open → 첫 링크, 닫힘 → 버거
    useEffect(() => {
        if (navOpened) {
            setTimeout(() => firstNavFocusRef.current?.focus(), 0);
        } else {
            burgerRef.current?.focus();
        }
    }, [navOpened]);

    // AppShell.navbar prop 제거: 데스크탑 고정 사이드바 미사용 (요구사항: 레이아웃 붕괴 방지)
    const appShellNavbarProp = undefined;

    return (
        <AppShell
            bg="light-dark(#f8fafc, #181c1f)"
            footer={{ height: 80 }}
            header={{ height: 64 }}
            // 데스크탑에서는 navbar prop 자체를 제거하여 메인 offset 깨짐 방지
            {...(appShellNavbarProp ? { navbar: appShellNavbarProp } : {})}
            padding={0}
        >
            <AppShell.Header style={{ backgroundColor: 'color-mix(in srgb, var(--mantine-color-body), transparent 50%)', backdropFilter: 'blur(5px)' }}>
                <Header burgerRef={burgerRef} navOpened={navOpened} toggleNav={toggleNav} />
            </AppShell.Header>
            {navOpened && (
                <div aria-label="주 메뉴" id="global-nav-panel" role="navigation" style={panelStyle}>
                    <div style={{ padding: 'var(--mantine-spacing-md)' }}>
                        <Navbar closeNav={closeNav} firstFocusableRef={firstNavFocusRef} />
                    </div>
                </div>
            )}
            {navOpened && (
                <div
                    aria-label="메뉴 배경"
                    role="button"
                    style={{
                        backdropFilter: 'blur(2px)',
                        background: 'rgba(0,0,0,0.35)',
                        inset: 0,
                        position: 'fixed',
                        top: 64,
                        zIndex: 590
                    }}
                    tabIndex={0}
                    onClick={closeNav}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') closeNav();
                    }}
                />
            )}
            <AppShell.Main bg="light-dark(#f8fafc, #181c1f)" id="main">
                {children}
            </AppShell.Main>
            <AppShell.Footer>
                <Footer />
            </AppShell.Footer>
        </AppShell>
    );
};

export default MainLayout;
