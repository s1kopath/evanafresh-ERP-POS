import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ToastProvider } from '@/Components/ui/Toast';

const appName = import.meta.env.VITE_APP_NAME || 'Evana ERP+POS';

createInertiaApp({
    title: (title) => (title ? `${title} · ${appName}` : appName),
    // Lazy page resolution — each page is its own chunk, so heavy deps
    // (e.g. jsbarcode/qrcode on the Products screens) stay out of the main bundle.
    resolve: (name) =>
        resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        createRoot(el).render(
            <ToastProvider>
                <App {...props} />
            </ToastProvider>,
        );
    },
    // Page-load progress bar (top of viewport during Inertia navigations).
    progress: {
        color: '#1b8a5a',
        showSpinner: false,
        delay: 150,
    },
});
