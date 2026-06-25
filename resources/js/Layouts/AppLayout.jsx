import { useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import NavLink from '@/Components/NavLink';
import Icon from '@/Components/Icon';
import { useFlashToasts } from '@/Components/ui/Toast';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/cn';

const navSections = [
    {
        section: 'Overview',
        items: [{ label: 'Dashboard', href: '/', icon: 'dashboard', exact: true }],
    },
    {
        section: 'Operations',
        items: [
            { label: 'POS Terminal', href: '/pos', icon: 'pos', perm: 'pos.sell' },
            { label: 'Inventory', href: '/inventory', icon: 'inventory', perm: 'inventory.view' },
            { label: 'Expiry', href: '/expiry', icon: 'expiry', perm: 'expiry.view' },
            { label: 'Purchasing', href: '/purchasing', icon: 'purchasing', perm: 'purchasing.view' },
            { label: 'Reorder', href: '/reorder', icon: 'reorder', perm: 'reorder.view' },
        ],
    },
    {
        section: 'Finance',
        items: [
            { label: 'Customer Ledger', href: '/ledgers/customers', icon: 'ledger-customer', perm: 'ledgers.view' },
            { label: 'Supplier Ledger', href: '/ledgers/suppliers', icon: 'ledger-supplier', perm: 'ledgers.view' },
            { label: 'Accounting', href: '/accounting', icon: 'accounting', perm: 'accounting.view' },
            { label: 'Payroll', href: '/payroll', icon: 'payroll', perm: 'payroll.manage' },
        ],
    },
    {
        section: 'Insights',
        items: [{ label: 'Reports', href: '/reports', icon: 'reports', perm: 'reports.view' }],
    },
    {
        section: 'Admin',
        items: [
            { label: 'Master Data', href: '/master-data', icon: 'master-data', perm: 'masterdata.manage' },
            { label: 'Branches', href: '/branches', icon: 'branches', perm: 'branches.manage' },
            { label: 'Settings', href: '/settings', icon: 'settings', perm: 'settings.manage' },
            { label: 'UI Kit', href: '/ui-kit', icon: 'ui-kit', ownerOnly: true },
        ],
    },
];

function initialsOf(name) {
    return (name || 'EF')
        .split(' ')
        .map((s) => s[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export default function AppLayout({ title, subtitle, actions, children }) {
    const [open, setOpen] = useState(false);
    const [userMenu, setUserMenu] = useState(false);
    const { user, can, isOwner } = useAuth();
    const { branches = [], currentBranch } = usePage().props;
    useFlashToasts();

    // Close the drawer + user menu whenever a navigation starts.
    useEffect(() => router.on('start', () => { setOpen(false); setUserMenu(false); }), []);

    // Close overlays on Escape.
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') { setOpen(false); setUserMenu(false); }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    const sections = navSections
        .map((g) => ({
            ...g,
            items: g.items.filter((it) => (!it.perm || can(it.perm)) && (!it.ownerOnly || isOwner)),
        }))
        .filter((g) => g.items.length > 0);

    const switchBranch = (value) =>
        router.post('/branch/switch', { branch_id: value || null }, { preserveScroll: true });

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
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
                        <Icon name="brand" className="h-6 w-6" />
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
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
                    {sections.map((group) => (
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

                {/* Branch context for phones — the topbar switcher is hidden below md. */}
                <div className="border-t border-brand-800/60 px-3 py-3 md:hidden">
                    <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-200/50">
                        Branch
                    </div>
                    {isOwner ? (
                        <select
                            value={currentBranch ?? ''}
                            onChange={(e) => switchBranch(e.target.value)}
                            className="w-full rounded-lg border border-brand-700 bg-brand-800 px-2 py-2 text-sm font-medium text-white"
                            aria-label="Switch branch"
                        >
                            <option value="">All branches</option>
                            {branches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.code} — {b.name}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div className="flex items-center gap-2 rounded-lg border border-brand-700 px-3 py-2 text-sm text-brand-100">
                            <Icon name="store" className="h-4 w-4" />
                            <span className="font-medium">
                                {user?.branch ? `${user.branch.code} — ${user.branch.name}` : '—'}
                            </span>
                        </div>
                    )}
                </div>

                <div className="border-t border-brand-800/60 px-5 py-3 text-[10px] uppercase tracking-[0.15em] text-brand-200/50">
                    EIBMS · Phase 2 — Master Data
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
                        <Menu className="h-5 w-5" />
                    </button>

                    <div className="min-w-0 flex-1">
                        <h1 className="truncate text-base font-bold text-brand-900 sm:text-lg">{title}</h1>
                        {subtitle && <p className="hidden truncate text-xs text-slate-500 sm:block">{subtitle}</p>}
                    </div>

                    {actions && <div className="flex items-center gap-2">{actions}</div>}

                    {/* Branch context — switcher for owners, fixed chip otherwise */}
                    {isOwner ? (
                        <select
                            value={currentBranch ?? ''}
                            onChange={(e) => switchBranch(e.target.value)}
                            className="hidden rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 md:block"
                            aria-label="Switch branch"
                        >
                            <option value="">All branches</option>
                            {branches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.code} — {b.name}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 md:flex">
                            <Icon name="store" className="h-4 w-4" />
                            <span className="font-medium">
                                {user?.branch ? `${user.branch.code} — ${user.branch.name}` : '—'}
                            </span>
                        </div>
                    )}

                    {/* User menu */}
                    <div className="relative">
                        <button
                            onClick={() => setUserMenu((o) => !o)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700"
                            aria-label="Account menu"
                        >
                            {initialsOf(user?.name)}
                        </button>

                        {userMenu && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setUserMenu(false)} aria-hidden="true" />
                                <div className="absolute right-0 z-40 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                                    <div className="px-3 py-2">
                                        <div className="truncate text-sm font-semibold text-slate-800">{user?.name}</div>
                                        <div className="truncate text-xs text-slate-500">{user?.email}</div>
                                        {user?.role && (
                                            <span className="mt-1.5 inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                                                {user.role}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => router.post('/logout')}
                                        className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">{children}</main>
            </div>
        </div>
    );
}
