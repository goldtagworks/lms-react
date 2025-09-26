/**
 * 수강신청 상태
 */
export const EnrollmentStatus = ['PENDING', 'ENROLLED', 'CANCELLED'] as const;
/**
 * 수강신청 상태 타입
 */
export type EnrollmentStatus = (typeof EnrollmentStatus)[number];

/**
 * 수강신청 경로
 */
export const EnrollmentSource = ['purchase', 'admin', 'free'] as const;
/**
 * 수강신청 경로 타입
 */
export type EnrollmentSource = (typeof EnrollmentSource)[number];

/**
 * 수강신청 정보
 */
export interface Enrollment {
    /** 수강신청 고유 ID */
    id: string;
    /** 사용자 ID */
    user_id: string;
    /** 코스 ID */
    course_id: string;
    /** 상태(PENDING|ENROLLED|CANCELLED) */
    status: EnrollmentStatus;
    /** 신청 경로 */
    source: EnrollmentSource;
    /** 결제 ID(옵션) */
    payment_id?: string;
    /** 수강 시작일(옵션) */
    started_at?: string;
    /** 수강 완료일(옵션) */
    completed_at?: string;
    /** 생성일 */
    created_at: string;
    /** 수정일(옵션) */
    updated_at?: string;
}
