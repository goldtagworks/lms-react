import { useCallback, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@main/lib/supabase';

export interface AdminCertificateRow {
    id: string;
    enrollment_id: string;
    exam_attempt_id: string;
    issued_at: string;
    serial_no: string;
    pdf_path: string | null;
}

export interface UseAdminCertificatesOptions {
    pageSize?: number;
}

export function useAdminCertificates({ pageSize = 20 }: UseAdminCertificatesOptions = {}) {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [q, setQ] = useState(''); // filter: id or serial
    // soft deactivate local map (not persisted yet)
    const [deactivated, setDeactivated] = useState<Record<string, string>>({});

    // reissue modal state
    const [reissueTarget, setReissueTarget] = useState<AdminCertificateRow | null>(null);
    const [reissueNote, setReissueNote] = useState('');
    const [reissueErr, setReissueErr] = useState<string | null>(null);

    const {
        data: raw = [],
        isLoading,
        error
    } = useQuery<AdminCertificateRow[]>({
        queryKey: ['adminCertificates'],
        queryFn: async () => {
            const { data, error } = await supabase.from('certificates').select('id,enrollment_id,exam_attempt_id,issued_at,serial_no,pdf_path').order('issued_at', { ascending: false });

            if (error) throw error;

            return (data || []) as AdminCertificateRow[];
        }
    });

    const filtered = useMemo(() => {
        const qq = q.trim().toLowerCase();

        if (!qq) return raw;

        return raw.filter((c) => c.serial_no.toLowerCase().includes(qq) || c.id.toLowerCase().includes(qq));
    }, [raw, q]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageSafe = Math.min(page, totalPages);
    const paged = useMemo(() => filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize), [filtered, pageSafe, pageSize]);

    function resetFilters() {
        setQ('');
        setPage(1);
    }

    const refresh = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['adminCertificates'] });
    }, [queryClient]);

    function openReissue(c: AdminCertificateRow) {
        setReissueTarget(c);
        setReissueNote('');
        setReissueErr(null);
    }

    const reissueMutation = useMutation({
        mutationFn: async () => {
            if (!reissueTarget) throw new Error('NO_TARGET');
            // TODO: 실제 서버 재발급 RPC 구현 필요.
            const { error } = await supabase.rpc('reissue_certificate', {
                p_certificate_id: reissueTarget.id,
                p_note: reissueNote || null
            });

            if (error) throw error;
        },
        onSuccess: () => {
            refresh();
            setReissueTarget(null);
        },
        onError: (e: any) => setReissueErr(e?.message || '재발급 실패')
    });

    function commitReissue() {
        if (!reissueTarget) return false;
        reissueMutation.mutate();

        return true;
    }

    function toggleDeactivate(c: AdminCertificateRow) {
        setDeactivated((prev) => {
            const next = { ...prev };

            if (next[c.id]) {
                delete next[c.id];
            } else {
                next[c.id] = '관리자 비활성';
            }

            return next;
        });
    }

    return {
        // data
        paged,
        page: pageSafe,
        totalPages,
        q,
        setQ,
        resetFilters,
        // reissue
        reissueTarget,
        reissueNote,
        reissueErr,
        setReissueNote,
        setReissueErr,
        openReissue,
        commitReissue,
        // deactivate
        deactivated,
        toggleDeactivate,
        // paging
        setPage,
        pageSize,
        isLoading,
        error
    } as const;
}

export default useAdminCertificates;
