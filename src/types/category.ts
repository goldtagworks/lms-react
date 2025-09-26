/**
 * 카테고리 정보
 */
export interface Category {
    /** 카테고리 고유 ID */
    id: string;
    /** 슬러그(영문) */
    slug: string;
    /** 카테고리명 */
    name: string;
}

/**
 * 코스-카테고리 매핑(N:M)
 */
export interface CourseCategory {
    /** 코스 ID */
    course_id: string;
    /** 카테고리 ID */
    category_id: string;
}
