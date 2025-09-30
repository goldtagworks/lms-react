// 공통 페이지네이션 유틸 (중복 제거)
// 규칙: page는 1-base, pageSize > 0 가정

export interface PagedBuildParams<T> {
    items: T[];
    count?: number | null; // 서버 count 값 (없으면 items.length 사용)
    page: number;
    pageSize: number;
}

export interface PaginatedResult<T> {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
}

export function computeRange(page: number, pageSize: number) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    return { from, to };
}

export function buildPagedResult<T>({ items, count, page, pageSize }: PagedBuildParams<T>): PaginatedResult<T> {
    const total = count ?? items.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, pageCount);

    return { items, page: safePage, pageSize, total, pageCount };
}

export function emptyPage<T>(pageSize: number): PaginatedResult<T> {
    return { items: [], page: 1, pageSize, total: 0, pageCount: 1 };
}
