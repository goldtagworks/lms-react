// Auto-generated minimal Database type (schema-sync) based on docs/002. 테이블 설계/lms_schema.sql v1.4
// NOTE:
//  * 파생/뷰 필드(effective* 등) 미포함 (서버 계산 값 주석 규칙 준수)
//  * Insert: DEFAULT/auto 값은 optional 처리
//  * Update: 모두 optional
//  * 필요한 테이블만 우선 정의 (확장 시 반드시 스키마 파일 재확인)
//  * ENUM 은 PostgreSQL enum 이름과 정확히 일치

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Enums
export type CoursePricingMode = 'free' | 'fixed' | 'subscription';
export type EnrollmentSource = 'free' | 'purchase' | 'manual';
export type CouponDiscountType = 'percent' | 'amount';
export type CourseLevels = 'beginner' | 'intermediate' | 'advanced';

// Helper generic shapes
type TableDef<Row, Insert = Row, Update = Partial<Insert>> = {
    Row: Row;
    Insert: Insert;
    Update: Update;
    Relationships?: ReadonlyArray<{
        foreignKeyName: string;
        columns: string[];
        referencedRelation: string;
        referencedColumns: string[];
    }>;
};

export interface Database {
    public: {
        Tables: {
            profiles: TableDef<
                {
                    user_id: string;
                    display_name: string | null;
                    role: 'student' | 'instructor' | 'admin';
                    bio_md: string | null;
                    avatar_url: string | null;
                    created_at: string; // timestamptz
                    updated_at: string; // timestamptz
                },
                {
                    user_id: string; // PK no default
                    display_name?: string | null;
                    role?: 'student' | 'instructor' | 'admin';
                    bio_md?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                }
            >;
            categories: TableDef<
                {
                    id: string;
                    slug: string;
                    name: string;
                },
                {
                    id?: string;
                    slug: string;
                    name: string;
                }
            >;
            courses: TableDef<
                {
                    id: string;
                    title: string;
                    description: string | null;
                    instructor_id: string;
                    pricing_mode: CoursePricingMode;
                    price_cents: number;
                    sale_price_cents: number | null;
                    sale_ends_at: string | null;
                    tax_included: boolean;
                    currency: string; // char(3)
                    level: CourseLevels | null;
                    category_id: string | null;
                    thumbnail_url: string | null;
                    summary: string | null;
                    tags: string[] | null;
                    is_featured: boolean;
                    featured_rank: number | null;
                    featured_badge_text: string | null;
                    published: boolean;
                    created_at: string;
                    updated_at: string;
                    language_code: string | null;
                },
                {
                    id?: string;
                    title: string;
                    description?: string | null;
                    instructor_id: string;
                    pricing_mode?: CoursePricingMode;
                    price_cents?: number;
                    sale_price_cents?: number | null;
                    sale_ends_at?: string | null;
                    tax_included?: boolean;
                    currency?: string;
                    level?: CourseLevels | null;
                    category_id?: string | null;
                    thumbnail_url?: string | null;
                    summary?: string | null;
                    tags?: string[] | null;
                    is_featured?: boolean;
                    featured_rank?: number | null;
                    featured_badge_text?: string | null;
                    published?: boolean;
                    created_at?: string;
                    updated_at?: string;
                    language_code?: string | null;
                }
            >;
            lessons: TableDef<
                {
                    id: string;
                    course_id: string;
                    title: string;
                    outline: Json | null;
                    content_md: string | null;
                    content_url: string | null;
                    attachments: Json | null;
                    duration_seconds: number;
                    order_index: number;
                    is_section: boolean;
                    is_preview: boolean;
                    created_at: string;
                    updated_at: string;
                    section_id: string | null; // deprecated
                },
                {
                    id?: string;
                    course_id: string;
                    title: string;
                    outline?: Json | null;
                    content_md?: string | null;
                    content_url?: string | null;
                    attachments?: Json | null;
                    duration_seconds?: number;
                    order_index: number;
                    is_section?: boolean;
                    is_preview?: boolean;
                    created_at?: string;
                    updated_at?: string;
                    section_id?: string | null;
                }
            >;
            enrollments: TableDef<
                {
                    id: string;
                    user_id: string;
                    course_id: string;
                    status: 'PENDING' | 'ENROLLED' | 'CANCELLED';
                    source: EnrollmentSource;
                    created_at: string;
                },
                {
                    id?: string;
                    user_id: string;
                    course_id: string;
                    status?: 'PENDING' | 'ENROLLED' | 'CANCELLED';
                    source?: EnrollmentSource;
                    created_at?: string;
                }
            >;
            exams: TableDef<
                {
                    id: string;
                    course_id: string;
                    title: string;
                    description_md: string | null;
                    pass_score: number;
                    time_limit_minutes: number | null;
                    question_count: number | null;
                    created_at: string;
                    updated_at: string;
                },
                {
                    id?: string;
                    course_id: string;
                    title: string;
                    description_md?: string | null;
                    pass_score: number; // required no default
                    time_limit_minutes?: number | null;
                    question_count?: number | null;
                    created_at?: string;
                    updated_at?: string;
                }
            >;
            payments: TableDef<
                {
                    id: string;
                    enrollment_id: string;
                    provider: string;
                    provider_tx_id: string;
                    amount_cents: number;
                    currency_code: string;
                    tax_amount_cents: number;
                    tax_rate_percent: number | null;
                    tax_country_code: string | null;
                    status: 'PAID' | 'FAILED' | 'REFUNDED';
                    paid_at: string | null;
                    raw: Json | null;
                    created_at: string;
                },
                {
                    id?: string;
                    enrollment_id: string;
                    provider: string;
                    provider_tx_id: string;
                    amount_cents: number;
                    currency_code?: string;
                    tax_amount_cents?: number;
                    tax_rate_percent?: number | null;
                    tax_country_code?: string | null;
                    status: 'PAID' | 'FAILED' | 'REFUNDED';
                    paid_at?: string | null;
                    raw?: Json | null;
                    created_at?: string;
                }
            >;
            exam_attempts: TableDef<
                {
                    id: string;
                    exam_id: string;
                    enrollment_id: string;
                    started_at: string;
                    submitted_at: string | null;
                    score: number | null;
                    passed: boolean | null;
                    answers: Json | null;
                    created_at: string;
                },
                {
                    id?: string;
                    exam_id: string;
                    enrollment_id: string;
                    started_at?: string;
                    submitted_at?: string | null;
                    score?: number | null;
                    passed?: boolean | null;
                    answers?: Json | null;
                    created_at?: string;
                }
            >;
            certificates: TableDef<
                {
                    id: string;
                    enrollment_id: string;
                    exam_attempt_id: string;
                    issued_at: string;
                    pdf_path: string;
                    serial_no: string;
                },
                {
                    id?: string;
                    enrollment_id: string;
                    exam_attempt_id: string;
                    issued_at?: string;
                    pdf_path: string;
                    serial_no: string;
                }
            >;
            course_reviews: TableDef<
                {
                    id: string;
                    course_id: string;
                    user_id: string;
                    rating: number;
                    comment: string | null;
                    created_at: string;
                },
                {
                    id?: string;
                    course_id: string;
                    user_id: string;
                    rating: number;
                    comment?: string | null;
                    created_at?: string;
                }
            >;
            course_questions: TableDef<
                {
                    id: string;
                    course_id: string;
                    user_id: string;
                    title: string;
                    body: string;
                    is_resolved: boolean;
                    created_at: string;
                },
                {
                    id?: string;
                    course_id: string;
                    user_id: string;
                    title: string;
                    body: string;
                    is_resolved?: boolean;
                    created_at?: string;
                }
            >;
            course_answers: TableDef<
                {
                    id: string;
                    question_id: string;
                    user_id: string;
                    body: string;
                    is_instructor_answer: boolean;
                    created_at: string;
                },
                {
                    id?: string;
                    question_id: string;
                    user_id: string;
                    body: string;
                    is_instructor_answer?: boolean;
                    created_at?: string;
                }
            >;
            wishlists: TableDef<
                {
                    user_id: string;
                    course_id: string;
                    created_at: string;
                },
                {
                    user_id: string;
                    course_id: string;
                    created_at?: string;
                }
            >;
            coupons: TableDef<
                {
                    id: string;
                    code: string;
                    discount_type: CouponDiscountType;
                    percent: number | null;
                    amount_cents: number | null;
                    starts_at: string | null;
                    ends_at: string | null;
                    max_redemptions: number | null;
                    per_user_limit: number | null;
                    is_active: boolean;
                    created_at: string;
                },
                {
                    id?: string;
                    code: string;
                    discount_type: CouponDiscountType;
                    percent?: number | null;
                    amount_cents?: number | null;
                    starts_at?: string | null;
                    ends_at?: string | null;
                    max_redemptions?: number | null;
                    per_user_limit?: number | null;
                    is_active?: boolean;
                    created_at?: string;
                }
            >;
            coupon_redemptions: TableDef<
                {
                    id: string;
                    coupon_id: string;
                    user_id: string;
                    enrollment_id: string | null;
                    redeemed_at: string;
                },
                {
                    id?: string;
                    coupon_id: string;
                    user_id: string;
                    enrollment_id?: string | null;
                    redeemed_at?: string;
                }
            >;
            course_categories: TableDef<
                {
                    course_id: string;
                    category_id: string;
                },
                {
                    course_id: string;
                    category_id: string;
                }
            >;
            notices: TableDef<
                {
                    id: string;
                    title: string;
                    body: string | null;
                    pinned: boolean;
                    published: boolean;
                    created_at: string;
                    updated_at: string;
                },
                {
                    id?: string;
                    title: string;
                    body?: string | null;
                    pinned?: boolean;
                    published?: boolean;
                    created_at?: string;
                    updated_at?: string;
                }
            >;
            instructor_applications: TableDef<
                {
                    id: string;
                    user_id: string;
                    display_name: string;
                    bio_md: string | null;
                    links: Json | null;
                    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
                    created_at: string;
                    decided_at: string | null;
                    rejection_reason: string | null;
                    revoked_at: string | null;
                    revoke_reason: string | null;
                },
                {
                    id?: string;
                    user_id: string;
                    display_name: string;
                    bio_md?: string | null;
                    links?: Json | null;
                    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
                    created_at?: string;
                    decided_at?: string | null;
                    rejection_reason?: string | null;
                    revoked_at?: string | null;
                    revoke_reason?: string | null;
                }
            >;
            support_tickets: TableDef<
                {
                    id: string;
                    user_id: string;
                    title: string;
                    status: 'OPEN' | 'ANSWERED' | 'CLOSED';
                    category: string | null;
                    last_message_at: string;
                    created_at: string;
                    updated_at: string;
                },
                {
                    id?: string;
                    user_id: string;
                    title: string;
                    status?: 'OPEN' | 'ANSWERED' | 'CLOSED';
                    category?: string | null;
                    last_message_at?: string;
                    created_at?: string;
                    updated_at?: string;
                }
            >;
            support_ticket_messages: TableDef<
                {
                    id: string;
                    ticket_id: string;
                    author_id: string;
                    body: string;
                    is_private: boolean;
                    created_at: string;
                    updated_at: string;
                },
                {
                    id?: string;
                    ticket_id: string;
                    author_id: string;
                    body: string;
                    is_private?: boolean;
                    created_at?: string;
                    updated_at?: string;
                }
            >;
        };
        Views: {
            v_course_ratings: {
                Row: {
                    course_id: string;
                    avg_rating: string | null; // numeric(3,2) → string
                    review_count: number | null;
                };
            };
            v_course_metrics: {
                Row: {
                    course_id: string;
                    student_count: number | null;
                    lesson_count: number | null;
                    total_duration_seconds: number | null;
                    avg_rating: string | null;
                    review_count: number | null;
                };
            };
        };
        Functions: {};
        Enums: {
            course_pricing_mode: CoursePricingMode;
            enrollment_source: EnrollmentSource;
            coupon_discount_type: CouponDiscountType;
            course_levels: CourseLevels;
        };
        CompositeTypes: {};
    };
}

// Utility mapped types for ergonomic usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
