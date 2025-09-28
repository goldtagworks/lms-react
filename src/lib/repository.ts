/**
 * 운영 전환을 염두에 둔 최소 로컬 persistence 유틸.
 * - 실제 서버 API 대체 아님 (임시: sessionStorage)
 * - 가격/세금 재계산 금지 (서버 authoritative 원칙 유지)
 */
import type { Certificate } from '@main/types/exam';
import type { CourseReview } from '@main/types/review';
import type { CourseQuestion, CourseAnswer } from '@main/types/qna';

import { useEffect, useState } from 'react';
import { Course } from '@main/types/course';
import { Enrollment } from '@main/types/enrollment';
import { Lesson } from '@main/types/lesson';
import { UserRole } from '@main/lib/nav';

// Storage Keys
const K_COURSES = 'lms_courses_v1';
const K_ENROLLMENTS = 'lms_enrollments_v1';
const K_WISHLIST = 'lms_wishlist_v1'; // { [userId]: string[] }
const K_LESSONS = 'lms_lessons_v1'; // legacy (flat array)
const K_LESSON_COURSE_PREFIX = 'lms_lessons_v2:'; // per-course key prefix
const K_INSTRUCTOR_APPS = 'lms_instructor_apps_v1';
const K_INSTRUCTOR_PROFILES = 'lms_instructor_profiles_v1';
const K_USERS = 'lms_users_v1'; // 간단 role 업데이트 (mock)
const K_USER_PASSWORDS = 'lms_user_passwords_v1'; // userId -> password (mock)
const K_MARKETING_COPY = 'lms_marketing_copy_v1'; // courseId -> MarketingCopy
// NOTE: 강사 프로필 페이지 큐레이션/메트릭 계산 관련 새 유틸은
// schema v1.1의 공개(published) + 활성(is_active) 코스를 기준으로 한다.
// 리팩터링 시 서버 API 전환이 용이하도록 단일 파일 내 pure 함수 형태 유지.

interface StoredUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}

interface PasswordMap {
    [userId: string]: string; // 해시 아님 (mock). 실제 구현 시 절대 평문 저장 금지.
}

// ---------------- Users (admin mock) ----------------
export function listUsers(): StoredUser[] {
    return loadUsers();
}

export function ensureUser(u: { id: string; name: string; email: string; role: UserRole }) {
    const users = loadUsers();

    if (!users.find((x) => x.id === u.id)) {
        users.push(u);
        saveUsers(users);
        bump();
    }
}

export function upsertUserRole(userId: string, role: UserRole) {
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === userId);

    if (idx >= 0) {
        users[idx] = { ...users[idx], role };
    } else {
        users.push({ id: userId, name: '사용자', email: userId + '@unknown.local', role });
    }
    saveUsers(users);
    bump();
}

export function removeUser(userId: string) {
    const users = loadUsers().filter((u) => u.id !== userId);

    saveUsers(users);
    bump();
}

export function useUsers() {
    const [list, setList] = useState<StoredUser[]>(() => listUsers());

    useEffect(() => {
        const fn = () => setList(listUsers());

        listeners.add(fn);

        return () => {
            listeners.delete(fn);
        };
    }, []);

    return list;
}

export interface InstructorApplication {
    id: string;
    user_id: string;
    display_name: string;
    bio_md?: string;
    links?: { label: string; url: string }[];
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED'; // REVOKED: 승인 후 권한 회수 (Phase1)
    created_at: string;
    decided_at?: string;
    rejection_reason?: string;
    revoked_at?: string; // 회수 시각
    revoke_reason?: string; // 간단 텍스트 (코드/상세 통합 버전)
}

function loadInstructorApps(): InstructorApplication[] {
    return ssGet<InstructorApplication[]>(K_INSTRUCTOR_APPS) || [];
}
function saveInstructorApps(list: InstructorApplication[]) {
    ssSet(K_INSTRUCTOR_APPS, list);
}
function loadUsers(): StoredUser[] {
    return ssGet<StoredUser[]>(K_USERS) || [];
}
function saveUsers(list: StoredUser[]) {
    ssSet(K_USERS, list);
}
function loadPasswordMap(): PasswordMap {
    return ssGet<PasswordMap>(K_USER_PASSWORDS) || {};
}
function savePasswordMap(map: PasswordMap) {
    ssSet(K_USER_PASSWORDS, map);
}

// 관리자: 임시 비밀번호 즉시 발급 (기존 방식) - UI 간소화를 위해 내부에서만 사용 가능.
export function resetUserPassword(userId: string): { temp: string } {
    const users = loadUsers();

    if (!users.find((u) => u.id === userId)) throw new Error('USER_NOT_FOUND');
    const map = loadPasswordMap();
    const temp = 'tmp-' + Math.random().toString(36).slice(2, 10);

    map[userId] = temp; // mock: plain text
    savePasswordMap(map);

    return { temp };
}

// 이메일 기반 리셋 (토큰 발급) 모킹: 실제 구현시 서버 저장 & 메일 발송 필요.
interface PasswordResetToken {
    token: string;
    user_id: string;
    created_at: string; // ISO
}
const K_PASSWORD_RESET_TOKENS = 'lms_pw_reset_tokens_v1';

function loadResetTokens(): PasswordResetToken[] {
    return ssGet<PasswordResetToken[]>(K_PASSWORD_RESET_TOKENS) || [];
}
function saveResetTokens(list: PasswordResetToken[]) {
    ssSet(K_PASSWORD_RESET_TOKENS, list);
}
export function initiatePasswordReset(userId: string): { token: string } {
    const users = loadUsers();

    if (!users.find((u) => u.id === userId)) throw new Error('USER_NOT_FOUND');
    const list = loadResetTokens().filter((t) => t.created_at > new Date(Date.now() - 1000 * 60 * 60).toISOString()); // 최근 1시간 유지만 남김
    const token = 'rt-' + Math.random().toString(36).slice(2, 14);

    list.push({ token, user_id: userId, created_at: new Date().toISOString() });
    saveResetTokens(list);
    // mock 이메일 발송 (실제: 서버 side mailer)
    // eslint-disable-next-line no-console
    console.log('[mock-email] password_reset', { userId, token });

    return { token };
}

