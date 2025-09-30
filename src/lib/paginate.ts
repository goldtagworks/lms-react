import type { PaginatedResult } from '@main/types/pagination';

// Generic in-memory pagination helper (클라이언트 전용)
export function paginateArray<T>(items: readonly T[], page: number, pageSize: number): PaginatedResult<T> {
    const total = items.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), pageCount);
    const start = (safePage - 1) * pageSize;
    const sliced = items.slice(start, start + pageSize);

    return { items: sliced, page: safePage, pageSize, total, pageCount };
}

export function clampPage(page: number, pageCount: number) {
    return Math.min(Math.max(1, page), Math.max(1, pageCount));
}
