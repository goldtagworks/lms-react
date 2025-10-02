import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { ReactNode, lazy, Suspense } from 'react';
import { useAuth } from '@main/lib/auth';
import RequireRole from '@main/components/RequireRole';
import MainLayout from '@main/layouts/MainLayout';

// Eager (초기 랜딩에 거의 항상 필요한 페이지)
// Keep only absolutely critical above-the-fold pages eager; others lazy to shrink initial bundle
import HomePage from '@main/pages/HomePage';
const CourseListPage = lazy(() => import('@main/pages/CourseListPage'));
const CourseDetailPage = lazy(() => import('@main/pages/CourseDetailPage'));
const SignInPage = lazy(() => import('@main/pages/SignInPage'));
const SignUpPage = lazy(() => import('@main/pages/SignUpPage'));
const PasswordResetRequestPage = lazy(() => import('@main/pages/PasswordResetRequestPage'));
const PasswordResetConfirmPage = lazy(() => import('@main/pages/PasswordResetConfirmPage'));
const PasswordChangePage = lazy(() => import('@main/pages/PasswordChangePage'));
const NoticesPage = lazy(() => import('@main/pages/NoticesPage'));
const NoticeDetailPage = lazy(() => import('@main/pages/NoticeDetailPage'));
const FAQPage = lazy(() => import('@main/pages/FAQPage'));
const TermsPage = lazy(() => import('@main/pages/TermsPage'));
const PrivacyPage = lazy(() => import('@main/pages/PrivacyPage'));
const NotFoundPage = lazy(() => import('@main/pages/NotFoundPage'));

// Lazy (무거운/역할 기반 또는 진입 빈도 낮은 페이지)
const InstructorProfilePage = lazy(() => import('@main/pages/InstructorProfilePage'));
const MyPage = lazy(() => import('@main/pages/MyPage'));
const WishlistPage = lazy(() => import('@main/pages/WishlistPage'));
const LessonPlayerPage = lazy(() => import('@main/pages/LessonPlayerPage'));
const ExamAttemptPage = lazy(() => import('@main/pages/ExamAttemptPage'));
const InstructorCoursesPage = lazy(() => import('@main/pages/InstructorCoursesPage'));
const CourseEditPage = lazy(() => import('@main/pages/CourseEditPage'));
const AdminUsersPage = lazy(() => import('@main/pages/AdminUsersPage'));
const AdminCertificatesPage = lazy(() => import('@main/pages/AdminCertificatesPage'));
const AdminCouponsPage = lazy(() => import('@main/pages/AdminCouponsPage'));
const AdminCategoriesPage = lazy(() => import('@main/pages/AdminCategoriesPage'));
const EnrollPage = lazy(() => import('@main/pages/EnrollPage'));
const ExamPage = lazy(() => import('@main/pages/ExamPage'));
const CertificatePage = lazy(() => import('@main/pages/CertificatePage'));
const CertificatesListPage = lazy(() => import('@main/pages/CertificatesListPage'));
const SupportTicketsPage = lazy(() => import('@main/pages/SupportTicketsPage'));
const SupportNewPage = lazy(() => import('@main/pages/SupportNewPage'));
const SupportTicketDetailPage = lazy(() => import('@main/pages/SupportTicketDetailPage'));
const AdminSupportPage = lazy(() => import('@main/pages/AdminSupportPage'));
const InstructorApplyPage = lazy(() => import('@main/pages/InstructorApplyPage'));
const AdminInstructorAppsPage = lazy(() => import('@main/pages/AdminInstructorAppsPage'));

function AuthAny({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) return null;

    if (!user) return <Navigate replace to="/signin" />;

    return <>{children}</>;
}

function MainLayoutRoute() {
    return (
        <MainLayout>
            <Outlet />
        </MainLayout>
    );
}

/**
 * 라우트 구조 설계 (060_routes_and_components.md 기반)
 * 인증/역할 가드는 ProtectedRoute, RoleRoute 등으로 추후 분리
 */