export function validateUserPassword(email: string, password: string): { ok: boolean; user?: StoredUser } {
    const users = loadUsers();
    const u = users.find((x) => x.email === email);

    if (!u) return { ok: false };
    const map = loadPasswordMap();
    const stored = map[u.id];

    if (!stored) return { ok: true, user: u }; // 비밀번호 미설정 상태는 프리패스 (기존 로직 유지)

    return { ok: stored === password, user: stored === password ? u : undefined };
}

// -------- Instructor Profiles (approved instructor editable profile) --------
export interface InstructorProfile {
    instructor_id: string;
    display_name: string;
    bio_md?: string;
    avatar_url?: string; // future
    links?: { label: string; url: string }[];
    updated_at: string;
}

function loadInstructorProfileMap(): Record<string, InstructorProfile> {
    return ssGet<Record<string, InstructorProfile>>(K_INSTRUCTOR_PROFILES) || {};
}
function saveInstructorProfileMap(map: Record<string, InstructorProfile>) {
    ssSet(K_INSTRUCTOR_PROFILES, map);
}

export function getInstructorProfile(instructorId: string): InstructorProfile | undefined {
    return loadInstructorProfileMap()[instructorId];
}

export function upsertInstructorProfile(instructorId: string, patch: { display_name?: string; bio_md?: string; links?: { label: string; url: string }[] }) {
    const map = loadInstructorProfileMap();
    const now = new Date().toISOString();
    const existing = map[instructorId];
    const profile: InstructorProfile = {
        instructor_id: instructorId,
        display_name: patch.display_name ?? existing?.display_name ?? '강사',
        bio_md: patch.bio_md ?? existing?.bio_md,
        links: patch.links ?? existing?.links,
        avatar_url: existing?.avatar_url,
        updated_at: now
    };

    map[instructorId] = profile;
    saveInstructorProfileMap(map);
    bump();

    return profile;
}

export function ensureInstructorProfile(instructorId: string, seed?: { display_name?: string; bio_md?: string }) {
    const map = loadInstructorProfileMap();

    if (!map[instructorId]) {
        map[instructorId] = {
            instructor_id: instructorId,
            display_name: seed?.display_name || '강사',
            bio_md: seed?.bio_md,
            updated_at: new Date().toISOString()
        };
        saveInstructorProfileMap(map);
        bump();
    }

    return map[instructorId];
}

export function useInstructorProfile(instructorId: string | undefined) {
    const [p, setP] = useState<InstructorProfile | undefined>(() => (instructorId ? getInstructorProfile(instructorId) : undefined));

    useEffect(() => {
        if (instructorId) setP(getInstructorProfile(instructorId));
    }, [instructorId]);
    useEffect(() => {
        const fn = () => {
            if (instructorId) setP(getInstructorProfile(instructorId));
        };

        listeners.add(fn);

        return () => {
            listeners.delete(fn);
        };
    }, [instructorId]);

    return p;
}

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
        is_featured: false,
        featured_rank: undefined,
        featured_badge_text: undefined,
        created_at: now,
        updated_at: now
    };

    return [
        {
            ...base,
            id: 'c1',
            title: 'React 입문',
            tags: ['React', '기초'],
            is_featured: true,
            featured_rank: 1,
            featured_badge_text: '추천'
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

// ================= Marketing Copy (추가 메타) =================
export interface MarketingCopy {
    course_id: string;
    headline?: string;
    body_md?: string;
    updated_at: string;
}

function loadMarketingCopyMap(): Record<string, MarketingCopy> {
    return ssGet<Record<string, MarketingCopy>>(K_MARKETING_COPY) || {};
}
function saveMarketingCopyMap(map: Record<string, MarketingCopy>) {
    ssSet(K_MARKETING_COPY, map);
}

export function upsertMarketingCopy(courseId: string, patch: { headline?: string; body_md?: string }) {
    const map = loadMarketingCopyMap();
    const now = new Date().toISOString();
    const existing = map[courseId];

    map[courseId] = { course_id: courseId, headline: patch.headline, body_md: patch.body_md, updated_at: now, ...(existing ? existing : {}) };
    saveMarketingCopyMap(map);
    bump();

    return map[courseId];
}

export function getMarketingCopy(courseId: string): MarketingCopy | undefined {
    return loadMarketingCopyMap()[courseId];
}

export function useMarketingCopy(courseId: string | undefined) {
    const [mc, setMc] = useState<MarketingCopy | undefined>(() => (courseId ? getMarketingCopy(courseId) : undefined));

    useEffect(() => {
        if (courseId) setMc(getMarketingCopy(courseId));
    }, [courseId]);

    useEffect(() => {
        const fn = () => {
            if (courseId) setMc(getMarketingCopy(courseId));
        };

        listeners.add(fn);

        return () => {
            listeners.delete(fn);
        };
    }, [courseId]);

    return mc;
}

// Lessons seed (단일 리스트 + 섹션 헤더 2개 + 레슨 3개 예시)
function seedLessons(courses: Course[]): Lesson[] {
    const list: Lesson[] = [];
    const now = new Date().toISOString();

    courses.forEach((c) => {
        const base = c.id;

        // 섹션 헤더 2개
        list.push({
            id: `${base}-sec1`,
            course_id: c.id,
            title: '섹션 1. 소개',
            outline: undefined,
            content_md: undefined,
            content_url: undefined,
            attachments: undefined,
            duration_seconds: 0,
            order_index: list.length + 1,
            is_preview: false,
            is_section: true,
            created_at: now,
            updated_at: now
        });
        list.push({
            id: `${base}-sec2`,
            course_id: c.id,
            title: '섹션 2. 본문',
            outline: undefined,
            content_md: undefined,
            content_url: undefined,
            attachments: undefined,
            duration_seconds: 0,
            order_index: list.length + 1,
            is_preview: false,
            is_section: true,
            created_at: now,
            updated_at: now
        });
        // 레슨 3개
        for (let i = 1; i <= 3; i++) {
            list.push({
                id: `${base}-l${i}`,
                course_id: c.id,
                title: `${c.title} 레슨 ${i}`,
                outline: undefined,
                content_md: undefined,
                content_url: undefined,
                attachments: undefined,
                duration_seconds: 300 + i * 60,
                order_index: list.length + 1,
                is_preview: i === 1,
                created_at: now,
                updated_at: now
            });
        }
    });

    return list;
}

// ================= Instructor Profile Curation & Metrics =================
export interface InstructorCourseCurationResult {
    featured?: Course;
    others: Course[]; // 대표 제외 노출 코스 (max limit 적용 결과)
    allCount: number; // 공개+활성 전체 수
}

/** 공개+활성 코스만 반환 */
function listPublicActiveCoursesByInstructor(instructorId: string): Course[] {
    return loadCourses().filter((c) => c.instructor_id === instructorId && c.published && c.is_active);
}

/** 단순 metrics: 레슨 수 & 총 duration 합산 (섹션 헤더 제외) */
export function getInstructorLessonAggregates(instructorId: string): { totalLessons: number; totalDurationSeconds: number } {
    if (!instructorId) return { totalLessons: 0, totalDurationSeconds: 0 };
    const courses = listPublicActiveCoursesByInstructor(instructorId).map((c) => c.id);

    if (courses.length === 0) return { totalLessons: 0, totalDurationSeconds: 0 };

    // 로컬 스토리지 상 모든 레슨 로드 → 필터 → 집계
    const allLessons = (function () {
        // 내부 loadLessons 함수 접근 불가(스코프 밖) → listLessonsByCourse 반복 사용
        let acc: Lesson[] = [];

        courses.forEach((cid) => {
            acc = acc.concat(listLessonsByCourse(cid));
        });

        return acc;
    })();
    const filtered = allLessons.filter((l) => !l.is_section);
    let totalDurationSeconds = 0;

    filtered.forEach((l) => {
        totalDurationSeconds += l.duration_seconds || 0;
    });

    return { totalLessons: filtered.length, totalDurationSeconds };
}

/** HH:MM 포맷 (시간 단위 초과 시 HHh MMm) 간단 포맷터 */
export function formatDurationHM(totalSeconds: number): string {
    if (!totalSeconds || totalSeconds <= 0) return '0m';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours === 0) return minutes + 'm';

    return hours + 'h ' + (minutes > 0 ? minutes + 'm' : '');
}

/** 대표 코스 선정 우선순위: is_featured.rank ASC → fallback: updated_at desc */
function pickFeaturedCourse(courses: Course[]): Course | undefined {
    if (courses.length === 0) return undefined;
    const featured = courses.filter((c) => c.is_featured).sort((a, b) => (a.featured_rank || 999) - (b.featured_rank || 999));

    if (featured.length > 0) return featured[0];
    // fallback: 최신 수정일

    return [...courses].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))[0];
}

