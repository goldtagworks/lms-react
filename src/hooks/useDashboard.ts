import { useQuery } from '@tanstack/react-query';
import { qk } from '@main/lib/queryKeys';
import { getDashboardStats, getTopCourses, getActiveStudents, getRevenueChart, getExamStats } from '@main/services/dashboardService';

/**
 * 대시보드 전체 통계 Hook
 */
export function useDashboardStats() {
    return useQuery({
        queryKey: qk.dashboardStats(),
        queryFn: getDashboardStats,
        staleTime: 5 * 60 * 1000 // 5분
    });
}

/**
 * 인기 코스 통계 Hook
 */
export function useTopCourses(limit = 10) {
    return useQuery({
        queryKey: qk.topCourses(limit),
        queryFn: () => getTopCourses(limit),
        staleTime: 10 * 60 * 1000 // 10분
    });
}

/**
 * 활성 학생 통계 Hook
 */
export function useActiveStudents(limit = 10) {
    return useQuery({
        queryKey: qk.activeStudents(limit),
        queryFn: () => getActiveStudents(limit),
        staleTime: 10 * 60 * 1000 // 10분
    });
}

/**
 * 매출 차트 데이터 Hook
 */
export function useRevenueChart(months = 6) {
    return useQuery({
        queryKey: qk.revenueChart(months),
        queryFn: () => getRevenueChart(months),
        staleTime: 30 * 60 * 1000 // 30분
    });
}

/**
 * 시험 통계 Hook
 */
export function useExamStats() {
    return useQuery({
        queryKey: qk.examStats(),
        queryFn: getExamStats,
        staleTime: 15 * 60 * 1000 // 15분
    });
}
