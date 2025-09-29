import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * 전역 스크롤 초기화:
 * - 라우트 path/search 변경 시 window.scrollTo(0,0)
 * - 예외: hash(anchor)가 존재하면 hash 스크롤(브라우저 기본 or 수동) 우선 → 직접 초기화 생략
 * - 향후: Back/Forward 시 이전 스크롤 복원 기능이 필요하면 sessionStorage + history.state 로 확장 가능
 */
export function ScrollToTop() {
    const { pathname, search, hash } = useLocation();

    useEffect(() => {
        // hash 이동(#section)은 기존 DOM anchor 스크롤 또는 커스텀 로직이 처리 → 이 경우 강제 top 이동 안함
        if (hash) return;

        // macOS Safari 위치 고정 등의 edge 케이스 대응 위해 requestAnimationFrame 2번 래핑
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
            });
        });
    }, [pathname, search, hash]);

    return null;
}
