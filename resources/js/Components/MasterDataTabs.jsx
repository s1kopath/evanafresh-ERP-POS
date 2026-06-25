import { Link, usePage } from '@inertiajs/react';
import { cn } from '@/lib/cn';

// Catalogue tabs now; parties (Customers/Suppliers/Employees) are added in Wave B.
const tabs = [
    { label: 'Overview', href: '/master-data', exact: true },
    { label: 'Products', href: '/master-data/products' },
    { label: 'Categories', href: '/master-data/categories' },
    { label: 'Units', href: '/master-data/units' },
    { label: 'Customers', href: '/master-data/customers' },
    { label: 'Suppliers', href: '/master-data/suppliers' },
    { label: 'Employees', href: '/master-data/employees' },
    { label: 'Import', href: '/master-data/import' },
];

export default function MasterDataTabs() {
    const url = usePage().url.split('?')[0];

    return (
        <div className="mb-5 flex flex-wrap gap-1 border-b border-slate-200">
            {tabs.map((t) => {
                const active = t.exact ? url === t.href : url.startsWith(t.href);
                return (
                    <Link
                        key={t.href}
                        href={t.href}
                        className={cn(
                            '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition',
                            active
                                ? 'border-brand-600 text-brand-700'
                                : 'border-transparent text-slate-500 hover:text-slate-700',
                        )}
                    >
                        {t.label}
                    </Link>
                );
            })}
        </div>
    );
}