/** 나머지 정렬: updated_at desc (추후 평점/수강생 메트릭 접목 가능) */
function sortRemainingForProfile(courses: Course[]): Course[] {
    return [...courses].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
}

/** 강사 프로필 페이지 노출용 코스 큐레이션 */
export function curateInstructorCourses(instructorId: string, options?: { limit?: number }): InstructorCourseCurationResult {
    const limit = options?.limit ?? 4; // 대표 제외 후 최대 노출 개수

    if (!instructorId) return { featured: undefined, others: [], allCount: 0 };
    const all = listPublicActiveCoursesByInstructor(instructorId);

    if (all.length === 0) return { featured: undefined, others: [], allCount: 0 };
    const featured = pickFeaturedCourse(all);
    const restPool = featured ? all.filter((c) => c.id !== featured.id) : all;
    const sorted = sortRemainingForProfile(restPool).slice(0, limit);

    return { featured, others: sorted, allCount: all.length };
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

// Simple client-side pagination wrapper (server 전환 시 동일 서명 유지 후 내부 offset/cursor 적용 예정)
export interface PagedResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export function loadCoursesPaged(page: number, pageSize: number): PagedResult<Course> {
    const all = loadCourses();
    const total = all.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const current = Math.min(Math.max(1, page), totalPages);
    const start = (current - 1) * pageSize;
    const items = all.slice(start, start + pageSize);

    return { items, total, page: current, pageSize, totalPages };
}

// Lessons
// ---- Lessons (namespaced per-course with lazy migration) ----
function lessonKey(courseId: string) {
    return K_LESSON_COURSE_PREFIX + courseId;
}

function migrateLegacyLessonsIfNeeded(): void {
    // If any v2 key exists we assume migration already performed.
    // Cheap check: look at sessionStorage keys.
    const anyV2 = Object.keys(sessionStorage).some((k) => k.startsWith(K_LESSON_COURSE_PREFIX));

    if (anyV2) return;

    const legacy = ssGet<Lesson[]>(K_LESSONS);

    if (!legacy || legacy.length === 0) {
        // maybe need initial seed into per-course keys
        const courses = loadCourses();
        const seeded = seedLessons(courses);
        const byCourse: Record<string, Lesson[]> = {};

        seeded.forEach((l) => {
            byCourse[l.course_id] = byCourse[l.course_id] || [];
            byCourse[l.course_id].push(l);
        });

        Object.entries(byCourse).forEach(([cid, arr]) => {
            ssSet(lessonKey(cid), arr);
        });

        return;
    }

    // split legacy flat list into per-course
    const byCourse: Record<string, Lesson[]> = {};

    legacy.forEach((l) => {
        byCourse[l.course_id] = byCourse[l.course_id] || [];
        byCourse[l.course_id].push(l);
    });
    Object.entries(byCourse).forEach(([cid, arr]) => {
        // ensure ordering
        arr.sort((a, b) => a.order_index - b.order_index).forEach((l, i) => (l.order_index = i + 1));
        ssSet(lessonKey(cid), arr);
    });
    // Optional: keep legacy for rollback; do NOT delete to avoid data loss in dev.
}

function loadLessonsForCourse(courseId: string): Lesson[] {
    migrateLegacyLessonsIfNeeded();
    let list = ssGet<Lesson[]>(lessonKey(courseId));

    if (!list || list.length === 0) {
        // seed only this course (idempotent)
        const course = getCourse(courseId);

        if (course) {
            const seeded = seedLessons([course]).filter((l) => l.course_id === courseId);

            ssSet(lessonKey(courseId), seeded);
            list = seeded;
        } else {
            list = [];
        }
    }

    return list;
}

function saveLessonsForCourse(courseId: string, list: Lesson[]) {
    ssSet(lessonKey(courseId), list);
}

export function listLessonsByCourse(courseId: string): Lesson[] {
    return loadLessonsForCourse(courseId).sort((a, b) => a.order_index - b.order_index);
}

export function createLesson(params: { course_id: string; title: string; is_section?: boolean }): Lesson {
    const ttl = params.title.trim();

    if (!ttl) throw new Error('TITLE_REQUIRED');
    const list = loadLessonsForCourse(params.course_id);
    const now = new Date().toISOString();
    const lesson: Lesson = {
        id: (params.is_section ? 'sec-' : 'l-') + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        course_id: params.course_id,
        title: ttl,
        outline: undefined,
        content_md: undefined,
        content_url: undefined,
        attachments: undefined,
        duration_seconds: 0,
        order_index: list.filter((l) => l.course_id === params.course_id).length + 1,
        is_preview: false,
        created_at: now,
        updated_at: now,
        ...(params.is_section ? { is_section: true } : {})
    } as Lesson;

    list.push(lesson);
    list.sort((a, b) => a.order_index - b.order_index).forEach((l, i) => (l.order_index = i + 1));
    saveLessonsForCourse(params.course_id, list);
    bump();

    return lesson;
}

export function updateLesson(patch: { id: string } & Partial<Lesson>): Lesson | undefined {
    if (!patch.id) return undefined;
    // locate course by scanning v2 keys (small scale dev env)
    // Optimization: maintain id->course map (future), skip now.
    const courseIds = loadCourses().map((c) => c.id);
    let foundCourse: string | undefined;
    let list: Lesson[] = [];
    let idx = -1;

    for (const cid of courseIds) {
        const arr = loadLessonsForCourse(cid);
        const fIdx = arr.findIndex((l) => l.id === patch.id);

        if (fIdx >= 0) {
            foundCourse = cid;
            list = arr;
            idx = fIdx;
            break;
        }
    }
    if (!foundCourse || idx < 0) return undefined;

    if (idx < 0) return undefined;
    const now = new Date().toISOString();
    const updated: Lesson = { ...list[idx], ...patch, updated_at: now } as Lesson;

    list[idx] = updated;
    saveLessonsForCourse(foundCourse, list);
    bump();

    return updated;
}

export function deleteLesson(id: string): boolean {
    const courseIds = loadCourses().map((c) => c.id);

    for (const cid of courseIds) {
        const list = loadLessonsForCourse(cid);
        const idx = list.findIndex((l) => l.id === id);

        if (idx >= 0) {
            list.splice(idx, 1);
            list.sort((a, b) => a.order_index - b.order_index).forEach((l, i) => (l.order_index = i + 1));
            saveLessonsForCourse(cid, list);
            bump();

            return true;
        }
    }

    return false;
}

export function moveLesson(id: string, dir: 'up' | 'down'): Lesson[] {
    const courseIds = loadCourses().map((c) => c.id);

    for (const cid of courseIds) {
        const list = loadLessonsForCourse(cid).sort((a, b) => a.order_index - b.order_index);
        const idx = list.findIndex((l) => l.id === id);

        if (idx < 0) continue;
        const target = dir === 'up' ? idx - 1 : idx + 1;

        if (target < 0 || target >= list.length) return list;
        [list[idx], list[target]] = [list[target], list[idx]];
        list.forEach((l, i) => (l.order_index = i + 1));
        saveLessonsForCourse(cid, list);
        bump();

        return list;
    }

    return [];
}

export function getCourse(id: string): Course | undefined {
    return loadCourses().find((c) => c.id === id);
}

// Mutations: Courses (단순 partial update - 서버 authoritative 아님, 데모용)
function saveCourses(list: Course[]) {
    ssSet(K_COURSES, list);
}

export function updateCoursePartial(courseId: string, patch: Partial<Course>): Course | undefined {
    const list = loadCourses();
    const idx = list.findIndex((c) => c.id === courseId);

    if (idx < 0) return undefined;
    const now = new Date().toISOString();
    const updated: Course = { ...list[idx], ...patch, updated_at: now };

    list[idx] = updated;
    saveCourses(list);
    bump();

    return updated;
}

export function toggleCourseActive(courseId: string): Course | undefined {
    const c = getCourse(courseId);

    if (!c) return undefined;

    return updateCoursePartial(courseId, { is_active: !c.is_active });
}

// Create or update a course (draft style) - simple local mock
export function saveCourseDraft(input: { id?: string; title: string; summary: string; description: string; is_featured?: boolean; featured_rank?: number; featured_badge_text?: string }): {
    created: boolean;
    course?: Course;
    error?: string;
} {
    const list = loadCourses();
    const now = new Date().toISOString();
    const { id, title, summary, description, is_featured, featured_rank, featured_badge_text } = input;

    if (id) {
        const idx = list.findIndex((c) => c.id === id);

        if (idx < 0) {
            return { created: false, error: 'NOT_FOUND' };
        }

        const updated: Course = {
            ...list[idx],
            title,
            summary,
            description,
            is_featured: !!is_featured,
            featured_rank: is_featured ? featured_rank : undefined,
            featured_badge_text: is_featured ? featured_badge_text : undefined,
            updated_at: now
        };

        list[idx] = updated;
        saveCourses(list);
        bump();

        return { created: false, course: updated };
    }

    // new course: create minimal base (no seed clone)
    const newId = 'c' + (list.length + 1);
    const createdCourse: Course = {
        id: newId,
        instructor_id: 'inst-1', // mock 현재 로그인 강사 대체 (추후 auth 연결)
        title,
        summary,
        description,
        slug: undefined,
        category: 'frontend', // 기본 카테고리 (임시)
        tags: [],
        thumbnail_url: undefined,
        pricing_mode: 'paid',
        list_price_cents: 0,
        sale_price_cents: undefined,
        sale_ends_at: undefined,
        currency_code: 'KRW',
        price_cents: 0,
        tax_included: true,
        tax_rate_percent: undefined,
        tax_country_code: 'KR',
        progress_required_percent: 80,
        is_active: false,
        published: false,
        is_featured: !!is_featured,
        featured_rank: is_featured ? featured_rank : undefined,
        featured_badge_text: is_featured ? featured_badge_text : undefined,
        created_at: now,
        updated_at: now
    };

    list.push(createdCourse);
    saveCourses(list);
    bump();

    return { created: true, course: createdCourse };
}

// ---------------- Instructor Applications (mock) ----------------
export function listInstructorApplications(status?: InstructorApplication['status']): InstructorApplication[] {
    const list = loadInstructorApps();

    return status ? list.filter((a) => a.status === status) : list;
}

export function getInstructorApplicationByUser(userId: string): InstructorApplication | undefined {
    return loadInstructorApps().find((a) => a.user_id === userId && a.status !== 'REJECTED');
}

export function getInstructorApplication(appId: string): InstructorApplication | undefined {
    return loadInstructorApps().find((a) => a.id === appId);
}

export function applyInstructor(user: StoredUser, data: { display_name: string; bio_md?: string; links?: { label: string; url: string }[] }) {
    const apps = loadInstructorApps();
    const existing = getInstructorApplicationByUser(user.id);

    if (existing) return existing; // 이미 신청(대기/승인) 존재

    const now = new Date().toISOString();
    const app: InstructorApplication = {
        id: 'app-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        user_id: user.id,
        display_name: data.display_name,
        bio_md: data.bio_md,
        links: data.links,
        status: 'PENDING',
        created_at: now
    };

    apps.push(app);
    saveInstructorApps(apps);
    bump();

    return app;
}

function promoteUserToInstructor(userId: string) {
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === userId);

    if (idx >= 0) {
        users[idx] = { ...users[idx], role: 'instructor' };
        saveUsers(users);
    } else {
        // 로그인/등록 로직 밖에서 저장 안됐을 수 있으니 최소 엔트리 생성
        users.push({ id: userId, name: '사용자', email: userId + '@unknown.local', role: 'instructor' });
        saveUsers(users);
    }
}

