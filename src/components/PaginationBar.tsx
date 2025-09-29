import { Group, Button, Text } from '@mantine/core';
import { useI18n } from '@main/lib/i18n';

interface PaginationBarProps {
    page: number;
    totalPages: number;
    size?: 'xs' | 'sm' | 'md';
    onChange: (page: number) => void;
    align?: 'left' | 'right' | 'center';
}

/** 공통 페이지네이션 바 (단순 Prev/Next + 현재/전체) */
export function PaginationBar({ page, totalPages, onChange, size = 'xs', align = 'right' }: PaginationBarProps) {
    const { t } = useI18n();

    if (totalPages <= 1) return null;

    const justify = align === 'left' ? 'flex-start' : align === 'center' ? 'center' : 'flex-end';

    return (
        <Group gap="xs" justify={justify} mt="md">
            <Button aria-label={t('pagination.prev')} disabled={page === 1} size={size} variant="light" onClick={() => onChange(Math.max(1, page - 1))}>
                {t('pagination.prev')}
            </Button>
            <Text size={size}>
                {page} / {totalPages}
            </Text>
            <Button aria-label={t('pagination.next')} disabled={page === totalPages} size={size} variant="light" onClick={() => onChange(Math.min(totalPages, page + 1))}>
                {t('pagination.next')}
            </Button>
        </Group>
    );
}

export default PaginationBar;
