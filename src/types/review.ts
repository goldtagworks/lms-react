/**
 * 코스 리뷰(평가)
 */
export interface CourseReview {
    /** 리뷰 고유 ID */
    id: string;
    /** 코스 ID */
    course_id: string;
    /** 작성자(수강생) ID */
    user_id: string;
    /** 평점(1~5) */
    rating: number;
    /** 코멘트(옵션) */
    comment?: string;
    /** 작성일 */
    created_at: string;
}
