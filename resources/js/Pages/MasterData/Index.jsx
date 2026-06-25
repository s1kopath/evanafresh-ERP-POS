import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import MasterDataTabs from '@/Components/MasterDataTabs';
import Icon from '@/Components/Icon';
import { formatNumber } from '@/lib/format';

export default function MasterDataIndex({ sections = [] }) {
    return (
        <AppLayout title="Master Data" subtitle="The catalogue & parties every transaction depends on">
            <MasterDataTabs />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sections.map((s) => (
                    <Link
                        key={s.key}
                        href={s.href}
                        className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                                <Icon name={s.icon} className="h-6 w-6" />
                            </div>
                            <span className="text-2xl font-extrabold text-brand-900">
                                {formatNumber(s.count)}
                            </span>
                        </div>
                        <h3 className="mt-3 text-sm font-bold text-slate-800 group-hover:text-brand-700">
                            {s.label}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500">{s.desc}</p>
                    </Link>
                ))}
            </div>
        </AppLayout>
    );
}
