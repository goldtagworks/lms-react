/**
 * Q&A 질문
 */
export interface CourseQuestion {
    /** 질문 고유 ID */
    id: string;
    /** 코스 ID */
    course_id: string;
    /** 작성자(수강생) ID */
    user_id: string;
    /** 질문 제목 */
    title: string;
    /** 질문 본문 */
    body: string;
    /** 해결 여부 */
    is_resolved: boolean;
    /** 작성일 */
    created_at: string;
    /** (in-memory only) 비공개 여부 - schema 미반영 */
    is_private?: boolean;
    /** (in-memory only) 수정일 - schema 미반영 */
    updated_at?: string;
}

/**
 * Q&A 답변
 */
export interface CourseAnswer {
    /** 답변 고유 ID */
    id: string;
    /** 질문 ID */
    question_id: string;
    /** 작성자 ID */
    user_id: string;
    /** 답변 본문 */
    body: string;
    /** 강사 답변 여부 */
    is_instructor_answer: boolean;
    /** 작성일 */
    created_at: string;
}
