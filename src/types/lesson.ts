/**
 * 레슨(강의 내 개별 학습 단위)
 */
export interface Lesson {
    /** 레슨 고유 ID */
    id: string;
    /** 코스 ID */
    course_id: string;
    /** 섹션 ID(옵션) */
    section_id?: string;
    /** 레슨명 */
    title: string;
    /** 목차/개요(옵션) */
    outline?: any; // jsonb
    /** 본문(Markdown, 옵션) */
    content_md?: string;
    /** 외부 본문 URL(옵션) */
    content_url?: string;
    /** 첨부파일(옵션) */
    attachments?: any; // jsonb
    /** 영상 길이(초) */
    duration_seconds: number;
    /** 순서 */
    order_index: number;
    /** 미리보기 여부 */
    is_preview: boolean;
    /** 생성일 */
    created_at: string;
    /** 수정일 */
    updated_at: string;
}
