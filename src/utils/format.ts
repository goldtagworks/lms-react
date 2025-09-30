import { t } from '@main/lib/i18n';

export function formatPrice(value: number): string {
    const formatted = value.toLocaleString();

    return t('price.currencyWon', { value: formatted }, `${formatted}원`);
}

export function formatDate(iso: string): string {
    try {
        const d = new Date(iso);

        if (Number.isNaN(d.getTime())) return iso;

        return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
        return iso;
    }
}
