import { useParams } from 'react-router-dom';
import { getCourse } from '@main/lib/repository';

/**
 * useCourseByRouteId
 * 라우트 파라미터 id를 코스 id(c-prefix)로 정규화 후 코스를 반환.
 * - 서버 authoritative 원칙: 가격(list_price_cents, sale_price_cents)은 재계산하지 않고 그대로 소비.
 */
export function useCourseByRouteId() {
    const { id: rawId } = useParams();
    const normalizedId = !rawId ? undefined : rawId.startsWith('c') ? rawId : 'c' + rawId;
    const course = normalizedId ? getCourse(normalizedId) : undefined;

    return { course, courseId: normalizedId, notFound: !course } as const;
}

export default useCourseByRouteId;
