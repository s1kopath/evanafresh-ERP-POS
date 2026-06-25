// Offline cashier authentication. The cashier's PIN is verified LOCALLY against
// the bcrypt verifier synced into the roster — no server call. This is what lets
// the till open with no internet. (Server-side proof: PosSyncTest.php.)

import bcrypt from 'bcryptjs';

export function createAuth({ store }) {
    function login(pin) {
        for (const user of store.getRoster()) {
            if (user.pos_pin_hash && bcrypt.compareSync(String(pin), user.pos_pin_hash)) {
                const session = {
                    user_id: user.user_id,
                    name: user.name,
                    role: user.role,
                    permissions: user.permissions ?? [],
                };
                store.setKV('session', JSON.stringify(session));
                return session;
            }
        }
        const err = new Error('Invalid PIN.');
        err.code = 'invalid_pin';
        throw err;
    }

    function session() {
        const raw = store.getKV('session');
        return raw ? JSON.parse(raw) : null;
    }

    function logout() {
        store.setKV('session', null);
    }

    function can(permission) {
        const s = session();
        return !!s && (s.permissions ?? []).includes(permission);
    }

    return { login, session, logout, can };
}
