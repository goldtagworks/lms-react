/**
 * 멱등 처리 시스템 - 운영 배포용 최소 구현
 * 메모리 기반 (향후 Redis/DB 전환 예정)
 */

import { logEvent } from './log';

interface IdempotencyEntry {
    timestamp: number;
    result: any;
    status: 'success' | 'error';
}

// 메모리 캐시 (운영에서는 Redis로 대체 예정)
const idempotencyCache = new Map<string, IdempotencyEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10분

/**
 * 캐시 정리 (TTL 초과 항목 제거)
 */
function cleanupExpiredEntries(): void {
    const now = Date.now();

    for (const [key, entry] of idempotencyCache.entries()) {
        if (now - entry.timestamp > CACHE_TTL_MS) {
            idempotencyCache.delete(key);
        }
    }
}

// 5분마다 정리
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * 멱등키 생성
 */
export function generateIdempotencyKey(scope: string, identifier: string): string {
    return `${scope}:${identifier}`;
}

/**
 * 멱등 처리 실행
 */
export async function ensureIdempotent<T>(key: string, operation: () => Promise<T>, context: { user_id?: string; function_name?: string } = {}): Promise<{ cached: boolean; result: T }> {
    cleanupExpiredEntries();

    const existingEntry = idempotencyCache.get(key);

    if (existingEntry) {
        logEvent({
            level: 'info',
            event: 'idempotency_cache_hit',
            function_name: context.function_name,
            user_id: context.user_id,
            idempotency_key: key,
            cached_status: existingEntry.status
        });

        if (existingEntry.status === 'error') {
            throw new Error(existingEntry.result);
        }

        return { cached: true, result: existingEntry.result };
    }

    try {
        const result = await operation();

        // 성공 결과 캐시
        idempotencyCache.set(key, {
            timestamp: Date.now(),
            result,
            status: 'success'
        });

        logEvent({
            level: 'info',
            event: 'idempotency_operation_success',
            function_name: context.function_name,
            user_id: context.user_id,
            idempotency_key: key
        });

        return { cached: false, result };
    } catch (error) {
        // 에러도 캐시 (짧은 시간)
        idempotencyCache.set(key, {
            timestamp: Date.now(),
            result: error instanceof Error ? error.message : String(error),
            status: 'error'
        });

        logEvent({
            level: 'error',
            event: 'idempotency_operation_error',
            function_name: context.function_name,
            user_id: context.user_id,
            idempotency_key: key,
            error_code: 'E_IDEMPOTENT_OPERATION_FAILED'
        });

        throw error;
    }
}

/**
 * 특정 스코프의 멱등 캐시 클리어
 */
export function clearIdempotencyCache(scope?: string): void {
    if (scope) {
        const keysToDelete = Array.from(idempotencyCache.keys()).filter((key) => key.startsWith(`${scope}:`));

        keysToDelete.forEach((key) => idempotencyCache.delete(key));

        logEvent({
            level: 'info',
            event: 'idempotency_cache_cleared',
            scope,
            keys_cleared: keysToDelete.length
        });
    } else {
        const totalKeys = idempotencyCache.size;

        idempotencyCache.clear();

        logEvent({
            level: 'info',
            event: 'idempotency_cache_full_clear',
            keys_cleared: totalKeys
        });
    }
}

/**
 * 시험 시도용 멱등 헬퍼
 */
export function ensureExamAttemptIdempotent<T>(examId: string, userId: string, operation: () => Promise<T>): Promise<{ cached: boolean; result: T }> {
    const key = generateIdempotencyKey('exam_attempt', `${examId}_${userId}`);

    return ensureIdempotent(key, operation, {
        user_id: userId,
        function_name: 'examAttempt'
    });
}

/**
 * 수료증 발급용 멱등 헬퍼
 */
export function ensureCertificateIdempotent<T>(enrollmentId: string, operation: () => Promise<T>): Promise<{ cached: boolean; result: T }> {
    const key = generateIdempotencyKey('certificate', enrollmentId);

    return ensureIdempotent(key, operation, {
        function_name: 'certificateGeneration'
    });
}

/**
 * 결제용 멱등 헬퍼
 */
export function ensurePaymentIdempotent<T>(provider: string, providerTxId: string, operation: () => Promise<T>): Promise<{ cached: boolean; result: T }> {
    const key = generateIdempotencyKey('payment', `${provider}_${providerTxId}`);

    return ensureIdempotent(key, operation, {
        function_name: 'paymentProcessing'
    });
}