export function approveInstructorApplication(appId: string) {
    const apps = loadInstructorApps();
    const idx = apps.findIndex((a) => a.id === appId);

    if (idx < 0) return undefined;

    const now = new Date().toISOString();

    apps[idx] = { ...apps[idx], status: 'APPROVED', decided_at: now };
    promoteUserToInstructor(apps[idx].user_id);
    saveInstructorApps(apps);
    bump();

    return apps[idx];
}

export function rejectInstructorApplication(appId: string, reason?: string) {
    const apps = loadInstructorApps();
    const idx = apps.findIndex((a) => a.id === appId);

    if (idx < 0) return undefined;

    const now = new Date().toISOString();

    apps[idx] = { ...apps[idx], status: 'REJECTED', decided_at: now, rejection_reason: reason };
    saveInstructorApps(apps);
    bump();

    return apps[idx];
}

export function revokeInstructorApplication(appId: string, reason?: string) {
    const apps = loadInstructorApps();
    const idx = apps.findIndex((a) => a.id === appId);

    if (idx < 0) return undefined;
    const target = apps[idx];

    if (target.status !== 'APPROVED') return target; // PENDING/REJECTED/이미 REVOKED 인 경우 변화 없음 (멱등)

    const now = new Date().toISOString();

    apps[idx] = { ...target, status: 'REVOKED', revoked_at: now, revoke_reason: reason };
    saveInstructorApps(apps);
    bump();

    return apps[idx];
}

