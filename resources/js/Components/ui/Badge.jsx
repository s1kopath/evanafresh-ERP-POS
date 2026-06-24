import { cn } from '@/lib/cn';

const variants = {
    neutral: 'bg-slate-100 text-slate-600',
    brand: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
    success: 'bg-green-50 text-green-700 ring-1 ring-green-200',
    warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    danger: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
};

export default function Badge({ children, variant = 'neutral', dot = false, className }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                variants[variant],
                className,
            )}
        >
            {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
            {children}
        </span>
    );
}
