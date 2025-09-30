// 객체 키 순서를 안정화하여 React Query key 캐시 일관성 확보
// (동일 의미의 다른 키 순서로 다른 캐시 엔트리 생성되는 문제 방지)

export function stableFilters<T extends Record<string, any>>(obj: T): T {
    const entries = Object.entries(obj).filter(([, v]) => v !== undefined);

    entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

    return entries.reduce((acc, [k, v]) => {
        (acc as any)[k] = v;

        return acc;
    }, {} as T);
}
