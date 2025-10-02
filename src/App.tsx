import React from 'react';
import { MantineProvider } from '@mantine/core';

import DevQuickNav from './components/DevQuickNav';
import ErrorBoundary from './components/ErrorBoundary';
import AppRouter from './app/router';
import { ScrollToTop } from './app/ScrollToTop';
import { useRefetchGuard } from './lib/refetchGuard';

function AppWithGuards() {
    // React Query 과부하 방지
    useRefetchGuard();

    return (
        <MantineProvider>
            <ScrollToTop />
            <AppRouter />
            <DevQuickNav />
        </MantineProvider>
    );
}

function App() {
    return (
        <ErrorBoundary>
            <AppWithGuards />
        </ErrorBoundary>
    );
}

export default App;
