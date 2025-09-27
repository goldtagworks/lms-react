import { useState, useCallback } from 'react';

/**
 * 공통 링크 복사 훅
 * - clipboard API 실패 시 silent fail
 * - copied 상태는 지정한 duration(ms) 후 자동 리셋
 */
export function useCopyLink(durationMs: number = 1500) {
    const [copied, setCopied] = useState(false);

    const copy = useCallback(
        (link?: string) => {
            try {
                navigator.clipboard.writeText(link || window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), durationMs);
            } catch {
                // ignore
            }
        },
        [durationMs]
    );

    return { copied, copy };
}

export default useCopyLink;
