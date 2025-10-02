/**
 * 표준 로깅 시스템 - 운영 배포용 최소 구현
 * Copilot Instructions #13 준수
 */

export interface LogMeta {
    level: 'info' | 'warn' | 'error';
    event: string;
    request_id?: string;
    function_name?: string;
    user_id?: string;
    course_id?: string;
    enrollment_id?: string;
    provider?: string;
    provider_tx_id?: string;
    attempt_id?: string;
    status?: string;
    error_code?: string;
    latency_ms?: number;
    message?: string;
    [key: string]: any;
}

/**
 * 중앙화된 로깅 함수
 * 개발: console 출력
 * 운영: 외부 로그 수집 서비스 연동 준비
 */
export function logEvent(meta: LogMeta): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        ...meta,
        // 운영 환경에서 민감 정보 필터링
        ...(import.meta.env.PROD &&
            {
                // 운영에서는 스택 트레이스 등 제거 가능
            })
    };

    // 개발/테스트: console 출력
    if (import.meta.env.DEV) {
        const method = meta.level === 'error' ? 'error' : meta.level === 'warn' ? 'warn' : 'info';

        // eslint-disable-next-line no-console
        console[method]('[LOG]', logEntry);
    }

    // 운영: 외부 로그 수집 (추후 확장)
    if (import.meta.env.PROD) {
        // TODO: Sentry, DataDog, CloudWatch 등 연동
        // fetch('/api/logs', { method: 'POST', body: JSON.stringify(logEntry) });
    }
}

/**
 * 빠른 에러 로깅
 */
export function logError(error: Error | unknown, context: Partial<LogMeta> = {}): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    logEvent({
        level: 'error',
        event: 'error_occurred',
        message: errorMessage,
        error_code: 'E_RUNTIME',
        stack,
        ...context
    });
}

/**
 * 성능 측정용 로깅
 */
export function logPerformance(event: string, latency_ms: number, context: Partial<LogMeta> = {}): void {
    logEvent({
        level: 'info',
        event: `perf_${event}`,
        latency_ms,
        ...context
    });
}

/**
 * 사용자 액션 로깅
 */
export function logUserAction(action: string, context: Partial<LogMeta> = {}): void {
    logEvent({
        level: 'info',
        event: `user_${action}`,
        ...context
    });
}
