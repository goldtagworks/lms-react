// Mock data aligned with lms_schema.sql (NOT production; replace with real fetch later)
// ViewModels 재사용: src/viewmodels/home.ts
import { HomeDataBundle } from '../viewmodels/home';

export const homeData: HomeDataBundle = {
    inProgress: [
        {
            enrollment_id: '11111111-1111-1111-1111-111111111111',
            course_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            course_title: 'React 입문',
            progress_percent: 35,
            thumbnail_url: 'https://cdn.inflearn.com/public/courses/1.png',
            last_accessed_at: '2025-09-20T10:00:00Z'
        }
    ],
    popular: [
        {
            id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            title: 'React 입문',
            summary: '기초부터 실전까지',
            thumbnail_url: 'https://cdn.inflearn.com/public/courses/1.png',
            level: 'beginner',
            pricing_mode: 'paid',
            list_price_cents: 39000,
            sale_price_cents: 29000,
            // sale_ends_at 없음 → undefined
            currency_code: 'KRW',
            effectivePriceCents: 29000,
            avg_rating: 4.8,
            review_count: 120,
            student_count: 1200,
            lesson_count: 48,
            total_duration_seconds: 60 * 60 * 15,
            tags: ['react', 'frontend'],
            is_wishlisted: true,
            published: true
        }
    ],
    newCourses: [
        {
            id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            title: 'TypeScript 실전',
            summary: '타입 안전한 프론트엔드',
            thumbnail_url: 'https://cdn.inflearn.com/public/courses/2.png',
            level: 'intermediate',
            pricing_mode: 'paid',
            list_price_cents: 45000,
            // 세일 없음
            currency_code: 'KRW',
            effectivePriceCents: 45000,
            avg_rating: 4.7,
            review_count: 80,
            student_count: 900,
            lesson_count: 52,
            total_duration_seconds: 60 * 60 * 18,
            tags: ['typescript', 'frontend'],
            published: true
        }
    ],
    discounted: [
        {
            id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
            title: 'SQL & 데이터베이스',
            summary: '실무형 데이터 설계',
            thumbnail_url: 'https://cdn.inflearn.com/public/courses/3.png',
            level: 'beginner',
            pricing_mode: 'paid',
            list_price_cents: 32000,
            sale_price_cents: 25000,
            sale_ends_at: '2025-10-01T00:00:00Z',
            currency_code: 'KRW',
            effectivePriceCents: 25000,
            avg_rating: 4.6,
            review_count: 65,
            student_count: 700,
            lesson_count: 40,
            total_duration_seconds: 60 * 60 * 12,
            tags: ['sql', 'database'],
            published: true
        }
    ],
    categories: [
        { id: 'cat-1', slug: 'frontend', name: '프론트엔드', icon: '💻' },
        { id: 'cat-2', slug: 'backend', name: '백엔드', icon: '🖥️' },
        { id: 'cat-3', slug: 'data', name: '데이터', icon: '📊' }
    ],
    instructors: [
        { user_id: 'inst-1', name: '홍길동', headline: '프론트엔드 전문가', avatar_url: 'https://cdn.inflearn.com/public/instructors/1.png' },
        { user_id: 'inst-2', name: '이몽룡', headline: 'TS/React 마스터', avatar_url: 'https://cdn.inflearn.com/public/instructors/2.png' }
    ],
    bestReviews: [
        {
            id: 'rev-1',
            course_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            user_id: 'user-1',
            user_name: 'user01',
            rating: 5,
            comment: '실무에 바로 도움 됨',
            created_at: '2025-09-20T00:00:00Z',
            course_title: 'React 입문'
        }
    ],
    promoBanners: [
        {
            id: 'promo-1',
            title: '신규 회원 30% 할인',
            description: '첫 결제 즉시 할인 쿠폰을 받아가세요.',
            image_url: 'https://cdn.inflearn.com/public/main/promo@2x.png',
            cta_label: '쿠폰 받기',
            cta_href: '/signup',
            coupon_code: 'NEW30'
        }
    ]
};
