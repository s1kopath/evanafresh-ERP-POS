import Icon from '@/Components/Icon';
import { cn } from '@/lib/cn';

export default function EmptyState({
    icon = 'inbox',
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
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Icon name={icon} className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-700">{title}</h3>
            {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
