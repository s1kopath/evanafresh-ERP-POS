import { cn } from '@/lib/cn';

export default function EmptyState({
    icon = '📭',
    title = 'Nothing here yet',
    description,
    action,
    className,
}) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center',
                className,
            )}
        >
            <div className="text-4xl">{icon}</div>
            <h3 className="mt-3 text-sm font-bold text-slate-700">{title}</h3>
            {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
