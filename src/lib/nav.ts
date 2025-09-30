// 역할/인증 기반 단일 네비게이션 소스
// i18n 적용 전이므로 labelKey 예약, 현재 label 직접 사용

export type AuthVisibility = 'public' | 'guest' | 'auth';
export type UserRole = 'student' | 'instructor' | 'admin';

export interface NavItem {
    id: string;
    // label은 과도기(Dev)용 고정 문자열. 최종적으로 labelKey (예: 'nav.courses') 사용.
    // 기존 주석에 있던 051_copy_catalog.json 의존 제거 -> 분리된 namespace JSON 기반.
    label: string;
    labelKey?: string; // 'nav.xxx'
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
        label: '',
        labelKey: 'nav.catalog',
        order: 10,
        items: [
            { id: 'courses', label: '', labelKey: 'nav.coursesExplore', href: '/courses' },
            { id: 'notices', label: '', labelKey: 'nav.notices', href: '/notices' }
        ]
    },
    {
        id: 'learn',
        label: '',
        labelKey: 'nav.learn',
        order: 20,
        auth: 'auth',
        items: [
            { id: 'my', label: '', labelKey: 'nav.myLearning', href: '/my', auth: 'auth' },
            { id: 'wishlist', label: '', labelKey: 'nav.wishlist', href: '/my/wishlist', auth: 'auth' },
            { id: 'certificates', label: '', labelKey: 'nav.certificates', href: '/my/certificates', auth: 'auth' }
        ]
    },
    /*
    {
        id: 'instructor',
        label: '',
        labelKey: 'nav.instructor',
        order: 30,
        auth: 'auth',
        roles: ['instructor'],
        items: [
            { id: 'instructor-courses', label: '', labelKey: 'nav.instructorCourses', href: '/instructor/courses', auth: 'auth', roles: ['instructor'] },
            { id: 'instructor-profile', label: '', labelKey: 'nav.instructorProfile', href: '/instructor/__USER_ID__', auth: 'auth', roles: ['instructor'] }
        ]
    },
    */
    {
        id: 'admin',
        label: '',
        labelKey: 'nav.admin',
        order: 40,
        auth: 'auth',
        roles: ['admin'],
        items: [
            { id: 'admin-users', label: '', labelKey: 'nav.adminUsers', href: '/admin/users', roles: ['admin'], auth: 'auth' },
            { id: 'admin-categories', label: '', labelKey: 'nav.adminCategories', href: '/admin/categories', roles: ['admin'], auth: 'auth' },
            { id: 'admin-coupons', label: '', labelKey: 'nav.adminCoupons', href: '/admin/coupons', roles: ['admin'], auth: 'auth' },
            { id: 'admin-certificates', label: '', labelKey: 'nav.adminCertificates', href: '/admin/certificates', roles: ['admin'], auth: 'auth' },
            { id: 'admin-support', label: '', labelKey: 'nav.adminSupport', href: '/admin/support', roles: ['admin'], auth: 'auth' }
            // { id: 'admin-instructor-apps', label: '', labelKey: 'nav.adminInstructorApps', href: '/admin/instructors/apps', roles: ['admin'], auth: 'auth' }
        ]
    },
    {
        id: 'cta',
        label: '',
        labelKey: 'nav.cta',
        order: 50,
        items: [
            {
                id: 'apply-instructor',
                label: '',
                labelKey: 'nav.applyInstructor',
                href: '/instructor/apply',
                auth: 'auth',
                roles: ['student'],
                predicate: ({ role }) => role === 'student'
            }
        ]
    },
    {
        id: 'legal',
        label: '',
        labelKey: 'nav.legal',
        order: 90,
        items: [
            { id: 'terms', label: '', labelKey: 'nav.terms', href: '/terms' },
            { id: 'privacy', label: '', labelKey: 'nav.privacy', href: '/privacy' }
        ]
    },
    {
        id: 'support',
        label: '',
        labelKey: 'nav.support',
        order: 95,
        items: [
            { id: 'faq', label: '', labelKey: 'nav.faq', href: '/faq' },
            { id: 'support-new', label: '', labelKey: 'nav.supportNew', href: '/support/new', auth: 'auth' }
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
