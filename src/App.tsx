import React from 'react';
import { MantineProvider } from '@mantine/core';
import DevQuickNav from '@main/components/DevQuickNav';

import AppRouter from './app/router';
import { ScrollToTop } from './app/ScrollToTop';

function App() {
    return (
        <MantineProvider>
            <ScrollToTop />
            <AppRouter />
            <DevQuickNav />
        </MantineProvider>
    );
}

export default App;
