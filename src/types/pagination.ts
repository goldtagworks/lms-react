// 공통 페이지네이션 결과 타입 (서버/React Query 전환 대비)
export interface PaginatedResult<T> {
    items: T[];
    page: number; // 1-based
    pageSize: number;
    total: number; // total items count
    pageCount: number; // Math.ceil(total / pageSize)
}

export function buildPaginatedResult<T>(all: T[], page: number, pageSize: number): PaginatedResult<T> {
    const safeSize = pageSize > 0 ? pageSize : 1;
    const total = all.length;
    const pageCount = Math.max(1, Math.ceil(total / safeSize));
    const current = Math.min(Math.max(1, page), pageCount);
    const start = (current - 1) * safeSize;
    const items = all.slice(start, start + safeSize);

    return { items, page: current, pageSize: safeSize, total, pageCount };
}
