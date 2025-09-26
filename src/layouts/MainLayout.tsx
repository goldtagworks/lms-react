import { AppShell } from '@mantine/core';
import { ReactNode } from 'react';
import { useDisclosure } from '@mantine/hooks';

import Header from './Header';
import Navbar from './Navbar';
import Footer from './Footer';

interface MainLayoutProps {
    children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
    const [navOpened, { toggle: toggleNav }] = useDisclosure(false);

    return (
        <AppShell bg="light-dark(#f8fafc, #181c1f)" footer={{ height: 80 }} header={{ height: 64 }} navbar={{ breakpoint: 'sm', collapsed: { mobile: !navOpened }, width: 240 }} padding={0}>
            <AppShell.Header>
                <Header navOpened={navOpened} toggleNav={toggleNav} />
            </AppShell.Header>
            <AppShell.Navbar p="md">
                <Navbar />
            </AppShell.Navbar>
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
