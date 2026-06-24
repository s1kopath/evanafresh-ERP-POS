/**
 * Shared formatting helpers. English (en-US) only — no localization.
 * Money is SAR by default. Pass amounts as numbers (or numeric strings).
 */

export function formatNumber(value, decimals = 0) {
    const n = Number(value ?? 0);
    if (Number.isNaN(n)) return '0';
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(n);
}

export function formatMoney(value, { currency = 'SAR', decimals = 2 } = {}) {
    const amount = formatNumber(value, decimals);
    return currency ? `${amount} ${currency}` : amount;
}

export function formatDate(value, opts = { year: 'numeric', month: 'short', day: '2-digit' }) {
    if (!value) return '—';
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('en-US', opts).format(d);
}

export function formatDateTime(value) {
    return formatDate(value, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function pluralize(count, singular, plural) {
    return Number(count) === 1 ? singular : (plural ?? `${singular}s`);
}
