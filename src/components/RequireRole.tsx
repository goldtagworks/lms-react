import { ReactNode } from 'react';
import { useI18n } from '@main/lib/i18n';
import { useAuth } from '@main/lib/auth';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { Alert, Button, Group, Stack, Text } from '@mantine/core';

interface RequireRoleProps {
    requiredRole: 'instructor' | 'admin';
    children: ReactNode;
}

/**
 * 간단 역할 가드: 지정 role 아닌 경우 UX 분기
 * - 미로그인: 로그인 페이지로 리다이렉트 (returnUrl 포함 가능)
 * - 로그인했지만 역할 불일치:
 *    admin이 필요한데 instructor/student -> 권한 없음 메시지
 *    instructor가 필요한데 student -> 강사 신청 CTA 제공
 */
export function RequireRole({ requiredRole, children }: RequireRoleProps) {
    const { user, loading } = useAuth();
    const location = useLocation();
    const { t } = useI18n();

    if (loading) return null; // 또는 스켈레톤

    if (!user) {
        // 로그인 필요 → 로그인 후 돌아올 수 있게 상태 값 전달
        return <Navigate replace state={{ from: location.pathname }} to="/signin" />;
    }

    if (user.role !== requiredRole) {
        const isInstructorGuard = requiredRole === 'instructor';

        return (
            <Stack mt="xl" px="md">
                <Alert color="red" title={t('access.forbidden')} variant="light">
                    {isInstructorGuard ? t('access.instructorOnly') : t('access.adminOnly')}
                </Alert>
                <Group>
                    {isInstructorGuard && user.role === 'student' && (
                        <Button component={Link} size="sm" to="/instructor/apply" variant="filled">
                            {t('access.applyInstructorCta')}
                        </Button>
                    )}
                    <Button component={Link} size="sm" to="/" variant="subtle">
                        {t('access.goHome')}
                    </Button>
                </Group>
                <Text c="dimmed" fz="sm">
                    {t('access.requiredRole', { required: requiredRole, current: user.role })}
                </Text>
            </Stack>
        );
    }

    return <>{children}</>;
}

export default RequireRole;
