/**
 * 운영 전환을 염두에 둔 최소 로컬 persistence 유틸.
 * - 실제 서버 API 대체 아님 (임시: sessionStorage)
 * - 가격/세금 재계산 금지 (서버 authoritative 원칙 유지)
 */
import { useEffect, useState } from 'react';
import { Course } from '@main/types/course';
import { Enrollment } from '@main/types/enrollment';
import { Lesson } from '@main/types/lesson';

// Storage Keys
const K_COURSES = 'lms_courses_v1';
const K_ENROLLMENTS = 'lms_enrollments_v1';
const K_WISHLIST = 'lms_wishlist_v1'; // { [userId]: string[] }
const K_LESSONS = 'lms_lessons_v1';

// 초기 샘플 코스 (운영 스키마 구조 따름)
function seedCourses(): Course[] {
    const now = new Date().toISOString();
    const base: Omit<Course, 'id'> = {
        instructor_id: 'inst-1',
        title: '',
        summary: '요약 정보',
        description: '상세 설명',
        slug: undefined,
        category: 'frontend',
        tags: ['tag'],
        thumbnail_url: 'https://cdn.inflearn.com/public/courses/1.png',
        pricing_mode: 'paid',
        list_price_cents: 39000,
        sale_price_cents: 29000,
        sale_ends_at: undefined,
        currency_code: 'KRW',
        price_cents: 29000,
        tax_included: true,
        tax_rate_percent: undefined,
        tax_country_code: 'KR',
        progress_required_percent: 80,
        is_active: true,
        published: true,
        created_at: now,
        updated_at: now
    };

    return [
        {
            ...base,
            id: 'c1',
            title: 'React 입문',
            tags: ['React', '기초']
        },
        {
            ...base,
            id: 'c2',
            title: 'TypeScript 완전정복',
            list_price_cents: 45000,
            sale_price_cents: 35000,
            price_cents: 35000,
            tags: ['TS'],
            thumbnail_url: 'https://cdn.inflearn.com/public/courses/2.png'
        },
        {
            ...base,
            id: 'c3',
            title: 'SQL & 데이터베이스',
            list_price_cents: 32000,
            sale_price_cents: undefined,
            price_cents: 32000,
            tags: ['DB'],
            thumbnail_url: 'https://cdn.inflearn.com/public/courses/3.png'
        },
        {
            ...base,
            id: 'c4',
            title: 'Next.js 실전',
            list_price_cents: 49000,
            sale_price_cents: 39000,
            price_cents: 39000,
            tags: ['Next.js'],
            thumbnail_url: 'https://cdn.inflearn.com/public/courses/4.png'
        },
        {
            ...base,
            id: 'c5',
            title: '파이썬 데이터분석',
            list_price_cents: 42000,
            sale_price_cents: undefined,
            price_cents: 42000,
            tags: ['Python'],
            thumbnail_url: 'https://cdn.inflearn.com/public/courses/5.png',
            category: 'data'
        }
    ];
}

