/**
 * 코스 가격 정책 (free: 무료, paid: 유료)
 */
export const CoursePricingMode = ['free', 'paid'] as const;
/**
 * 코스 가격 정책 타입
 */
export type CoursePricingMode = (typeof CoursePricingMode)[number];

/**
 * 코스(강의) 정보
 */
export interface Course {
    /** 코스 고유 ID */
    id: string;
    /** 강사(프로필) ID */
    instructor_id: string;
    /** 코스명 */
    title: string;
    /** 코스 요약(선택) */
    summary?: string;
    /** 코스 설명(마크다운/HTML) */
    description?: string;
    /** 슬러그(SEO용, 선택) */
    slug?: string;
    /** 카테고리(라벨, 선택) */
    category?: string;
    /** 태그(선택) */
    tags?: string[];
    /** 썸네일 이미지 URL */
    thumbnail_url?: string;
    /** 가격 정책 */
    pricing_mode: CoursePricingMode;
    /** 정가(원) */
    list_price_cents: number;
    /** 세일가(원, 선택) */
    sale_price_cents?: number;
    /** 세일 종료일(선택) */
    sale_ends_at?: string;
    /** 통화(ISO 4217) */
    currency_code: string;
    /** 실제 결제 금액(스냅샷, legacy) */
    price_cents: number;
    /** 세금 포함 여부 */
    tax_included: boolean;
    /** 세율(%) */
    tax_rate_percent?: number;
    /** 과세국가(ISO 3166-1 alpha-2) */
    tax_country_code?: string;
    /** 진도 기준(%) */
    progress_required_percent: number;
    /** 활성화 여부 */
    is_active: boolean;
    /** 공개 여부 */
    published: boolean;
    /** 생성일 */
    created_at: string;
    /** 수정일 */
    updated_at: string;
}
