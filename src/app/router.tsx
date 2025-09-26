import { Routes, Route, Outlet } from 'react-router-dom';

import InstructorProfilePage from '../pages/InstructorProfilePage';
import MyPage from '../pages/MyPage';
import WishlistPage from '../pages/WishlistPage';
import LessonPlayerPage from '../pages/LessonPlayerPage';
import ExamAttemptPage from '../pages/ExamAttemptPage';
import InstructorCoursesPage from '../pages/InstructorCoursesPage';
import CourseEditPage from '../pages/CourseEditPage';
import AdminUsersPage from '../pages/AdminUsersPage';
import AdminCertificatesPage from '../pages/AdminCertificatesPage';
import AdminCouponsPage from '../pages/AdminCouponsPage';
import AdminCategoriesPage from '../pages/AdminCategoriesPage';
import HomePage from '../pages/HomePage';
import CourseListPage from '../pages/CourseListPage';
import CourseDetailPage from '../pages/CourseDetailPage';
import EnrollPage from '../pages/EnrollPage';
import PaymentPage from '../pages/PaymentPage';
import ExamPage from '../pages/ExamPage';
import CertificatePage from '../pages/CertificatePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import NotFoundPage from '../pages/NotFoundPage';
import MainLayout from '../layouts/MainLayout';

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
            {/* Home은 레이아웃 없이 */}
            <Route element={<HomePage />} path="/" />
            {/* 나머지는 MainLayout 적용 */}
            <Route element={<MainLayoutRoute />}>
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

                {/* 404 fallback */}
                <Route element={<NotFoundPage />} path="*" />
            </Route>
        </Routes>
    );
}