// Hook-like helpers
export function useInstructorApplications(status?: InstructorApplication['status']) {
    const [list, setList] = useState<InstructorApplication[]>(() => listInstructorApplications(status));

    useEffect(() => {
        const fn = () => setList(listInstructorApplications(status));

        listeners.add(fn);

        return () => {
            listeners.delete(fn);
        };
    }, [status]);

    return list;
}

export function useMyInstructorApplication(userId: string | undefined) {
    const [app, setApp] = useState<InstructorApplication | undefined>(() => (userId ? getInstructorApplicationByUser(userId) : undefined));

    useEffect(() => {
        const fn = () => setApp(userId ? getInstructorApplicationByUser(userId) : undefined);

        listeners.add(fn);

        return () => {
            listeners.delete(fn);
        };
    }, [userId]);

    return app;
}

export function useInstructorApplication(appId: string | null) {
    const [app, setApp] = useState<InstructorApplication | undefined>(() => (appId ? getInstructorApplication(appId) : undefined));

    useEffect(() => {
        const fn = () => setApp(appId ? getInstructorApplication(appId) : undefined);

        listeners.add(fn);

        return () => {
            listeners.delete(fn);
        };
    }, [appId]);

    return app;
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

// ================= Coupons (mock) =================
// 단순 클라이언트 목업: 서버 authoritative 이전 임시. 금액/EPP 검증 로직 없음.
export interface Coupon {
    id: string;
    code: string; // 대문자 고유
    type: 'percent' | 'fixed';
    value: number; // percent=1~100, fixed=양수
    currency_code?: string; // fixed일 때 통화
    max_uses?: number;
    used_count: number;
    per_user_limit?: number; // user별 사용 한도
    starts_at?: string;
    ends_at?: string;
    active: boolean;
    created_at: string;
    updated_at: string;
}

const K_COUPONS = 'lms.coupons.v1';

function loadCoupons(): Coupon[] {
    return ssGet<Coupon[]>(K_COUPONS) || [];
}
function saveCoupons(list: Coupon[]) {
    ssSet(K_COUPONS, list);
}

export interface CouponFilters {
    q?: string;
    active?: boolean;
}

export function listCouponsPaged(filters: CouponFilters, page: number, pageSize: number) {
    const all = loadCoupons()
        .filter((c) => (filters.active == null ? true : c.active === filters.active))
        .filter((c) => {
            if (!filters.q) return true;
            const q = filters.q.toLowerCase();

            return c.code.toLowerCase().includes(q);
        })
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
    const total = all.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    const items = all.slice(start, start + pageSize);

    return { items, total, totalPages, page: safePage };
}

export function createCoupon(input: Omit<Coupon, 'id' | 'created_at' | 'updated_at' | 'used_count' | 'active'> & { active?: boolean }) {
    const now = new Date().toISOString();
    const list = loadCoupons();
    const code = input.code.trim().toUpperCase();

    if (list.some((c) => c.code === code)) return { error: 'DUPLICATE_CODE' } as const;
    if (input.type === 'percent' && (input.value < 1 || input.value > 100)) return { error: 'INVALID_PERCENT' } as const;
    if (input.type === 'fixed' && input.value <= 0) return { error: 'INVALID_VALUE' } as const;
    if (input.starts_at && input.ends_at && input.starts_at > input.ends_at) return { error: 'INVALID_RANGE' } as const;
    const coupon: Coupon = {
        id: 'cp-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        code,
        type: input.type,
        value: input.value,
        currency_code: input.currency_code,
        max_uses: input.max_uses,
        per_user_limit: input.per_user_limit,
        starts_at: input.starts_at,
        ends_at: input.ends_at,
        active: input.active ?? true,
        used_count: 0,
        created_at: now,
        updated_at: now
    };

    list.push(coupon);
    saveCoupons(list);
    bump();

    return { coupon } as const;
}

export function updateCoupon(id: string, patch: Partial<Omit<Coupon, 'id' | 'created_at' | 'used_count'>>) {
    const list = loadCoupons();
    const idx = list.findIndex((c) => c.id === id);

    if (idx < 0) return { error: 'NOT_FOUND' } as const;
    const now = new Date().toISOString();
    const cur = list[idx];

    if (patch.code) {
        const code = patch.code.trim().toUpperCase();

        if (list.some((c) => c.code === code && c.id !== id)) return { error: 'DUPLICATE_CODE' } as const;
        cur.code = code;
    }
    if (patch.type) cur.type = patch.type;
    if (patch.value != null) {
        if (cur.type === 'percent' && (patch.value < 1 || patch.value > 100)) return { error: 'INVALID_PERCENT' } as const;
        if (cur.type === 'fixed' && patch.value <= 0) return { error: 'INVALID_VALUE' } as const;
        cur.value = patch.value;
    }
    if (patch.starts_at && patch.ends_at && patch.starts_at > patch.ends_at) return { error: 'INVALID_RANGE' } as const;
    if (patch.currency_code !== undefined) cur.currency_code = patch.currency_code;
    if (patch.max_uses !== undefined) cur.max_uses = patch.max_uses;
    if (patch.per_user_limit !== undefined) cur.per_user_limit = patch.per_user_limit;
    if (patch.starts_at !== undefined) cur.starts_at = patch.starts_at;
    if (patch.ends_at !== undefined) cur.ends_at = patch.ends_at;
    if (patch.active !== undefined) cur.active = patch.active;
    cur.updated_at = now;
    saveCoupons(list);
    bump();

    return { coupon: cur } as const;
}

export function deactivateCoupon(id: string) {
    return updateCoupon(id, { active: false });
}

// 간단 검증 (FE 표시용) — 실제 결제 시 서버 재검증 필요
export function validateCouponForDisplay(code: string, nowIso: string): { valid: boolean; reason?: string; coupon?: Coupon } {
    const list = loadCoupons();
    const c = list.find((x) => x.code === code.trim().toUpperCase());

    if (!c) return { valid: false, reason: 'NOT_FOUND' };
    if (!c.active) return { valid: false, reason: 'INACTIVE' };
    if (c.starts_at && nowIso < c.starts_at) return { valid: false, reason: 'NOT_STARTED' };
    if (c.ends_at && nowIso > c.ends_at) return { valid: false, reason: 'EXPIRED' };
    if (c.max_uses && c.used_count >= c.max_uses) return { valid: false, reason: 'MAX_REACHED' };

    return { valid: true, coupon: c };
}

// ================= Categories (mock) =================
export interface CategoryItem {
    id: string;
    name: string;
    slug: string;
    sort_order: number;
    active: boolean;
    created_at: string;
    updated_at: string;
}

const K_CATEGORIES = 'lms.categories.v1';

function loadCategories(): CategoryItem[] {
    return ssGet<CategoryItem[]>(K_CATEGORIES) || [];
}
function saveCategories(list: CategoryItem[]) {
    ssSet(K_CATEGORIES, list);
}

export function listCategories(): CategoryItem[] {
    return loadCategories()
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order);
}

