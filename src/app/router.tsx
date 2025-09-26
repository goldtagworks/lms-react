import { Routes, Route } from 'react-router-dom';

// import 각 페이지 컴포넌트 (실제 구현 시 파일 경로/이름에 맞게 수정)
import HomePage from '../pages/HomePage';

/**
 * 라우트 구조 설계 (060_routes_and_components.md 기반)
 * 인증/역할 가드는 ProtectedRoute, RoleRoute 등으로 추후 분리
 */
export default function AppRouter() {
    return (
        <Routes>
            {/* public */}
            <Route element={<HomePage />} path="/" />
            <Route element={<div>CourseList</div>} path="/courses" />
            <Route element={<div>CourseDetail</div>} path="/course/:id" />
            <Route element={<div>Login</div>} path="/login" />
            <Route element={<div>InstructorProfile</div>} path="/instructor/:id" />

            {/* auth */}
            <Route element={<div>MyPage</div>} path="/my" />
            <Route element={<div>Wishlist</div>} path="/my/wishlist" />
            <Route element={<div>LessonPlayer</div>} path="/learn/:enrollmentId" />
            <Route element={<div>ExamAttempt</div>} path="/exam/:examId/attempt" />
            <Route element={<div>Certificate</div>} path="/certificate/:certId" />

            {/* instructor/admin */}
            <Route element={<div>InstructorCourses</div>} path="/instructor/courses" />
            <Route element={<div>CourseEdit</div>} path="/instructor/courses/:id/edit" />

            {/* admin */}
            <Route element={<div>AdminUsers</div>} path="/admin/users" />
            <Route element={<div>AdminCertificates</div>} path="/admin/certificates" />
            <Route element={<div>AdminCoupons</div>} path="/admin/coupons" />
            <Route element={<div>AdminCategories</div>} path="/admin/categories" />

            {/* 404 fallback */}
            <Route element={<div>NotFound</div>} path="*" />
        </Routes>
    );
}
