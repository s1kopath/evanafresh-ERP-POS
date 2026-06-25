import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import StatCard from '@/Components/StatCard';
import Icon from '@/Components/Icon';

const quickActions = [
    { label: 'New Sale', href: '/pos', icon: 'pos', desc: 'Open the POS terminal' },
    { label: 'Record Purchase', href: '/purchasing', icon: 'purchasing', desc: 'Enter a supplier bill' },
    { label: 'Collect Due', href: '/ledgers/customers', icon: 'ledger-customer', desc: 'Receive a customer payment' },
    { label: 'Reorder List', href: '/inventory', icon: 'inventory', desc: 'Low-stock & reorder' },
];

const demoScenarios = [
    'Purchase entry with partial payment',
    'Product sale with customer credit / due',
    'Customer due collection',
    'Low-stock report → reorder',
    'Near-expiry report & markdown',
    'Reorder list (PDF / Excel / WhatsApp)',
    'Complete supplier ledger & statement',
    'Complete customer ledger & statement',
];

export default function Dashboard({ kpis = [], currency = 'SAR' }) {
    return (
        <AppLayout
            title="Dashboard"
            subtitle="Month-end overview · illustrative figures from the proposal"
            actions={
                <Link
                    href="/pos"
                    className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
                >
                    + New Sale
                </Link>
            }
        >
            {/* KPI grid */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {kpis.map((k) => (
                    <StatCard key={k.label} {...k} currency={currency} />
                ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                {/* Quick actions */}
                <div className="lg:col-span-2">
                    <h2 className="mb-3 text-sm font-bold text-brand-900">Quick actions</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {quickActions.map((a) => (
                            <Link
                                key={a.label}
                                href={a.href}
                                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-300 hover:shadow"
                            >
                                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                                    <Icon name={a.icon} className="h-5 w-5" />
                                </span>
                                <span>
                                    <span className="block text-sm font-semibold text-brand-900">{a.label}</span>
                                    <span className="block text-xs text-slate-500">{a.desc}</span>
                                </span>
                            </Link>
                        ))}
                    </div>

                    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        <span className="font-semibold">Phase 0 — foundation.</span> These figures and screens are
                        placeholders. Live data arrives as each module is built. See the development plan in{' '}
                        <code className="rounded bg-amber-100 px-1">docs/DEVELOPMENT-PLAN.md</code>.
                    </div>
                </div>

                {/* Demo scenarios */}
                <div>
                    <h2 className="mb-3 text-sm font-bold text-brand-900">Demo scenarios to deliver</h2>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <ul className="space-y-2">
                            {demoScenarios.map((s, i) => (
                                <li key={s} className="flex items-start gap-2 text-sm text-slate-700">
                                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
                                        {i + 1}
                                    </span>
                                    <span>{s}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
