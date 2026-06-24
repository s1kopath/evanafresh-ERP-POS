import { cn } from '@/lib/cn';

export function Skeleton({ className }) {
    return <div className={cn('animate-pulse rounded-md bg-slate-200', className)} />;
}

export function SkeletonText({ lines = 3, className }) {
    return (
        <div className={cn('space-y-2', className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton key={i} className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')} />
            ))}
        </div>
    );
}

export function SkeletonCard({ className }) {
    return (
        <div className={cn('rounded-2xl border border-slate-200 bg-white p-5 shadow-sm', className)}>
            <Skeleton className="h-4 w-1/3" />
            <div className="mt-4">
                <SkeletonText lines={3} />
            </div>
        </div>
    );
}

export function SkeletonTable({ rows = 5, cols = 4, className }) {
    return (
        <div className={cn('overflow-hidden rounded-2xl border border-slate-200 bg-white', className)}>
            <div className="border-b border-slate-100 bg-slate-50 p-3">
                <Skeleton className="h-4 w-1/4" />
            </div>
            <div className="divide-y divide-slate-100">
                {Array.from({ length: rows }).map((_, r) => (
                    <div key={r} className="flex items-center gap-4 p-3">
                        {Array.from({ length: cols }).map((_, c) => (
                            <Skeleton key={c} className={cn('h-3', c === 0 ? 'w-1/4' : 'flex-1')} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Skeleton;
