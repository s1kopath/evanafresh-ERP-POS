import { useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import NavLink from '@/Components/NavLink';
import { useFlashToasts } from '@/Components/ui/Toast';
import { cn } from '@/lib/cn';

const navSections = [
    {
        section: 'Overview',
        items: [{ label: 'Dashboard', href: '/', icon: '📊', exact: true }],
    },
    {
        section: 'Operations',
        items: [
            { label: 'POS Terminal', href: '/pos', icon: '🛒' },
            { label: 'Inventory', href: '/inventory', icon: '📦' },
            { label: 'Purchasing', href: '/purchasing', icon: '🚚' },
        ],
    },
    {
        section: 'Finance',
        items: [
            { label: 'Customer Ledger', href: '/ledgers/customers', icon: '🧾' },
            { label: 'Supplier Ledger', href: '/ledgers/suppliers', icon: '📒' },
            { label: 'Accounting', href: '/accounting', icon: '💰' },
        ],
    },
    {
        section: 'Insights',
        items: [{ label: 'Reports', href: '/reports', icon: '📈' }],
    },
    {
        section: 'Admin',
        items: [
            { label: 'Settings', href: '/settings', icon: '⚙️' },
            { label: 'UI Kit', href: '/ui-kit', icon: '🧩' },
        ],
    },
];

export default function AppLayout({ title, subtitle, actions, children }) {
    const [open, setOpen] = useState(false);
    useFlashToasts();

    // Close the mobile drawer whenever a navigation starts.
    useEffect(() => router.on('start', () => setOpen(false)), []);

    // Close the mobile drawer on Escape.
    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50">
            {title && <Head title={title} />}

            {/* Mobile backdrop */}
            {open && (
                <div
                    className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
                    onClick={() => setOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar — static on lg, off-canvas drawer below lg */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-brand-900 text-white transition-transform duration-200 lg:translate-x-0',
                    open ? 'translate-x-0' : '-translate-x-full',
                )}
            >
                <div className="flex items-center gap-3 px-5 py-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-xl">
                        🥬
                    </div>
                    <div className="leading-tight">
                        <div className="text-sm font-extrabold tracking-wide">Evana Fresh</div>
                        <div className="text-[10px] uppercase tracking-[0.15em] text-brand-200/70">ERP &amp; POS</div>
                    </div>
                    <button
                        className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-brand-200/70 hover:bg-brand-800/60 hover:text-white lg:hidden"
                        onClick={() => setOpen(false)}
                        aria-label="Close menu"
                    >
                        ✕
                    </button>
                </div>

                <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
                    {navSections.map((group) => (
                        <div key={group.section}>
                            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-200/50">
                                {group.section}
                            </div>
                            <div className="space-y-1">
                                {group.items.map((item) => (
                                    <NavLink key={item.href} {...item} />
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="border-t border-brand-800/60 px-5 py-3 text-[10px] uppercase tracking-[0.15em] text-brand-200/50">
                    EIBMS · Phase 0 — Foundation
                </div>
            </aside>

            {/* Main */}
            <div className="lg:pl-64">
                {/* Topbar */}
                <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
                    <button
                        className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
                        onClick={() => setOpen(true)}
                        aria-label="Open menu"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <div className="min-w-0 flex-1">
                        <h1 className="truncate text-base font-bold text-brand-900 sm:text-lg">{title}</h1>
                        {subtitle && <p className="hidden truncate text-xs text-slate-500 sm:block">{subtitle}</p>}
                    </div>

                    {actions && <div className="flex items-center gap-2">{actions}</div>}

                    {/* Branch + user placeholders (auth/branches arrive in Phase 1) */}
                    <div className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 md:flex">
                        <span>🏬</span>
                        <span className="font-medium">Branch 1 — Jeddah</span>
                    </div>
                    <Link
                        href="/ui-kit"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700"
                        aria-label="Account (placeholder)"
                    >
                        EF
                    </Link>
                </header>

                <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">{children}</main>
            </div>
        </div>
    );
}
