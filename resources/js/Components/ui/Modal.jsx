import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import Button from './Button';

const sizes = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' };

export default function Modal({ open, onClose, title, children, footer, size = 'md', closeOnBackdrop = true }) {
    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={closeOnBackdrop ? onClose : undefined}
                aria-hidden="true"
            />
            <div
                role="dialog"
                aria-modal="true"
                className={cn(
                    'animate-toast-in relative z-10 flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl',
                    sizes[size],
                )}
            >
                {title && (
                    <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                        <h3 className="text-base font-bold text-brand-900">{title}</h3>
                        <button
                            onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}
                <div className="overflow-y-auto px-5 py-4">{children}</div>
                {footer && (
                    <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

export function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title = 'Are you sure?',
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    danger = true,
    loading = false,
}) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        {cancelText}
                    </Button>
                    <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
                        {confirmText}
                    </Button>
                </>
            }
        >
            {description && <p className="text-sm text-slate-600">{description}</p>}
        </Modal>
    );
}
