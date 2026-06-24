/**
 * Tiny classnames joiner — merges strings/arrays and drops falsy values.
 * Usage: cn('base', condition && 'active', ['a', 'b'])
 */
export function cn(...classes) {
    return classes
        .flat(Infinity)
        .filter(Boolean)
        .join(' ');
}
