import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import { registerServiceWorker } from '@/lib/registerSW';

const appName = import.meta.env.VITE_APP_NAME || 'BK SMANSAKA';

registerServiceWorker();

createInertiaApp({
    title: (title) => (title ? `${title} — ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <>
                <App {...props} />
                <Toaster
                    position="top-right"
                    richColors
                    closeButton
                    toastOptions={{ style: { fontFamily: 'Inter, sans-serif' } }}
                />
            </>,
        );
    },
    progress: {
        color: '#117481',
        showSpinner: true,
    },
});
