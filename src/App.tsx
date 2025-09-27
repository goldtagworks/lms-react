import React from 'react';
import { MantineProvider } from '@mantine/core';

import AppRouter from './app/router';

function App() {
    return (
        <MantineProvider>
            <AppRouter />
        </MantineProvider>
    );
}

export default App;
