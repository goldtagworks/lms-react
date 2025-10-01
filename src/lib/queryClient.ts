import { QueryClient } from '@tanstack/react-query';

// HMR 안전 전역 싱글턴 (브라우저 탭 내 재사용)
const g = globalThis as unknown as { __RQ_CLIENT__?: QueryClient };

export const queryClient: QueryClient =
    g.__RQ_CLIENT__ ||
    new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 30_000,
                refetchOnWindowFocus: false,
                retry: 1
            }
        }
    });

if (!g.__RQ_CLIENT__) {
    g.__RQ_CLIENT__ = queryClient;
}
