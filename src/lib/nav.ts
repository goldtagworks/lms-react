// 역할/인증 기반 단일 네비게이션 소스
// i18n 적용 전이므로 labelKey 예약, 현재 label 직접 사용

export type AuthVisibility = 'public' | 'guest' | 'auth';
export type UserRole = 'student' | 'instructor' | 'admin';

export interface NavItem {
    id: string;
    label: string; // TODO: i18n key 사용 예정 (051_copy_catalog.json)
    labelKey?: string;
    href: string;
    auth?: AuthVisibility; // 기본 public
    roles?: UserRole[]; // 비어있으면 모든 역할
    icon?: string; // 아이콘 식별자(향후 Mantine 아이콘 매핑)
    // 추가 조건부 로직 (예: 학생이면서 아직 강사 아님, 승인 대기 등) 표현용
    predicate?: (ctx: FilterContext) => boolean;
}

export interface NavGroup {
    id: string;
    label: string;
    labelKey?: string;
    items: NavItem[];
    auth?: AuthVisibility; // 그룹 차원 필터(아이템 개별 auth 우선)
    roles?: UserRole[];
    collapsible?: boolean; // 모바일 아코디언 확장 여지
    order?: number; // 정렬 제어
}

export interface FilterContext {
    isAuthenticated: boolean;
    role: UserRole | null;
}

// 그룹/아이템 정의
export const navGroups: NavGroup[] = [
    {
        id: 'catalog',
        label: '카탈로그',
        order: 10,
        items: [
            { id: 'courses', label: '코스 탐색', href: '/courses' },
            { id: 'notices', label: '공지사항', href: '/notices' }
        ]
    },
    {
        id: 'learn',
        label: '학습',
        order: 20,
        auth: 'auth',
        items: [
            { id: 'my', label: '내 학습', href: '/my', auth: 'auth' },
            { id: 'wishlist', label: '위시 담기', href: '/my/wishlist', auth: 'auth' },
            { id: 'certificates', label: '수료증', href: '/my/certificates', auth: 'auth' }
            // 수료증/시험 기록 등 향후 추가 가능
        ]
    },
    {
        id: 'instructor',
        label: '강사',
        order: 30,
        auth: 'auth',
        roles: ['instructor'],
        items: [
            { id: 'instructor-courses', label: '내 코스 관리', href: '/instructor/courses', auth: 'auth', roles: ['instructor'] },
            // 사용자 로그인 후 Header/Navbar 에서 동적으로 userId 치환 (간단 구현)
            { id: 'instructor-profile', label: '프로필', href: '/instructor/__USER_ID__', auth: 'auth', roles: ['instructor'] }
            // TODO: 동적 ID 대체 필요
        ]
    },
    {
        id: 'admin',
        label: '관리자',
        order: 40,
        auth: 'auth',
        roles: ['admin'],
        items: [
            { id: 'admin-users', label: '사용자', href: '/admin/users', roles: ['admin'], auth: 'auth' },
            { id: 'admin-categories', label: '카테고리', href: '/admin/categories', roles: ['admin'], auth: 'auth' },
            { id: 'admin-coupons', label: '쿠폰', href: '/admin/coupons', roles: ['admin'], auth: 'auth' },
            { id: 'admin-certificates', label: '수료증', href: '/admin/certificates', roles: ['admin'], auth: 'auth' },
            // 강사 신청 관리: 기존 Header/Navbar 하드코딩 제거 후 이곳으로 이동
            { id: 'admin-instructor-apps', label: '강사 신청 관리', href: '/admin/instructors/apps', roles: ['admin'], auth: 'auth' }
            // 공지 관리는 공용 NoticesPage 에서 role=admin 시 액션 노출
        ]
    },
    // CTA (역할 전환/관리) 그룹: predicate 로 세밀 제어 가능
    {
        id: 'cta',
        label: '전환',
        order: 50,
        items: [
            // 학생만 노출 (instructor/admin 은 숨김)
            {
                id: 'apply-instructor',
                label: '강사 신청',
                href: '/instructor/apply',
                auth: 'auth',
                roles: ['student'],
                predicate: ({ role }) => role === 'student'
            }
        ]
    },
    {
        id: 'legal',
        label: '정책',
        order: 90,
        items: [
            { id: 'terms', label: '이용약관', href: '/terms' },
            { id: 'privacy', label: '개인정보처리방침', href: '/privacy' }
        ]
    }
];

// 필터 함수 (컴포넌트에서 사용)
export function filterNav(groups: NavGroup[], ctx: FilterContext): NavGroup[] {
    const { isAuthenticated, role } = ctx;

    return groups
        .map((g) => ({ ...g }))
        .filter((g) => matchAuth(g.auth, isAuthenticated) && matchRole(g.roles, role))
        .map((g) => ({
            ...g,
            items: g.items.filter((it) => matchAuth(it.auth ?? g.auth, isAuthenticated) && matchRole(it.roles ?? g.roles, role) && (typeof it.predicate === 'function' ? it.predicate(ctx) : true))
        }))
        .filter((g) => g.items.length > 0)
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

function matchAuth(auth: AuthVisibility | undefined, isAuth: boolean): boolean {
    if (!auth || auth === 'public') return true;
    if (auth === 'guest') return !isAuth;
    if (auth === 'auth') return isAuth;

    return true;
}

function matchRole(roles: UserRole[] | undefined, role: UserRole | null): boolean {
    if (!roles || roles.length === 0) return true;
    if (!role) return false;

    return roles.includes(role);
}

// 임시 역할 추론 유틸 (데모용)
export function inferRoleFromEmail(email: string | undefined | null): UserRole | null {
    if (!email) return null;
    if (email.endsWith('@admin.local')) return 'admin';
    if (email.endsWith('@instructor.local')) return 'instructor';

    return 'student';
}
