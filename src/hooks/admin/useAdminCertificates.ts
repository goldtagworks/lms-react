import type { Certificate } from '@main/types/exam';

import { useEffect, useMemo, useState } from 'react';
import { issueCertificate } from '@main/lib/repository';

// sessionStorage mock loader
function loadAllCertificates(): Certificate[] {
    try {
        const raw = sessionStorage.getItem('lms.certificates.v1');

        if (!raw) return [];

        return JSON.parse(raw) as Certificate[];
    } catch {
        return [];
    }
}

export interface UseAdminCertificatesOptions {
    pageSize?: number;
}

export function useAdminCertificates({ pageSize = 20 }: UseAdminCertificatesOptions = {}) {
    const [items, setItems] = useState<Certificate[]>([]);
    const [q, setQ] = useState(''); // filter: id or serial
    const [page, setPage] = useState(1);
    const [revision, setRevision] = useState(0);

    // reissue modal state
    const [reissueTarget, setReissueTarget] = useState<Certificate | null>(null);
    const [reissueNote, setReissueNote] = useState('');
    const [reissueErr, setReissueErr] = useState<string | null>(null);

    // soft deactivated map (certId -> reason)
    const [deactivated, setDeactivated] = useState<Record<string, string>>({});

    useEffect(() => {
        setItems(loadAllCertificates());
    }, [revision]);

    const filtered = useMemo(() => {
        const qq = q.trim().toLowerCase();

        if (!qq) return items;

        return items.filter((c) => c.serial_no.toLowerCase().includes(qq) || c.id.toLowerCase().includes(qq));
    }, [items, q]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageSafe = Math.min(page, totalPages);
    const paged = useMemo(() => filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize), [filtered, pageSafe, pageSize]);

    function resetFilters() {
        setQ('');
        setPage(1);
    }

    function refresh() {
        setRevision((r) => r + 1);
    }

    function openReissue(c: Certificate) {
        setReissueTarget(c);
        setReissueNote('');
        setReissueErr(null);
    }

    function commitReissue() {
        if (!reissueTarget) return false;
        try {
            issueCertificate({
                enrollment_id: reissueTarget.enrollment_id,
                exam_attempt_id: reissueTarget.exam_attempt_id,
                user_id: reissueTarget.serial_no.slice(0, 4) + '_U',
                course_id: reissueTarget.serial_no.slice(5, 9) + '_C'
            });
            refresh();
            setReissueTarget(null);

            return true;
        } catch (e: any) {
            setReissueErr(e?.message || '재발급 실패');

            return false;
        }
    }

    function toggleDeactivate(c: Certificate) {
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
        pageSize
    } as const;
}

export default useAdminCertificates;