export function createCategory(name: string) {
    const now = new Date().toISOString();
    const list = loadCategories();
    const slug =
        name
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .slice(0, 40) || 'cat';

    if (list.some((c) => c.slug === slug)) return { error: 'DUP_SLUG' } as const;
    const item: CategoryItem = {
        id: 'cat-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: name.trim(),
        slug,
        sort_order: list.length ? Math.max(...list.map((x) => x.sort_order)) + 1 : 1,
        active: true,
        created_at: now,
        updated_at: now
    };

    list.push(item);
    saveCategories(list);
    bump();

    return { category: item } as const;
}

export function updateCategory(id: string, patch: Partial<Pick<CategoryItem, 'name' | 'active'>>) {
    const list = loadCategories();
    const idx = list.findIndex((c) => c.id === id);

    if (idx < 0) return { error: 'NOT_FOUND' } as const;
    const now = new Date().toISOString();
    const cur = list[idx];

    if (patch.name) {
        cur.name = patch.name.trim();
    }
    if (patch.active !== undefined) cur.active = patch.active;
    cur.updated_at = now;
    saveCategories(list);
    bump();

    return { category: cur } as const;
}

export function moveCategory(id: string, dir: 'up' | 'down') {
    const list = loadCategories().slice();
    const idx = list.findIndex((c) => c.id === id);

    if (idx < 0) return { error: 'NOT_FOUND' } as const;
    const swapWith = dir === 'up' ? idx - 1 : idx + 1;

    if (swapWith < 0 || swapWith >= list.length) return { error: 'OUT_OF_RANGE' } as const;
    const a = list[idx];
    const b = list[swapWith];
    const temp = a.sort_order;

    a.sort_order = b.sort_order;
    b.sort_order = temp;
    saveCategories(list);
    bump();

    return { ok: true } as const;
}

