import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import { registerServiceWorker } from '@/lib/registerSW';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
    state = { error: null };
    static getDerivedStateFromError(error: Error) {
        return { error };
    }
    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error(error, info);
    }
    render() {
        if (this.state.error) {
            return (
                <div
                    style={{
                        padding: 32,
                        fontFamily: 'monospace',
                        background: '#fff1f0',
                        border: '2px solid #f00',
                        margin: 16,
                        borderRadius: 8,
                    }}
                >
                    <strong style={{ color: '#c00' }}>React Error:</strong>
                    <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap', color: '#333' }}>
                        {(this.state.error as Error).message}
                        {'\n\n'}
                        {(this.state.error as Error).stack}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}

const appName = import.meta.env.VITE_APP_NAME || 'BK SMANSAKA';

registerServiceWorker();

createInertiaApp({
    title: (title) => (title ? `${title} — ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob('./Pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <ErrorBoundary>
                <App {...props} />
                <Toaster
                    position="top-right"
                    richColors
                    closeButton
                    toastOptions={{ style: { fontFamily: 'Inter, sans-serif' } }}
                />
            </ErrorBoundary>,
        );
    },
    progress: {
        color: '#117481',
        showSpinner: true,
    },
});
