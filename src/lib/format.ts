// Formatting utilities (client display only). Server remains source of truth for monetary/derived values.
// Date formatting keeps locale-sensitive output but can be overridden later for i18n dayjs/Intl.DateTimeFormat strategy.

export function formatDate(value: string | number | Date): string {
    try {
        const d = new Date(value);

        if (isNaN(d.getTime())) return '';

        return d.toLocaleDateString();
    } catch {
        return '';
    }
}

export function formatDateTime(value: string | number | Date): string {
    try {
        const d = new Date(value);

        if (isNaN(d.getTime())) return '';

        return d.toLocaleString();
    } catch {
        return '';
    }
}

export function formatScore(score: number | null | undefined): string {
    if (score == null) return '—';

    return `${score}`; // Suffix (점) handled by context / i18n label if needed.
}
