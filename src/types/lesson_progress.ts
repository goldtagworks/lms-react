/**
 * 레슨 진도(수강생별 레슨별 진도/완료)
 */
export interface LessonProgress {
    /** 진도 고유 ID */
    id: string;
    /** 수강신청 ID */
    enrollment_id: string;
    /** 레슨 ID */
    lesson_id: string;
    /** 시청 시간(초) */
    watched_seconds: number;
    /** 완료 여부 */
    is_completed: boolean;
    /** 생성일 */
    created_at: string;
    /** 수정일 */
    updated_at: string;
}
