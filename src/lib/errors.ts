// 공통 에러 매퍼 (Edge 에러 포맷 { code, message } 정렬 목적)

export interface AppError extends Error {
    code: string;
    cause?: any;
}

function createAppError(code: string, message: string, cause?: any): AppError {
    const err = new Error(message) as AppError;

    err.code = code;
    if (cause) err.cause = cause;

    return err;
}

// Supabase/PostgREST 오류 → 내부 코드 매핑
export function mapSupabaseError(e: any): AppError {
    // 이미 AppError 형태면 그대로 반환
    if (e && typeof e === 'object' && 'code' in e && 'message' in e && !(e instanceof Response)) {
        return e as AppError;
    }

    // Supabase 포맷: { message, details, hint, code }
    if (e && typeof e === 'object' && 'code' in e && 'message' in e) {
        const pgCode = (e as any).code as string | undefined; // PostgREST/PG error code
        const msg = (e as any).message as string | undefined;
        // 세분화 규칙
        //  23505: unique_violation → E_DUP_KEY
        //  23503: foreign_key_violation → E_FK_CONSTRAINT
        //  23502: not_null_violation → E_NOT_NULL
        //  22P02: invalid_text_representation (uuid parse 등) → E_INVALID_INPUT
        //  PGRST116: column does not exist / malformed order by → E_QUERY_SYNTAX
        //  Check constraint 이름 기반: rating 범위, etc → E_VALIDATION_<NAME>
        //  default → E_DB_QUERY
        let code = 'E_DB_QUERY';

        if (pgCode === '23505') code = 'E_DUP_KEY';
        else if (pgCode === '23503') code = 'E_FK_CONSTRAINT';
        else if (pgCode === '23502') code = 'E_NOT_NULL';
        else if (pgCode === '22P02') code = 'E_INVALID_INPUT';
        else if (pgCode === 'PGRST116') code = 'E_QUERY_SYNTAX';
        else if (pgCode === '23514') {
            // check constraint violation → 세부 constraint 이름에서 의미 추출
            const details = (e as any).details as string | undefined;

            if (details && /rating/i.test(details)) code = 'E_VALIDATION_RATING';
            else code = 'E_VALIDATION_CHECK';
        }
        // Not Found 패턴: PostgREST는 empty set을 error로 보내지 않음. 하지만 특정 메시지 패턴 필터링 가능
        if (msg && /not found/i.test(msg) && code === 'E_DB_QUERY') code = 'E_NOT_FOUND';

        return createAppError(code, msg || 'Database query error', e);
    }

    // Fetch/네트워크 계열
    if (e && typeof e === 'object' && ('status' in e || e?.name === 'TypeError')) {
        return createAppError('E_NETWORK', 'Network error', e);
    }

    return createAppError('E_UNKNOWN', e?.message || 'Unknown error', e);
}
