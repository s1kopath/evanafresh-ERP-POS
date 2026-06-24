const toneStyles = {
    brand: 'text-brand-700',
    slate: 'text-slate-700',
    amber: 'text-amber-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
};

export default function StatCard({ label, value, currency, tone = 'slate' }) {
    const formatted = typeof value === 'number' ? new Intl.NumberFormat('en-US').format(value) : value;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
            <div className={'mt-1 text-2xl font-extrabold ' + (toneStyles[tone] || toneStyles.slate)}>
                {formatted}
                {currency && <span className="ml-1 text-xs font-medium text-slate-400">{currency}</span>}
            </div>
        </div>
    );
}
