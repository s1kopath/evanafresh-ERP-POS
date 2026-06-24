import { Link, usePage } from '@inertiajs/react';

export default function NavLink({ href, icon, label, exact = false }) {
    const { url } = usePage();
    const active = exact ? url === href : url === href || url.startsWith(href + '/');

    return (
        <Link
            href={href}
            className={
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ' +
                (active
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-brand-100/80 hover:bg-brand-800/60 hover:text-white')
            }
        >
            <span className="text-base leading-none">{icon}</span>
            <span>{label}</span>
        </Link>
    );
}
