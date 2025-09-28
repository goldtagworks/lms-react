import { useCallback } from 'react';

// Enter / Space 키를 버튼 역할 요소에 매핑하는 헬퍼
export function useEnterSpace(handler: () => void) {
    return useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handler();
            }
        },
        [handler]
    );
}
