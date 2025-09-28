import React from 'react';
import { MantineProvider } from '@mantine/core';
import DevQuickNav from '@main/components/DevQuickNav';

import AppRouter from './app/router';

function App() {
    return (
        <MantineProvider>
            <AppRouter />
            <DevQuickNav />
        </MantineProvider>
    );
}

export default App;
