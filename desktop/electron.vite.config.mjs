import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

// Three build targets. better-sqlite3 + bcryptjs are externalized (kept as
// runtime require, rebuilt for Electron's ABI by `electron-builder install-app-deps`).
export default defineConfig({
    main: {
        plugins: [externalizeDepsPlugin()],
        build: { rollupOptions: { input: { index: 'src/main/index.js' } } },
    },
    preload: {
        plugins: [externalizeDepsPlugin()],
        build: { rollupOptions: { input: { index: 'src/preload/index.js' } } },
    },
    // Renderer root defaults to src/renderer (electron-vite convention), where index.html lives.
    renderer: {
        plugins: [react()],
    },
});
