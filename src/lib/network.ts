/**
 * 네트워크 에러 처리 및 재시도 정책
 * 운영 배포용 최소 안전장치
 */

import { logError, logPerformance } from './log';

export interface RetryConfig {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
}

const defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2
};

/**
 * 지수 백오프로 재시도하는 fetch 래퍼
 */
export async function fetchWithRetry(url: string, options: RequestInit = {}, retryConfig: Partial<RetryConfig> = {}): Promise<Response> {
    const config = { ...defaultRetryConfig, ...retryConfig };
    const startTime = Date.now();

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
        try {
            const response = await fetch(url, {
                ...options,
                // 기본 타임아웃 설정
                signal: options.signal || AbortSignal.timeout(30000)
            });

            const latency = Date.now() - startTime;

            // 성공 로깅
            logPerformance('fetch_success', latency, {
                function_name: 'fetchWithRetry',
                status: response.status.toString(),
                attempt: attempt.toString(),
                url
            });

            return response;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            // 마지막 시도가 아니면 재시도
            if (attempt < config.maxAttempts) {
                const delay = Math.min(config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt - 1), config.maxDelayMs);

                logError(lastError, {
                    function_name: 'fetchWithRetry',
                    event: 'fetch_retry',
                    attempt: attempt.toString(),
                    delay_ms: delay,
                    url
                });

                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }

    // 모든 재시도 실패
    const latency = Date.now() - startTime;

    logError(lastError!, {
        function_name: 'fetchWithRetry',
        event: 'fetch_failed_all_attempts',
        attempts: config.maxAttempts.toString(),
        latency_ms: latency,
        url
    });

    throw lastError!;
}

/**
 * 네트워크 에러 분류
 */
export function classifyNetworkError(error: unknown): {
    type: 'network' | 'timeout' | 'abort' | 'parse' | 'unknown';
    retryable: boolean;
} {
    if (error instanceof TypeError && error.message.includes('fetch')) {
        return { type: 'network', retryable: true };
    }

    if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
            return { type: 'timeout', retryable: true };
        }
        if (error.name === 'AbortError') {
            return { type: 'abort', retryable: false };
        }
        if (error.message.includes('JSON')) {
            return { type: 'parse', retryable: false };
        }
    }

    return { type: 'unknown', retryable: false };
}

/**
 * 사용자 친화적 네트워크 에러 메시지
 */
export function getNetworkErrorMessage(error: unknown): string {
    const classification = classifyNetworkError(error);

    switch (classification.type) {
        case 'network':
            return '네트워크 연결을 확인해주세요. 잠시 후 다시 시도해주세요.';
        case 'timeout':
            return '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
        case 'abort':
            return '요청이 취소되었습니다.';
        case 'parse':
            return '데이터 처리 중 오류가 발생했습니다.';
        default:
            return '일시적인 오류가 발생했습니다. 계속되면 고객센터로 문의해주세요.';
    }
}
