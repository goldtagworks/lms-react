import { Group, Button, Text } from '@mantine/core';

interface PaginationBarProps {
    page: number;
    totalPages: number;
    size?: 'xs' | 'sm' | 'md';
    onChange: (page: number) => void;
    align?: 'left' | 'right' | 'center';
}

/** 공통 페이지네이션 바 (단순 Prev/Next + 현재/전체) */
export function PaginationBar({ page, totalPages, onChange, size = 'xs', align = 'right' }: PaginationBarProps) {
    if (totalPages <= 1) return null;

    const justify = align === 'left' ? 'flex-start' : align === 'center' ? 'center' : 'flex-end';

    return (
        <Group gap="xs" justify={justify} mt="md">
            <Button disabled={page === 1} size={size} variant="light" onClick={() => onChange(Math.max(1, page - 1))}>
                이전
            </Button>
            <Text size={size}>
                {page} / {totalPages}
            </Text>
            <Button disabled={page === totalPages} size={size} variant="light" onClick={() => onChange(Math.min(totalPages, page + 1))}>
                다음
            </Button>
        </Group>
    );
}

export default PaginationBar;