export default function AppRouter() {
    return (
        <Suspense fallback={null}>
            <Routes>
                <Route element={<MainLayoutRoute />}>
                    {/* Public / Eager */}
                    <Route element={<HomePage />} path="/" />
                    <Route element={<CourseListPage />} path="/courses" />
                    {/* Course detail: param 명을 courseId로 통일 */}
                    <Route element={<CourseDetailPage />} path="/course/:courseId" />
                    <Route element={<NoticesPage />} path="/notices" />
                    <Route element={<NoticeDetailPage />} path="/notices/:id" />
                    <Route element={<SignInPage />} path="/signin" />
                    <Route element={<SignUpPage />} path="/signup" />
                    <Route element={<PasswordResetRequestPage />} path="/password/reset" />
                    <Route element={<PasswordResetConfirmPage />} path="/password/reset/confirm" />
                    <Route
                        element={
                            <AuthAny>
                                <PasswordChangePage />
                            </AuthAny>
                        }
                        path="/password/change"
                    />
                    <Route element={<FAQPage />} path="/faq" />
                    <Route element={<TermsPage />} path="/terms" />
                    <Route element={<PrivacyPage />} path="/privacy" />

                    {/* Authenticated (generic) */}
                    <Route element={<MyPage />} path="/my" />
                    <Route element={<WishlistPage />} path="/my/wishlist" />
                    <Route element={<CertificatesListPage />} path="/my/certificates" />

                    {/* Certificate 단일 정의 (중복 제거) */}
                    <Route element={<CertificatePage />} path="/certificate/:id" />

                    {/* Learning / Exam */}
                    <Route element={<LessonPlayerPage />} path="/learn/:enrollmentId" />
                    <Route element={<ExamAttemptPage />} path="/exam/:examId/attempt" />
                    <Route element={<ExamPage />} path="/exam/:id" />

                    {/* Instructor */}
                    <Route element={<InstructorApplyPage />} path="/instructor/apply" />
                    <Route
                        element={
                            <RequireRole requiredRole="instructor">
                                <InstructorProfilePage />
                            </RequireRole>
                        }
                        path="/instructor/:id"
                    />
                    <Route
                        element={
                            <RequireRole requiredRole="instructor">
                                <InstructorCoursesPage />
                            </RequireRole>
                        }
                        path="/instructor/courses"
                    />
                    <Route
                        element={
                            <RequireRole requiredRole="instructor">
                                <CourseEditPage />
                            </RequireRole>
                        }
                        path="/instructor/courses/new"
                    />
                    <Route
                        element={
                            <RequireRole requiredRole="instructor">
                                <CourseEditPage />
                            </RequireRole>
                        }
                        path="/instructor/courses/:id/edit"
                    />

                    {/* Admin */}
                    <Route
                        element={
                            <RequireRole requiredRole="admin">
                                <CourseEditPage />
                            </RequireRole>
                        }
                        path="/admin/courses/:id/edit"
                    />
                    <Route
                        element={
                            <RequireRole requiredRole="admin">
                                <AdminUsersPage />
                            </RequireRole>
                        }
                        path="/admin/users"
                    />
                    <Route
                        element={
                            <RequireRole requiredRole="admin">
                                <AdminCertificatesPage />
                            </RequireRole>
                        }
                        path="/admin/certificates"
                    />
                    <Route
                        element={
                            <RequireRole requiredRole="admin">
                                <AdminCouponsPage />
                            </RequireRole>
                        }
                        path="/admin/coupons"
                    />
                    <Route
                        element={
                            <RequireRole requiredRole="admin">
                                <AdminCategoriesPage />
                            </RequireRole>
                        }
                        path="/admin/categories"
                    />
                    <Route
                        element={
                            <RequireRole requiredRole="admin">
                                <AdminSupportPage />
                            </RequireRole>
                        }
                        path="/admin/support"
                    />
                    <Route
                        element={
                            <RequireRole requiredRole="admin">
                                <AdminInstructorAppsPage />
                            </RequireRole>
                        }
                        path="/admin/instructors/apps"
                    />

                    {/* Support (Auth required) */}
                    <Route
                        element={
                            <AuthAny>
                                <SupportTicketsPage />
                            </AuthAny>
                        }
                        path="/support"
                    />
                    <Route
                        element={
                            <AuthAny>
                                <SupportTicketDetailPage />
                            </AuthAny>
                        }
                        path="/support/:id"
                    />
                    <Route
                        element={
                            <AuthAny>
                                <SupportNewPage />
                            </AuthAny>
                        }
                        path="/support/new"
                    />

                    {/* Legacy Redirects */}
                    <Route element={<Navigate replace to="/signin" />} path="/login" />
                    <Route element={<Navigate replace to="/signup" />} path="/register" />

                    {/* Enroll (kept near end to avoid collisions) */}
                    <Route element={<EnrollPage />} path="/enroll/:id" />

                    {/* 404 */}
                    <Route element={<NotFoundPage />} path="*" />
                </Route>
            </Routes>
        </Suspense>
    );
}
