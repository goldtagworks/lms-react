import { Routes, Route, Outlet } from 'react-router-dom';
import InstructorProfilePage from '@main/pages/InstructorProfilePage';
import MyPage from '@main/pages/MyPage';
import WishlistPage from '@main/pages/WishlistPage';
import LessonPlayerPage from '@main/pages/LessonPlayerPage';
import ExamAttemptPage from '@main/pages/ExamAttemptPage';
import InstructorCoursesPage from '@main/pages/InstructorCoursesPage';
import CourseEditPage from '@main/pages/CourseEditPage';
import AdminUsersPage from '@main/pages/AdminUsersPage';
import AdminCertificatesPage from '@main/pages/AdminCertificatesPage';
import AdminCouponsPage from '@main/pages/AdminCouponsPage';
import AdminCategoriesPage from '@main/pages/AdminCategoriesPage';
import HomePage from '@main/pages/HomePage';
import CourseListPage from '@main/pages/CourseListPage';
import CourseDetailPage from '@main/pages/CourseDetailPage';
import EnrollPage from '@main/pages/EnrollPage';
import PaymentPage from '@main/pages/PaymentPage';
import ExamPage from '@main/pages/ExamPage';
import CertificatePage from '@main/pages/CertificatePage';
import LoginPage from '@main/pages/LoginPage';
import RegisterPage from '@main/pages/RegisterPage';
import NotFoundPage from '@main/pages/NotFoundPage';
import MainLayout from '@main/layouts/MainLayout';
import TermsPage from '@main/pages/TermsPage';
import PrivacyPage from '@main/pages/PrivacyPage';

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
        <Routes>
            {/* 나머지는 MainLayout 적용 */}
            <Route element={<MainLayoutRoute />}>
                <Route element={<HomePage />} path="/" />
                <Route element={<CourseListPage />} path="/courses" />
                <Route element={<CourseDetailPage />} path="/course/:id" />
                <Route element={<LoginPage />} path="/login" />
                <Route element={<InstructorProfilePage />} path="/instructor/:id" />
                <Route element={<MyPage />} path="/my" />
                <Route element={<WishlistPage />} path="/my/wishlist" />
                <Route element={<LessonPlayerPage />} path="/learn/:enrollmentId" />
                <Route element={<ExamAttemptPage />} path="/exam/:examId/attempt" />
                <Route element={<CertificatePage />} path="/certificate/:certId" />

                {/* instructor/admin */}
                <Route element={<InstructorCoursesPage />} path="/instructor/courses" />
                <Route element={<CourseEditPage />} path="/instructor/courses/:id/edit" />

                {/* admin */}
                <Route element={<AdminUsersPage />} path="/admin/users" />
                <Route element={<AdminCertificatesPage />} path="/admin/certificates" />
                <Route element={<AdminCouponsPage />} path="/admin/coupons" />
                <Route element={<AdminCategoriesPage />} path="/admin/categories" />

                {/* LMS 주요 플로우 목업 */}
                <Route element={<EnrollPage />} path="/enroll/:id" />
                <Route element={<PaymentPage />} path="/payment/:id" />
                <Route element={<ExamPage />} path="/exam/:id" />
                <Route element={<CertificatePage />} path="/certificate/:id" />
                <Route element={<RegisterPage />} path="/register" />

                {/* 약관/정책 */}
                <Route element={<TermsPage />} path="/terms" />
                <Route element={<PrivacyPage />} path="/privacy" />
                {/* 404 fallback */}
                <Route element={<NotFoundPage />} path="*" />
            </Route>
        </Routes>
    );
}
