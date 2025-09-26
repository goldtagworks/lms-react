// ViewModel definitions reusing base schema types (see lms_schema.sql)
// NOTE: effectivePriceCents 등 파생 필드는 서버 계산값(클라이언트 재계산 금지)

import { Course } from '@main/types/course';
import { Profile } from '@main/types/profile';
import { CourseReview } from '@main/types/review';

export interface CourseCardVM
    extends Pick<Course, 'id' | 'title' | 'summary' | 'thumbnail_url' | 'pricing_mode' | 'list_price_cents' | 'sale_price_cents' | 'sale_ends_at' | 'currency_code' | 'published'> {
    // level은 현재 Course 스키마에 없음 → 순수 뷰 파생(선택)
    level?: string;
    // 메트릭 뷰 결합 값
    avg_rating?: number;
    review_count?: number;
    student_count?: number;
    lesson_count?: number;
    total_duration_seconds?: number;
    // 위시리스트 여부
    is_wishlisted?: boolean;
    // 서버 계산 표시 가격 (sale/쿠폰/세금 반영 최종값)
    effectivePriceCents: number; // 서버 계산 값
    tags?: string[]; // 원본 tags (필요 시 Course에 포함될 수 있음)
}

export interface InstructorVM {
    user_id: Profile['user_id'];
    name: string; // full_name 또는 fallback
    headline?: string;
    avatar_url?: string;
}

export interface ReviewVM extends Pick<CourseReview, 'id' | 'course_id' | 'user_id' | 'rating' | 'comment' | 'created_at'> {
    user_name?: string;
    course_title?: string;
}

export interface EnrollmentProgressVM {
    enrollment_id: string;
    course_id: string;
    course_title: string;
    progress_percent: number;
    thumbnail_url?: string;
    last_accessed_at?: string;
}

export interface CategoryVM {
    id: string;
    slug: string;
    name: string;
    icon?: string; // purely UI decoration
}

export interface PromoBannerVM {
    id: string;
    title: string;
    description: string;
    image_url?: string;
    cta_label?: string;
    cta_href?: string;
    coupon_code?: string;
}

export interface HomeDataBundle {
    inProgress: EnrollmentProgressVM[];
    popular: CourseCardVM[];
    newCourses: CourseCardVM[];
    discounted: CourseCardVM[];
    categories: CategoryVM[];
    instructors: InstructorVM[];
    bestReviews: ReviewVM[];
    promoBanners: PromoBannerVM[];
}
