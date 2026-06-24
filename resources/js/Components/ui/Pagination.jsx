import { Link } from '@inertiajs/react';
import { cn } from '@/lib/cn';

/**
 * Renders a Laravel paginator `links` array (each: { url, label, active }).
 * Usage: <Pagination links={items.links} />  (where `items` is a paginator).
 */
export default function Pagination({ links, className }) {
    if (!links || links.length <= 3) return null;

    return (
        <nav className={cn('flex flex-wrap items-center gap-1', className)} aria-label="Pagination">
            {links.map((link, i) =>
                link.url ? (
                    <Link
                        key={i}
                        href={link.url}
                        preserveScroll
                        preserveState
                        className={cn(
                            'inline-flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-sm transition',
                            link.active
                                ? 'bg-brand-600 text-white'
                                : 'text-slate-600 hover:bg-slate-100',
                        )}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ) : (
                    <span
                        key={i}
                        className="inline-flex h-9 min-w-9 items-center justify-center px-3 text-sm text-slate-300"
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ),
            )}
        </nav>
    );
}
