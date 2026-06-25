// Preload bridge. Exposes a single, minimal `posBridge.invoke` to the renderer —
// the only surface the UI has into the main process (contextIsolation on).

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('posBridge', {
    invoke: (method, payload) => ipcRenderer.invoke('pos:invoke', method, payload),
});
