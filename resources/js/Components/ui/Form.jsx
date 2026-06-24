import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

const controlBase =
    'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 shadow-sm ' +
    'placeholder:text-slate-400 transition focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 ' +
    'disabled:bg-slate-50 disabled:text-slate-400';

export function controlClasses(error, className) {
    return cn(controlBase, error ? 'border-red-400' : 'border-slate-300', className);
}

export function Label({ children, htmlFor, required, className }) {
    return (
        <label htmlFor={htmlFor} className={cn('mb-1 block text-sm font-medium text-slate-700', className)}>
            {children}
            {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
    );
}

export function InputError({ message, className }) {
    if (!message) return null;
    return <p className={cn('mt-1 text-xs text-red-600', className)}>{message}</p>;
}

export const Input = forwardRef(function Input({ error, className, type = 'text', ...props }, ref) {
    return <input ref={ref} type={type} className={controlClasses(error, className)} {...props} />;
});

export const Textarea = forwardRef(function Textarea({ error, className, rows = 3, ...props }, ref) {
    return <textarea ref={ref} rows={rows} className={controlClasses(error, className)} {...props} />;
});

export const Select = forwardRef(function Select({ error, className, children, ...props }, ref) {
    return (
        <select ref={ref} className={controlClasses(error, cn('pr-8', className))} {...props}>
            {children}
        </select>
    );
});

/**
 * Label + control + error wrapper. Pass the control as children, e.g.:
 *   <FormField label="Name" htmlFor="name" error={errors.name} required>
 *     <Input id="name" value={data.name} onChange={...} error={errors.name} />
 *   </FormField>
 */
export function FormField({ label, htmlFor, required, error, hint, className, children }) {
    return (
        <div className={cn('space-y-0', className)}>
            {label && (
                <Label htmlFor={htmlFor} required={required}>
                    {label}
                </Label>
            )}
            {children}
            {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
            <InputError message={error} />
        </div>
    );
}
