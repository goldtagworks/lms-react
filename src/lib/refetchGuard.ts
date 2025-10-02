/**
 * React Query 과부하 방지 시스템
 * Copilot Instructions #17 준수
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { logEvent } from './log';

interface QueryStats {
    key: string;
    count: number;
    lastRefetch: number;
    windowStart: number;
}

// 5분 윈도우 내 refetch 통계
const refetchStats = new Map<string, QueryStats>();
const WINDOW_MS = 5 * 60 * 1000; // 5분
const MAX_REFETCHES = 5; // 5분 내 최대 5회

/**
 * 쿼리 키를 문자열로 정규화
 */
function normalizeQueryKey(queryKey: unknown[]): string {
    return JSON.stringify(queryKey);
}

/**
 * 과도한 refetch 감지
 */
function checkRefetchRate(queryKey: string): boolean {
    const now = Date.now();
    const existing = refetchStats.get(queryKey);

    if (!existing) {
        refetchStats.set(queryKey, {
            key: queryKey,
            count: 1,
            lastRefetch: now,
            windowStart: now
        });

        return false;
    }

    // 윈도우 리셋 체크
    if (now - existing.windowStart > WINDOW_MS) {
        refetchStats.set(queryKey, {
            key: queryKey,
            count: 1,
            lastRefetch: now,
            windowStart: now
        });

        return false;
    }

    // 카운트 증가
    existing.count++;
    existing.lastRefetch = now;

    // 임계치 초과 시 경고
    if (existing.count > MAX_REFETCHES) {
        logEvent({
            level: 'warn',
            event: 'query_refetch_excessive',
            function_name: 'useRefetchGuard',
            query_key: queryKey,
            refetch_count: existing.count,
            window_duration_ms: now - existing.windowStart,
            message: `Excessive refetches detected for query: ${queryKey}`
        });

        return true;
    }

    return false;
}

/**
 * React Query refetch 가드 훅
 */
export function useRefetchGuard(): void {
    const queryClient = useQueryClient();

    useEffect(() => {
        const cache = queryClient.getQueryCache();

        // Query 구독으로 refetch 감지
        const unsubscribe = cache.subscribe((event) => {
            if (event.type === 'observerAdded') {
                const query = event.query;

                // 기본적인 과도한 refetch 방지만 구현
                const queryKey = normalizeQueryKey(query.queryKey);

                checkRefetchRate(queryKey);
            }
        });

        return unsubscribe;
    }, [queryClient]);
}

/**
 * 통계 정리 (메모리 리크 방지)
 */
function cleanupStats(): void {
    const now = Date.now();

    for (const [key, stats] of refetchStats.entries()) {
        if (now - stats.windowStart > WINDOW_MS * 2) {
            refetchStats.delete(key);
        }
    }
}

// 10분마다 정리
setInterval(cleanupStats, 10 * 60 * 1000);

/**
 * 현재 refetch 통계 조회 (디버깅용)
 */
export function getRefetchStats(): QueryStats[] {
    return Array.from(refetchStats.values());
}

/**
 * 특정 쿼리의 refetch 통계 리셋
 */
export function resetQueryStats(queryKey: unknown[]): void {
    const normalizedKey = normalizeQueryKey(queryKey);

    refetchStats.delete(normalizedKey);

    logEvent({
        level: 'info',
        event: 'query_stats_reset',
        query_key: normalizedKey
    });
}
