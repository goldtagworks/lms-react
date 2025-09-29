/**
 * setupViewportHeightVar
 * 동적 주소창(iOS Safari 등) 변동에 안전한 --app-vh CSS 변수를 설정.
 * - 100 * var(--app-vh) = 실제 레이아웃에 사용할 높이
 * - resize / orientationchange 에서 debounce 재계산
 */
export function setupViewportHeightVar(options: { debounceMs?: number } = {}) {
    const { debounceMs = 120 } = options;
    let raf: number | null = null;
    let timer: number | null = null;

    function apply() {
        const vhUnit = window.innerHeight * 0.01;

        document.documentElement.style.setProperty('--app-vh', `${vhUnit}px`);
    }

    function schedule() {
        if (raf) cancelAnimationFrame(raf);
        if (timer) window.clearTimeout(timer);
        timer = window.setTimeout(() => {
            raf = requestAnimationFrame(apply);
        }, debounceMs);
    }

    apply();
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('orientationchange', schedule, { passive: true });

    return () => {
        if (raf) cancelAnimationFrame(raf);
        if (timer) window.clearTimeout(timer);
        window.removeEventListener('resize', schedule);
        window.removeEventListener('orientationchange', schedule);
    };
}

// Auto-init if loaded early (optional usage pattern)
if (typeof window !== 'undefined') {
    // Lazy defer to ensure initial layout pass uses correct height
    requestAnimationFrame(() => setupViewportHeightVar());
}
