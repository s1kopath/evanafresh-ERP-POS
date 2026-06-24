import { cn } from '@/lib/cn';
import Spinner from './Spinner';

const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition select-none ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ' +
    'disabled:opacity-50 disabled:pointer-events-none';

const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    ghost: 'text-slate-600 hover:bg-slate-100',
    subtle: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
};

const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-5 text-base',
    icon: 'h-10 w-10',
};

/** Shared class string — use for Inertia <Link> styled as a button. */
export function buttonVariants({ variant = 'primary', size = 'md', className } = {}) {
    return cn(base, variants[variant], sizes[size], className);
}

export default function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    type = 'button',
    className,
    children,
    ...props
}) {
    return (
        <button
            type={type}
            disabled={disabled || loading}
            className={buttonVariants({ variant, size, className })}
            {...props}
        >
            {loading && <Spinner size="sm" />}
            {children}
        </button>
    );
}
