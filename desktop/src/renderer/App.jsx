import { useEffect, useState } from 'react';
import { posApi } from './posApi';

const SAR = (minor) => (minor / 100).toFixed(2);

// No product catalogue yet (Phase 2) — a small demo set so the till is usable.
const PRODUCTS = [
    { name: 'Bananas 1kg', barcode: '6281000000017', price_minor: 700 },
    { name: 'Laban 1L', barcode: '6281000123457', price_minor: 505 },
    { name: 'Tomatoes 1kg', barcode: '6281000000031', price_minor: 650 },
    { name: 'Arabic Bread', barcode: '6281000000048', price_minor: 300 },
    { name: 'Eggs 30pc', barcode: '6281000000055', price_minor: 1800 },
    { name: 'Chicken 1kg', barcode: '6281000000062', price_minor: 2200 },
];

export default function App() {
    const [device, setDevice] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    const refresh = async () => {
        const d = await posApi.deviceStatus();
        setDevice(d);
        setSession(d.enrolled ? await posApi.session() : null);
        setLoading(false);
    };
    useEffect(() => { refresh(); }, []);

    if (loading) return null;
    if (!device?.enrolled) return <Enroll onDone={refresh} />;
    if (!session) return <Login onDone={refresh} />;
    return <Pos device={device} session={session} onLock={async () => { await posApi.logout(); refresh(); }} />;
}

function Enroll({ onDone }) {
    const [f, setF] = useState({ email: 'manager@evanafresh.com', password: 'password', terminal_id: 1 });
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true); setErr('');
        try {
            await posApi.enroll({
                email: f.email,
                password: f.password,
                deviceUid: `desktop-${crypto.randomUUID().slice(0, 12)}`,
                deviceName: 'Counter PC',
                terminalId: Number(f.terminal_id),
            });
            onDone();
        } catch (e2) {
            setErr(e2.detail?.message || e2.message);
            setBusy(false);
        }
    };

    return (
        <div className="center">
            <form className="card" onSubmit={submit}>
                <h1>Enroll this terminal</h1>
                <p className="sub">One-time setup. A manager signs in online to register this device.</p>
                <label>Manager email</label>
                <input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
                <label>Password</label>
                <input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
                <label>Terminal ID</label>
                <input value={f.terminal_id} onChange={(e) => setF({ ...f, terminal_id: e.target.value })} />
                <button className="btn" disabled={busy}>{busy ? 'Enrolling…' : 'Enroll device'}</button>
                <div className="err">{err}</div>
            </form>
        </div>
    );
}

function Login({ onDone }) {
    const [pin, setPin] = useState('');
    const [err, setErr] = useState('');

    const submit = async (value) => {
        try {
            await posApi.login(value);
            onDone();
        } catch {
            setErr('Invalid PIN'); setPin('');
        }
    };
    const tap = (d) => {
        const next = (pin + d).slice(0, 6);
        setPin(next); setErr('');
        if (next.length >= 4) submit(next);
    };

    return (
        <div className="center">
            <div className="card">
                <h1>Cashier sign in</h1>
                <p className="sub">Enter your PIN — verified on this device, works offline.</p>
                <input className="pin" value={'•'.repeat(pin.length)} readOnly placeholder="••••" />
                <div className="pad">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <button key={n} onClick={() => tap(String(n))}>{n}</button>)}
                    <button onClick={() => setPin('')}>C</button>
                    <button onClick={() => tap('0')}>0</button>
                    <button onClick={() => setPin(pin.slice(0, -1))}>⌫</button>
                </div>
                <div className="err">{err}</div>
            </div>
        </div>
    );
}

function Pos({ device, session, onLock }) {
    const [cart, setCart] = useState([]);
    const [sync, setSync] = useState({ pending: 0, synced: 0 });
    const [online, setOnline] = useState(true);
    const [flash, setFlash] = useState('');

    const pollStatus = async () => {
        setSync(await posApi.syncStatus());
    };
    useEffect(() => {
        pollStatus();
        const t = setInterval(pollStatus, 4000);
        return () => clearInterval(t);
    }, []);

    const add = (p) => setCart((c) => {
        const i = c.findIndex((x) => x.barcode === p.barcode);
        if (i >= 0) { const n = [...c]; n[i] = { ...n[i], qty: n[i].qty + 1 }; return n; }
        return [...c, { ...p, qty: 1 }];
    });

    const subtotal = cart.reduce((s, x) => s + x.price_minor * x.qty, 0);
    const vat = Math.round(subtotal * 0.15);
    const total = subtotal + vat;

    const complete = async () => {
        if (!cart.length) return;
        const sale = {
            subtotal_minor: subtotal,
            vat_minor: vat,
            total_minor: total,
            lines: cart.map((x) => ({
                name: x.name, barcode: x.barcode, qty: x.qty,
                unit_price_minor: x.price_minor, line_total_minor: x.price_minor * x.qty,
            })),
            payments: [{ method: 'cash', amount_minor: total }],
        };
        const { number } = await posApi.createSale(sale);
        setCart([]);
        setFlash(`Sale ${number} — queued locally`);
        pollStatus();
        // Try to sync immediately if online; the background timer also handles it.
        const res = await posApi.syncNow().catch(() => ({ online: false }));
        setOnline(!!res.online);
        pollStatus();
        setTimeout(() => setFlash(''), 3500);
    };

    const doSync = async () => {
        const res = await posApi.syncNow().catch(() => ({ online: false }));
        setOnline(!!res.online);
        pollStatus();
    };

    return (
        <div className="pos">
            <div className="grid">
                {PRODUCTS.map((p) => (
                    <button key={p.barcode} className="prod" onClick={() => add(p)}>
                        <b>{p.name}</b>
                        <span>SAR {SAR(p.price_minor)}</span>
                    </button>
                ))}
            </div>

            <div className="cart">
                <div className="top">
                    <span className={`pill ${online ? 'on' : 'off'}`}>{online ? 'Online' : 'Offline'}</span>
                    <span className="muted">{device.branch?.code} · {device.numberPrefix}</span>
                    <span style={{ marginLeft: 'auto' }} className="muted">{session.name}</span>
                    <button className="ghost" onClick={onLock}>Lock</button>
                </div>

                <div className="items">
                    {cart.length === 0 && <p className="muted">Tap products to add…</p>}
                    {cart.map((x) => (
                        <div className="row" key={x.barcode}>
                            <span>{x.qty} × {x.name}</span>
                            <span>SAR {SAR(x.price_minor * x.qty)}</span>
                        </div>
                    ))}
                </div>

                <div className="foot">
                    <div className="row"><span className="muted">Subtotal</span><span>SAR {SAR(subtotal)}</span></div>
                    <div className="row"><span className="muted">VAT 15%</span><span>SAR {SAR(vat)}</span></div>
                    <div className="tot"><span>Total</span><span>SAR {SAR(total)}</span></div>
                    <button className="btn" onClick={complete} disabled={!cart.length}>Take cash &amp; complete</button>
                    {flash && <p className="muted" style={{ color: '#166534' }}>{flash}</p>}
                    <p className="muted" style={{ marginTop: 8 }}>
                        Outbox: {sync.pending} pending · {sync.synced} synced ·{' '}
                        <button className="ghost" onClick={doSync}>Sync now</button>
                    </p>
                </div>
            </div>
        </div>
    );
}
