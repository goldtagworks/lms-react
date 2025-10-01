import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { AuthProvider } from '@main/lib/auth';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@main/lib/queryClient';

import App from './App';
import '@main/styles/app.css';

const rootElement = document.getElementById('root');

if (!rootElement) throw new Error('[main.tsx] Failed to find root element (#root)');

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <ColorSchemeScript />
        <MantineProvider defaultColorScheme="auto">
            <Notifications position="top-right" />
            <ModalsProvider>
                <BrowserRouter>
                    <QueryClientProvider client={queryClient}>
                        <AuthProvider>
                            <App />
                        </AuthProvider>
                    </QueryClientProvider>
                </BrowserRouter>
            </ModalsProvider>
        </MantineProvider>
    </React.StrictMode>
);
