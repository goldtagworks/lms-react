import type { PaginatedResult } from '@main/types/pagination';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@main/lib/supabase';

interface CouponRow {
    id: string;
    code: string;
    discount_type: 'percent' | 'fixed';
    percent: number | null;
    amount_cents: number | null;
    starts_at: string | null;
    ends_at: string | null;
    max_redemptions: number | null;
    per_user_limit: number | null;
    is_active: boolean;
    created_at: string;
}

async function fetchCoupons(params: { page: number; pageSize: number; q?: string; active?: 'all' | 'active' | 'inactive' }) {
    const { page, pageSize, q, active } = params;
    let query = supabase.from('coupons').select('*', { count: 'exact' });

    if (q && q.trim()) query = query.ilike('code', `%${q.trim()}%`);
    if (active && active !== 'all') query = query.eq('is_active', active === 'active');

    // pagination (offset 기반 임시)
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);

    if (error) throw error;

    return {
        items: data as CouponRow[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil((count || 0) / pageSize))
    };
}

export interface UseAdminCouponsPagedOptions {
    pageSize?: number;
    q?: string;
    active?: 'all' | 'active' | 'inactive';
}

export function useAdminCouponsPaged(page: number, { pageSize = 20, q, active = 'all' }: UseAdminCouponsPagedOptions = {}) {
    const {
        data: raw,
        isLoading,
        error,
        refetch
    } = useQuery<{ items: CouponRow[]; total: number; page: number; pageSize: number; totalPages: number }>({
        queryKey: ['adminCoupons', { page, pageSize, q: q || '', active }],
        queryFn: () => fetchCoupons({ page, pageSize, q, active })
    });

    const data: PaginatedResult<CouponRow> = useMemo(
        () => ({
            items: raw?.items || [],
            page: raw?.page || page,
            pageSize,
            total: raw?.total || 0,
            pageCount: raw?.totalPages || 1
        }),
        [raw, page, pageSize]
    );

    return { data, isLoading, error, refresh: refetch } as const;
}

export default useAdminCouponsPaged;