export function deactivateCategory(id: string) {
    return updateCategory(id, { active: false });
}

// ================= Certificates (in-memory/sessionStorage mock) =================
const K_CERTIFICATES = 'lms.certificates.v1';

function loadCertificates(): Certificate[] {
    return ssGet<Certificate[]>(K_CERTIFICATES) || [];
}

function saveCertificates(list: Certificate[]) {
    ssSet(K_CERTIFICATES, list);
}

export function listCertificatesByUser(userId: string): Certificate[] {
    // enrollment -> user 매핑이 없으므로 간단 목업: serial_no 안에 userId substring 이면 사용자 소유로 간주 (스텁)
    return loadCertificates().filter((c) => c.serial_no.includes(userId.slice(0, 4)));
}

export function findCertificateById(id: string): Certificate | undefined {
    return loadCertificates().find((c) => c.id === id);
}

export function issueCertificate(params: { enrollment_id: string; exam_attempt_id: string; user_id: string; course_id: string }): Certificate {
    const list = loadCertificates();
    const now = new Date().toISOString();
    const serial = 'C-' + now.slice(0, 10).replace(/-/g, '') + '-' + params.user_id.slice(0, 4) + '-' + (1000 + list.length);
    const existing = list.find((c) => c.enrollment_id === params.enrollment_id);

    if (existing) return existing; // 멱등

    const cert: Certificate = {
        id: 'cert-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        enrollment_id: params.enrollment_id,
        exam_attempt_id: params.exam_attempt_id,
        issued_at: now,
        pdf_path: '/mock/certs/' + serial + '.pdf',
        serial_no: serial
    };

    list.push(cert);
    saveCertificates(list);
    bump();

    return cert;
}

export function useCertificates(userId: string | undefined) {
    const [, setV] = useState(0);

    useEffect(() => {
        const fn = () => setV((x) => x + 1);

        listeners.add(fn);

        return () => {
            listeners.delete(fn);
        };
    }, []);

    return userId ? listCertificatesByUser(userId) : [];
}

// 단일 수료증 구독 훅
export function useCertificate(id: string | undefined) {
    const [cert, setCert] = useState<Certificate | undefined>(() => (id ? findCertificateById(id) : undefined));

    useEffect(() => {
        if (id) setCert(findCertificateById(id));
    }, [id]);

    useEffect(() => {
        const fn = () => {
            if (id) setCert(findCertificateById(id));
        };

        listeners.add(fn);

        return () => {
            listeners.delete(fn);
        };
    }, [id]);

    return cert;
}

// ================= Exam Attempt Score Mock (임시) =================
// 실제 구현 전까지 exam_attempt_id -> { score, pass_score, passed, exam_title } 매핑 제공
interface AttemptMeta {
    score?: number;
    pass_score?: number;
    passed?: boolean;
    exam_title?: string;
}

const attemptMetaMap: Record<string, AttemptMeta> = {};

export function upsertAttemptMeta(attemptId: string, meta: AttemptMeta) {
    attemptMetaMap[attemptId] = { ...attemptMetaMap[attemptId], ...meta };
}

