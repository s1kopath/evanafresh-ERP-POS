import { Link, usePage } from '@inertiajs/react';
import Icon from '@/Components/Icon';

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
            <Icon name={icon} className="h-4.5 w-4.5 shrink-0" />
            <span>{label}</span>
        </Link>
    );
}