function ssGet<T>(key: string): T | null {
    try {
        const raw = sessionStorage.getItem(key);

        if (!raw) return null;

        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

function ssSet<T>(key: string, value: T) {
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
        // ignore write errors
    }
}

// Lessons seed (간단 mock: 각 코스 3개 레슨)
function seedLessons(courses: Course[]): Lesson[] {
    const list: Lesson[] = [];
    const now = new Date().toISOString();

    courses.forEach((c) => {
        for (let i = 1; i <= 3; i++) {
            list.push({
                id: `${c.id}-l${i}`,
                course_id: c.id,
                section_id: undefined,
                title: `${c.title} 레슨 ${i}`,
                outline: undefined,
                content_md: undefined,
                content_url: undefined,
                attachments: undefined,
                duration_seconds: 300 + i * 60,
                order_index: i,
                is_preview: i === 1,
                created_at: now,
                updated_at: now
            });
        }
    });

    return list;
}

// Courses
export function loadCourses(): Course[] {
    let list = ssGet<Course[]>(K_COURSES);

    if (!list || list.length === 0) {
        list = seedCourses();
        ssSet(K_COURSES, list);
    }

    return list;
}

// Lessons
function loadLessons(): Lesson[] {
    let lessons = ssGet<Lesson[]>(K_LESSONS);

    if (!lessons || lessons.length === 0) {
        const courses = loadCourses();

        lessons = seedLessons(courses);
        ssSet(K_LESSONS, lessons);
    }

    return lessons;
}

export function listLessonsByCourse(courseId: string): Lesson[] {
    return loadLessons()
        .filter((l) => l.course_id === courseId)
        .sort((a, b) => a.order_index - b.order_index);
}

export function getCourse(id: string): Course | undefined {
    return loadCourses().find((c) => c.id === id);
}

// Enrollments
export function getEnrollments(userId: string): Enrollment[] {
    const all = ssGet<Enrollment[]>(K_ENROLLMENTS) || [];

    return all.filter((e) => e.user_id === userId);
}

export function isEnrolled(userId: string, courseId: string): boolean {
    return getEnrollments(userId).some((e) => e.course_id === courseId && e.status === 'ENROLLED');
}

export function enrollCourse(userId: string, courseId: string): { created: boolean; enrollment: Enrollment } {
    const all = ssGet<Enrollment[]>(K_ENROLLMENTS) || [];
    const existing = all.find((e) => e.user_id === userId && e.course_id === courseId && e.status === 'ENROLLED');

    if (existing) {
        return { created: false, enrollment: existing };
    }
    const now = new Date().toISOString();
    const enrollment: Enrollment = {
        id: 'enr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        user_id: userId,
        course_id: courseId,
        status: 'ENROLLED',
        source: 'free',
        created_at: now,
        updated_at: now,
        started_at: now
    };

    all.push(enrollment);
    ssSet(K_ENROLLMENTS, all);

    return { created: true, enrollment };
}

// Wishlist (userId -> string[])
interface WishlistMap {
    [userId: string]: string[];
}

function loadWishlistMap(): WishlistMap {
    return ssGet<WishlistMap>(K_WISHLIST) || {};
}

function saveWishlistMap(map: WishlistMap) {
    ssSet(K_WISHLIST, map);
}

export function getWishlist(userId: string): string[] {
    const map = loadWishlistMap();

    return map[userId] || [];
}

export function toggleWishlist(userId: string, courseId: string): { added: boolean; list: string[] } {
    const map = loadWishlistMap();
    const list = map[userId] ? [...map[userId]] : [];
    const idx = list.indexOf(courseId);
    let added = false;

    if (idx >= 0) {
        list.splice(idx, 1);
    } else {
        list.push(courseId);
        added = true;
    }
    map[userId] = list;
    saveWishlistMap(map);

    return { added, list };
}

// Lightweight state subscription
const listeners = new Set<() => void>();

function bump() {
    listeners.forEach((l) => l());
}

// Wrap mutating ops to notify
export function enrollAndNotify(userId: string, courseId: string) {
    const res = enrollCourse(userId, courseId);

    bump();

    return res;
}
export function toggleWishlistAndNotify(userId: string, courseId: string) {
    const res = toggleWishlist(userId, courseId);

    bump();

    return res;
}

// Hook helpers (no external store lib)

export function useEnrollmentsState(userId: string | undefined) {
    const [, setV] = useState(0); // internal rerender trigger

    useEffect(() => {
        const fn = () => setV((x) => x + 1);

        listeners.add(fn);

        return () => {
            listeners.delete(fn); // ensure cleanup returns void
        };
    }, []);

    return userId ? getEnrollments(userId) : [];
}

export function useWishlistState(userId: string | undefined) {
    const [, setV] = useState(0);

    useEffect(() => {
        const fn = () => setV((x) => x + 1);

        listeners.add(fn);

        return () => {
            listeners.delete(fn);
        };
    }, []);

    return userId ? getWishlist(userId) : [];
}

export function useCourses() {
    const [courses] = useState<Course[]>(() => loadCourses());
    // 간단: 최초 1회만 로드(현재는 변동 없음)

    return courses;
}

export function useCourse(id: string | undefined) {
    const [c, setC] = useState<Course | undefined>(() => (id ? getCourse(id) : undefined));

    useEffect(() => {
        if (id) setC(getCourse(id));
    }, [id]);

    return c;
}

export function useLessons(courseId: string | undefined) {
    const [list, setList] = useState<Lesson[]>(() => (courseId ? listLessonsByCourse(courseId) : []));

    useEffect(() => {
        if (courseId) setList(listLessonsByCourse(courseId));
    }, [courseId]);

    return list;
}

export function isWishlisted(userId: string | undefined, courseId: string): boolean {
    if (!userId) return false;

    return getWishlist(userId).includes(courseId);
}
