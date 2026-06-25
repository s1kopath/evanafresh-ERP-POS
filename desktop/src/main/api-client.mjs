// HTTP client for the Laravel offline-POS sync endpoints (see routes/api.php).
//
// A network failure throws an error tagged `.offline = true` so the sync engine
// can distinguish "server unreachable" (stay local, retry later) from a real
// HTTP error. Uses global fetch — works in both Node and the Electron main process.

export function createApiClient({ baseUrl, getToken }) {
    async function req(path, { method = 'GET', body, auth = true } = {}) {
        let res;
        try {
            res = await fetch(`${baseUrl}${path}`, {
                method,
                headers: {
                    Accept: 'application/json',
                    ...(body ? { 'Content-Type': 'application/json' } : {}),
                    ...(auth && getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
                },
                body: body ? JSON.stringify(body) : undefined,
            });
        } catch {
            const err = new Error('Server unreachable');
            err.offline = true;
            throw err;
        }
        const json = await res.json().catch(() => ({}));
        return { status: res.status, json };
    }

    return {
        enroll: (body) => req('/api/pos/devices/enroll', { method: 'POST', body, auth: false }),
        heartbeat: () => req('/api/pos/heartbeat'),
        pull: () => req('/api/pos/sync/pull'),
        push: (mutations) => req('/api/pos/sync/push', { method: 'POST', body: { mutations } }),
    };
}