export function getAttemptMeta(attemptId: string | undefined): AttemptMeta | undefined {
    if (!attemptId) return undefined;

    return attemptMetaMap[attemptId];
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

    // listen for global bumps so active 토글 반영
    useEffect(() => {
        const fn = () => {
            if (id) setC(getCourse(id));
        };

        listeners.add(fn);

        return () => {
            listeners.delete(fn);
        };
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

// ================= Reviews & Q&A (sessionStorage mock) =================

const K_REVIEWS = 'lms_reviews_v1';
const K_QNA_QUESTIONS = 'lms_qna_questions_v1';
const K_QNA_ANSWERS = 'lms_qna_answers_v1';

function loadReviews(): CourseReview[] {
    return ssGet<CourseReview[]>(K_REVIEWS) || [];
}
function saveReviews(list: CourseReview[]) {
    ssSet(K_REVIEWS, list);
}
function loadQuestions(): CourseQuestion[] {
    return ssGet<CourseQuestion[]>(K_QNA_QUESTIONS) || [];
}
function saveQuestions(list: CourseQuestion[]) {
    ssSet(K_QNA_QUESTIONS, list);
}
function loadAnswers(): CourseAnswer[] {
    return ssGet<CourseAnswer[]>(K_QNA_ANSWERS) || [];
}
function saveAnswers(list: CourseAnswer[]) {
    ssSet(K_QNA_ANSWERS, list);
}

// -------- Reviews CRUD --------
export function upsertCourseReview(params: { course_id: string; user_id: string; rating: number; comment?: string }): CourseReview {
    if (params.rating < 1 || params.rating > 5) throw new Error('INVALID_RATING');

    const list = loadReviews();
    const now = new Date().toISOString();
    const idx = list.findIndex((r) => r.course_id === params.course_id && r.user_id === params.user_id);

    if (idx >= 0) {
        list[idx] = { ...list[idx], rating: params.rating, comment: params.comment, created_at: list[idx].created_at };
        saveReviews(list);
        bump();

        return list[idx];
    }

    const created: CourseReview = {
        id: 'rev-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        course_id: params.course_id,
        user_id: params.user_id,
        rating: params.rating,
        comment: params.comment,
        created_at: now
    };

    list.push(created);
    saveReviews(list);
    bump();

    return created;
}

export function listCourseReviews(courseId: string): CourseReview[] {
    return loadReviews()
        .filter((r) => r.course_id === courseId)
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export function getCourseRatingSummary(courseId: string): { avg: number; count: number; distribution: Record<number, number> } {
    const reviews = listCourseReviews(courseId);

    if (reviews.length === 0) return { avg: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };

    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    reviews.forEach((r) => {
        dist[r.rating] += 1;
        sum += r.rating;
    });

    const avg = Number((sum / reviews.length).toFixed(2));

    return { avg, count: reviews.length, distribution: dist };
}

// -------- Q&A CRUD --------
// NOTE: is_private & updated_at are NOT in canonical schema (in-memory only placeholder for future schema extension)
export function createQuestion(params: { course_id: string; user_id: string; title: string; body: string; is_private?: boolean }): CourseQuestion {
    if (!params.title.trim()) throw new Error('TITLE_REQUIRED');
    if (!params.body.trim()) throw new Error('BODY_REQUIRED');
    const list = loadQuestions();
    const now = new Date().toISOString();
    const q: CourseQuestion = {
        id: 'q-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        course_id: params.course_id,
        user_id: params.user_id,
        title: params.title,
        body: params.body,
        is_resolved: false,
        created_at: now,
        // in-memory extension fields (schema-sync caution)
        // @ts-ignore
        is_private: !!params.is_private,
        // @ts-ignore
        updated_at: now
    };

    list.push(q);
    saveQuestions(list);
    bump();

    return q;
}

export function listQuestions(courseId: string): CourseQuestion[] {
    return loadQuestions()
        .filter((q) => q.course_id === courseId)
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export function updateQuestion(params: { question_id: string; user_id: string; title: string; body: string }): CourseQuestion {
    const qs = loadQuestions();
    const idx = qs.findIndex((q) => q.id === params.question_id);

    if (idx < 0) throw new Error('QUESTION_NOT_FOUND');

    const q = qs[idx] as any;

    if (q.user_id !== params.user_id) throw new Error('NOT_OWNER');

    // If any answers exist, disallow edit
    const hasAnswer = loadAnswers().some((a) => a.question_id === q.id);

    if (hasAnswer) throw new Error('HAS_ANSWER_IMMUTABLE');

    if (!params.title.trim()) throw new Error('TITLE_REQUIRED');
    if (!params.body.trim()) throw new Error('BODY_REQUIRED');
    const now = new Date().toISOString();

    qs[idx] = { ...(qs[idx] as any), title: params.title, body: params.body, updated_at: now } as CourseQuestion;
    saveQuestions(qs);
    bump();

    return qs[idx];
}

export function setQuestionPrivacy(params: { question_id: string; user_id: string; is_private: boolean }): CourseQuestion {
    const qs = loadQuestions();
    const idx = qs.findIndex((q) => q.id === params.question_id);

    if (idx < 0) throw new Error('QUESTION_NOT_FOUND');

    const q = qs[idx] as any;

    if (q.user_id !== params.user_id) throw new Error('NOT_OWNER');
    // cannot toggle after answers exist (policy)
    const hasAnswer = loadAnswers().some((a) => a.question_id === q.id);

    if (hasAnswer) throw new Error('HAS_ANSWER_IMMUTABLE');
    const now = new Date().toISOString();

    qs[idx] = { ...(qs[idx] as any), is_private: params.is_private, updated_at: now } as CourseQuestion;
    saveQuestions(qs);
    bump();

    return qs[idx];
}

export function createAnswer(params: { question_id: string; user_id: string; body: string; is_instructor_answer: boolean }): CourseAnswer {
    if (!params.body.trim()) throw new Error('BODY_REQUIRED');
    const list = loadAnswers();
    const now = new Date().toISOString();
    const ans: CourseAnswer = {
        id: 'ans-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        question_id: params.question_id,
        user_id: params.user_id,
        body: params.body,
        is_instructor_answer: params.is_instructor_answer,
        created_at: now
    };

    list.push(ans);
    saveAnswers(list);
    bump();

    return ans;
}

export function listAnswers(questionId: string): CourseAnswer[] {
    return loadAnswers()
        .filter((a) => a.question_id === questionId)
        .sort((a, b) => (a.created_at > b.created_at ? 1 : -1));
}

export function resolveQuestion(questionId: string) {
    const qs = loadQuestions();
    const idx = qs.findIndex((q) => q.id === questionId);

    if (idx < 0) return undefined;
    if (qs[idx].is_resolved) return qs[idx]; // idempotent

    qs[idx] = { ...qs[idx], is_resolved: true };
    saveQuestions(qs);
    bump();

    return qs[idx];
}

// Hook 형태 간단 구독 (필요시 React Query 교체 가능)
export function useCourseReviewsState(courseId: string | undefined) {
    const [list, setList] = useState<CourseReview[]>(() => (courseId ? listCourseReviews(courseId) : []));

    useEffect(() => {
        if (courseId) setList(listCourseReviews(courseId));
    }, [courseId]);
    useEffect(() => {
        const fn = () => {
            if (courseId) setList(listCourseReviews(courseId));
        };

        listeners.add(fn);

        return () => {
            listeners.delete(fn);
        };
    }, [courseId]);

    return list;
}

export function useCourseRatingSummaryState(courseId: string | undefined) {
    const [summary, setSummary] = useState(() => (courseId ? getCourseRatingSummary(courseId) : { avg: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }));

    useEffect(() => {
        if (courseId) setSummary(getCourseRatingSummary(courseId));
    }, [courseId]);
    useEffect(() => {
        const fn = () => {
            if (courseId) setSummary(getCourseRatingSummary(courseId));
        };

        listeners.add(fn);

        return () => {
            listeners.delete(fn);
        };
    }, [courseId]);

    return summary;
}

export function useCourseQuestionsState(courseId: string | undefined) {
    const [list, setList] = useState<CourseQuestion[]>(() => (courseId ? listQuestions(courseId) : []));

    useEffect(() => {
        if (courseId) setList(listQuestions(courseId));
    }, [courseId]);
    useEffect(() => {
        const fn = () => {
            if (courseId) setList(listQuestions(courseId));
        };

        listeners.add(fn);

        return () => {
            listeners.delete(fn);
        };
    }, [courseId]);

    return list;
}

export function useAnswersState(questionId: string | undefined) {
    const [list, setList] = useState<CourseAnswer[]>(() => (questionId ? listAnswers(questionId) : []));

    useEffect(() => {
        if (questionId) setList(listAnswers(questionId));
    }, [questionId]);
    useEffect(() => {
        const fn = () => {
            if (questionId) setList(listAnswers(questionId));
        };

        listeners.add(fn);

        return () => {
            listeners.delete(fn);
        };
    }, [questionId]);

    return list;
}
