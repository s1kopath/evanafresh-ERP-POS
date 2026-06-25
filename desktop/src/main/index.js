// Electron main process. Owns the local SQLite store and the sync engine, and
// exposes the posApi to the renderer over a single IPC channel. The renderer
// never touches the database or the network directly.

import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'node:path';
import { createSqliteStore } from './store-sqlite.mjs';
import { createApiClient } from './api-client.mjs';
import { createSyncEngine } from './sync.mjs';
import { createAuth } from './auth.mjs';
import { createPosApi } from './pos-api.mjs';

const BASE = process.env.POS_BASE || 'http://127.0.0.1:8000';

let posApi;
let syncTimer;

function bootServices() {
    const dbPath = join(app.getPath('userData'), 'pos.db');
    // For production encryption: pass { key } and use better-sqlite3-multiple-ciphers (see README).
    const store = createSqliteStore(dbPath);
    const api = createApiClient({ baseUrl: BASE, getToken: () => store.getKV('device_token') });
    const sync = createSyncEngine({ api, store });
    const auth = createAuth({ store });
    posApi = createPosApi({ store, sync, auth });

    // Background auto-sync — zero cashier intervention.
    syncTimer = setInterval(() => { sync.syncNow().catch(() => {}); }, 15_000);
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1180,
        height: 780,
        backgroundColor: '#0f3d2e',
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    if (process.env.ELECTRON_RENDERER_URL) {
        win.loadURL(process.env.ELECTRON_RENDERER_URL); // electron-vite dev server
    } else {
        win.loadFile(join(__dirname, '../renderer/index.html'));
    }
}

ipcMain.handle('pos:invoke', async (_event, method, payload) => {
    const handler = posApi?.[method];
    if (!handler) return { ok: false, error: `Unknown method: ${method}` };
    try {
        return { ok: true, data: await handler(payload) };
    } catch (e) {
        return { ok: false, error: e.message, code: e.code, detail: e.detail };
    }
});

app.whenReady().then(() => {
    bootServices();
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    clearInterval(syncTimer);
    if (process.platform !== 'darwin') app.quit();
});
