export interface DashboardStats {
    totalCourses: number;
    totalStudents: number;
    totalInstructors: number;
    totalRevenue: number;
    newEnrollmentsThisMonth: number;
    certificatesIssued: number;
    activeExams: number;
}

export interface CourseStats {
    id: string;
    title: string;
    instructorName: string;
    enrollmentCount: number;
    revenue: number;
    averageRating: number;
    completionRate: number;
}

export interface StudentStats {
    id: string;
    displayName: string;
    email: string;
    enrollmentCount: number;
    certificatesCount: number;
    lastActivity: string;
}

export interface RevenueChart {
    month: string;
    revenue: number;
    enrollments: number;
}

export interface ExamStats {
    id: string;
    title: string;
    courseTitle: string;
    attemptCount: number;
    averageScore: number;
    passRate: number;
}
