// Renderer-side `posApi` port. Identical surface to what a web build would call;
// here it routes through the preload bridge to the main process. The POS screen
// codes against THIS — never against fetch or the database directly.

async function call(method, payload) {
    const res = await window.posBridge.invoke(method, payload);
    if (!res.ok) {
        const err = new Error(res.error || 'Request failed');
        err.code = res.code;
        err.detail = res.detail;
        throw err;
    }
    return res.data;
}

export const posApi = {
    enroll: (body) => call('device.enroll', body),
    deviceStatus: () => call('device.status'),
    login: (pin) => call('auth.login', { pin }),
    session: () => call('auth.session'),
    logout: () => call('auth.logout'),
    createSale: (sale) => call('sales.create', sale),
    syncNow: () => call('sync.now'),
    syncStatus: () => call('sync.status'),
};
