import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { cn } from '@/lib/cn';

const ToastContext = createContext(null);

let seq = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timers = useRef({});

    const dismiss = useCallback((id) => {
        setToasts((list) => list.filter((t) => t.id !== id));
        if (timers.current[id]) {
            clearTimeout(timers.current[id]);
            delete timers.current[id];
        }
    }, []);

    const push = useCallback(
        (toast) => {
            const id = (seq += 1);
            const duration = toast.duration ?? 4500;
            // Only one toast at a time — a new toast replaces the current one.
            Object.values(timers.current).forEach(clearTimeout);
            timers.current = {};
            setToasts([{ id, type: 'info', ...toast }]);
            if (duration > 0) {
                timers.current[id] = setTimeout(() => dismiss(id), duration);
            }
            return id;
        },
        [dismiss],
    );

    const api = useMemo(
        () => ({
            toast: push,
            success: (message, opts) => push({ type: 'success', message, ...opts }),
            error: (message, opts) => push({ type: 'error', message, duration: 7000, ...opts }),
            warning: (message, opts) => push({ type: 'warning', message, ...opts }),
            info: (message, opts) => push({ type: 'info', message, ...opts }),
            dismiss,
        }),
        [push, dismiss],
    );

    return (
        <ToastContext.Provider value={api}>
            {children}
            <ToastViewport toasts={toasts} onDismiss={dismiss} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
    return ctx;
}

/**
 * Bridges Laravel session flash (shared as `flash.success` / `flash.error`) to toasts.
 * Call once inside a component rendered on every page (e.g. AppLayout).
 */
export function useFlashToasts() {
    const { props } = usePage();
    const { success, error } = useToast();
    const flash = props.flash || {};
    const last = useRef({});

    useEffect(() => {
        if (flash.success && flash.success !== last.current.success) {
            success(flash.success);
            last.current.success = flash.success;
        }
        if (flash.error && flash.error !== last.current.error) {
            error(flash.error);
            last.current.error = flash.error;
        }
    }, [flash.success, flash.error, success, error]);
}

const TYPES = {
    success: { icon: '✓', ring: 'border-green-200', dot: 'bg-green-500', text: 'text-green-800' },
    error: { icon: '!', ring: 'border-red-200', dot: 'bg-red-500', text: 'text-red-800' },
    warning: { icon: '!', ring: 'border-amber-200', dot: 'bg-amber-500', text: 'text-amber-800' },
    info: { icon: 'i', ring: 'border-blue-200', dot: 'bg-blue-500', text: 'text-blue-800' },
};

function ToastViewport({ toasts, onDismiss }) {
    return (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 p-4">
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onDismiss }) {
    const style = TYPES[toast.type] || TYPES.info;
    return (
        <div
            className={cn(
                'animate-toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg',
                style.ring,
            )}
            role="status"
        >
            <span
                className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white',
                    style.dot,
                )}
            >
                {style.icon}
            </span>
            <div className="min-w-0 flex-1">
                {toast.title && <div className={cn('text-sm font-semibold', style.text)}>{toast.title}</div>}
                <div className="break-words text-sm text-slate-600">{toast.message}</div>
            </div>
            <button
                onClick={() => onDismiss(toast.id)}
                className="-mr-1 shrink-0 text-slate-400 hover:text-slate-600"
                aria-label="Dismiss"
            >
                ✕
            </button>
        </div>
    );
}
