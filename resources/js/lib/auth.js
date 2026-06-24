import { usePage } from '@inertiajs/react';

/**
 * Auth + permission helper, backed by Inertia shared props (HandleInertiaRequests).
 *
 *   const { user, can, isOwner } = useAuth();
 *   {can('pos.sell') && <SellButton />}
 *
 * Owners implicitly hold every permission.
 */
export function useAuth() {
    const { auth } = usePage().props;
    const user = auth?.user ?? null;
    const permissions = user?.permissions ?? [];

    const can = (permission) => !!user && (user.is_owner || permissions.includes(permission));

    return { user, can, isOwner: !!user?.is_owner };
}
