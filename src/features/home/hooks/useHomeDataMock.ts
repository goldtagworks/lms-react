import { useEffect, useState } from 'react';

import { HomeDataBundle } from '../../../viewmodels/home';
import { homeData } from '../../../mocks/homeData';

interface UseHomeDataMockOptions {
    delayMs?: number;
}

interface UseHomeDataMockResult {
    data: HomeDataBundle | undefined;
    isLoading: boolean;
}

// 간단한 mock fetch 훅 (추후 react-query 대체)
export function useHomeDataMock(options: UseHomeDataMockOptions = {}): UseHomeDataMockResult {
    const { delayMs = 800 } = options;
    const [data, setData] = useState<HomeDataBundle | undefined>(undefined);
    const [isLoading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        setLoading(true);

        const timer = setTimeout(() => {
            if (mounted) {
                setData(homeData);
                setLoading(false);
            }
        }, delayMs);

        return () => {
            mounted = false;
            clearTimeout(timer);
        };
    }, [delayMs]);

    return { data, isLoading };
}
