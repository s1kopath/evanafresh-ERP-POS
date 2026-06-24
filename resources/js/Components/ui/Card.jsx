import { cn } from '@/lib/cn';

export default function Card({
    title,
    subtitle,
    actions,
    children,
    className,
    bodyClassName,
    padded = true,
}) {
    const hasHeader = title || subtitle || actions;
    return (
        <div className={cn('rounded-2xl border border-slate-200 bg-white shadow-sm', className)}>
            {hasHeader && (
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                    <div className="min-w-0">
                        {title && <h3 className="truncate text-sm font-bold text-brand-900">{title}</h3>}
                        {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
                    </div>
                    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
                </div>
            )}
            <div className={cn(padded && 'p-5', bodyClassName)}>{children}</div>
        </div>
    );
}
