/**
 * Certificate 단일 항목 조회 훅
 * NOTE: 서버 RLS 에 의해 현재 사용자 소유 enrollment 에 한해 접근 가능하다는 가정.
 * 반환 형태는 다른 단일 조회 훅과 통일: { data, isLoading, error }
 */
import { supabase } from '@main/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { qk } from '@main/lib/queryKeys';

export interface CertificateRow {
    id: string;
    enrollment_id: string;
    exam_attempt_id: string;
    issued_at: string;
    pdf_path: string | null;
    serial_no: string;
}

async function fetchCertificate(id: string | undefined): Promise<CertificateRow | null> {
    if (!id) return null;
    const { data, error } = await supabase.from('certificates').select('*').eq('id', id).maybeSingle();

    if (error) throw error;

    return (data as CertificateRow) || null;
}

export function useCertificateQuery(id: string | undefined) {
    const query = useQuery<CertificateRow | null>({
        queryKey: qk.certificate(id || 'unknown'),
        queryFn: () => fetchCertificate(id),
        enabled: !!id
    });

    return { data: query.data, isLoading: query.isLoading, error: query.error } as const;
}

export default useCertificateQuery;
