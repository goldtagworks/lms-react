export function formatPrice(value: number): string {
    return `${value.toLocaleString()}원`;
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
