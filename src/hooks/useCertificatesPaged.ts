import type { PaginatedResult } from '@main/types/pagination';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@main/lib/supabase';
import { qk } from '@main/lib/queryKeys';

interface CertificateRow {
    id: string;
    enrollment_id: string;
    exam_attempt_id: string;
    issued_at: string;
    pdf_path: string | null;
    serial_no: string;
}

async function fetchCertificates(userId: string | undefined): Promise<CertificateRow[]> {
    if (!userId) return [];
    // NOTE: 실제 스키마에 user_id 직접 없으면 서버 view 필요. 현재 로직 대체로 enrollment_join 생략.
    // 임시: certificates 테이블(또는 view)에서 serial_no LIKE user prefix 등의 조건이 필요할 수 있음. 여기서는 전체 select 후 필터 없음 (추후 RLS로 user scope 제한 가정).
    const { data, error } = await supabase.from('certificates').select('*');

    if (error) throw error;

    return (data || []) as CertificateRow[];
}

export interface UseCertificatesPagedOptions {
    pageSize?: number;
    userId?: string;
}

export function useCertificatesPaged(page: number, { pageSize = 20, userId }: UseCertificatesPagedOptions = {}) {
    const {
        data: raw = [],
        isLoading,
        error
    } = useQuery<CertificateRow[]>({
        queryKey: qk.certificates(userId),
        queryFn: () => fetchCertificates(userId),
        enabled: !!userId
    });
    const [localPage, setLocalPage] = useState(page);

    useEffect(() => {
        setLocalPage(page);
    }, [page]);

    const total = raw.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, localPage), pageCount);
    const start = (safePage - 1) * pageSize;
    const items = raw.slice(start, start + pageSize);

    const data: PaginatedResult<CertificateRow> = useMemo(() => ({ items, page: safePage, pageSize, total, pageCount }), [items, safePage, pageSize, total, pageCount]);

    return { data, isLoading, error } as const;
}

export default useCertificatesPaged;
