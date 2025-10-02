import { useQuery } from '@tanstack/react-query';
import { supabase } from '@main/lib/supabase';
import { qk } from '@main/lib/queryKeys';

export interface CourseListItem {
    id: string;
    title: string;
    instructorId: string;
    isPublished: boolean;
}

/**
 * 시험 생성용 코스 목록 조회
 * - 발행된 코스만 조회
 * - 관리자는 모든 코스, 강사는 본인 코스만
 */
export function useCoursesForExam() {
    return useQuery({
        queryKey: qk.coursesForExam(),
        queryFn: async (): Promise<CourseListItem[]> => {
            const { data, error } = await supabase.from('courses').select('id, title, instructor_id, is_published').eq('is_published', true).order('title');

            if (error) {
                throw new Error(`코스 목록 조회 실패: ${error.message}`);
            }

            return (data || []).map((course) => ({
                id: course.id,
                title: course.title,
                instructorId: course.instructor_id,
                isPublished: course.is_published
            }));
        },
        staleTime: 5 * 60 * 1000, // 5분
        gcTime: 10 * 60 * 1000 // 10분
    });
}
