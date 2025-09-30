import type { PaginatedResult } from '@main/types/pagination';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@main/lib/supabase';

export interface CouponRow {
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

export type CouponActiveFilter = 'all' | 'active' | 'inactive';

interface UseAdminCouponsOptions {
    pageSize?: number;
}

export function useAdminCoupons({ pageSize = 20 }: UseAdminCouponsOptions = {}) {
    const [q, setQ] = useState('');
    const [activeFilter, setActiveFilter] = useState<CouponActiveFilter>('all');
    const [page, setPage] = useState(1);
    // revision state removed (React Query invalidation handles refresh)

    const activeParam = useMemo(() => (activeFilter === 'all' ? 'all' : activeFilter), [activeFilter]);
    const queryClient = useQueryClient();
    const { data: raw, isLoading } = useQuery({
        queryKey: ['adminCoupons', { page, pageSize, q, active: activeParam }],
        queryFn: async () => {
            let query = supabase.from('coupons').select('*', { count: 'exact' });

            if (q.trim()) query = query.ilike('code', `%${q.trim()}%`);
            if (activeParam !== 'all') query = query.eq('is_active', activeParam === 'active');
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);

            if (error) throw error;

            return {
                items: (data || []) as CouponRow[],
                page,
                pageSize,
                total: count || 0,
                pageCount: Math.max(1, Math.ceil((count || 0) / pageSize))
            };
        }
    });
    const data: PaginatedResult<CouponRow> = useMemo(
        () => ({
            items: raw?.items || [],
            page: raw?.page || page,
            pageSize,
            total: raw?.total || 0,
            pageCount: raw?.pageCount || 1
        }),
        [raw, page, pageSize]
    );
    const [createErr, setCreateErr] = useState<string | null>(null);
    const [editErr, setEditErr] = useState<string | null>(null);

    // Creation modal & form
    const [createOpen, setCreateOpen] = useState(false);
    const [cCode, setCCode] = useState('');
    const [cType, setCType] = useState<'percent' | 'fixed'>('percent');
    const [cValue, setCValue] = useState<number | ''>(10);
    const [cCurrency, setCCurrency] = useState('KRW');
    const [cMaxUses, setCMaxUses] = useState<number | ''>('');
    const [cPerUser, setCPerUser] = useState<number | ''>('');
    const [cStart, setCStart] = useState('');
    const [cEnd, setCEnd] = useState('');

    // Editing state
    const [editId, setEditId] = useState<string | null>(null);
    const [editDraft, setEditDraft] = useState<Partial<CouponRow>>({});

    useEffect(() => {
        // page reset when query/filter changes
        setPage(1);
    }, [q, activeParam]);

    function resetFilters() {
        setQ('');
        setActiveFilter('all');
        setPage(1);
    }

    function triggerRefresh() {
        queryClient.invalidateQueries({ queryKey: ['adminCoupons'] });
    }

    function openEdit(c: CouponRow) {
        setEditId(c.id);
        setEditDraft({ ...c });
        setEditErr(null);
    }

    const updateMutation = useMutation({
        mutationFn: async (payload: { id: string; patch: Partial<CouponRow> & { code?: string } }) => {
            const { id, patch } = payload;
            const { error, data } = await supabase
                .from('coupons')
                .update({
                    code: patch.code?.trim(),
                    discount_type: patch.discount_type,
                    percent: patch.percent,
                    amount_cents: patch.amount_cents,
                    starts_at: patch.starts_at,
                    ends_at: patch.ends_at,
                    max_redemptions: patch.max_redemptions,
                    per_user_limit: patch.per_user_limit,
                    is_active: patch.is_active
                })
                .eq('id', id)
                .select('*')
                .single();

            if (error) throw error;

            return data as CouponRow;
        },
        onSuccess: () => triggerRefresh()
    });

    function commitEdit() {
        if (!editId) return false;
        if (editDraft.code && !editDraft.code.trim()) {
            setEditErr('코드 필수');

            return false;
        }
        updateMutation.mutate({
            id: editId,
            patch: {
                code: editDraft.code,
                discount_type: editDraft.discount_type as any,
                percent: (editDraft as any).percent ?? null,
                amount_cents: (editDraft as any).amount_cents ?? null,
                starts_at: (editDraft as any).starts_at ?? null,
                ends_at: (editDraft as any).ends_at ?? null,
                max_redemptions: (editDraft as any).max_redemptions ?? null,
                per_user_limit: (editDraft as any).per_user_limit ?? null,
                is_active: (editDraft as any).is_active
            }
        });
        setEditId(null);

        return true;
    }

    const toggleActiveMutation = useMutation({
        mutationFn: async (c: CouponRow) => {
            const { error } = await supabase.from('coupons').update({ is_active: !c.is_active }).eq('id', c.id);

            if (error) throw error;
        },
        onSuccess: () => triggerRefresh()
    });

    function toggleActive(c: CouponRow) {
        toggleActiveMutation.mutate(c);
    }

    const deactivateMutation = useMutation({
        mutationFn: async (c: CouponRow) => {
            const { error } = await supabase.from('coupons').update({ is_active: false }).eq('id', c.id);

            if (error) throw error;
        },
        onSuccess: () => triggerRefresh()
    });

    function softDeactivate(c: CouponRow) {
        deactivateMutation.mutate(c);
    }

    function resetCreateForm() {
        setCCode('');
        setCType('percent');
        setCValue(10);
        setCMaxUses('');
        setCPerUser('');
        setCStart('');
        setCEnd('');
    }

    const createMutation = useMutation({
        mutationFn: async (payload: {
            code: string;
            discount_type: 'percent' | 'fixed';
            percent?: number;
            amount_cents?: number;
            starts_at?: string;
            ends_at?: string;
            max_redemptions?: number;
            per_user_limit?: number;
        }) => {
            const insert: any = {
                code: payload.code.trim(),
                discount_type: payload.discount_type,
                percent: payload.discount_type === 'percent' ? (payload.percent ?? 0) : null,
                amount_cents: payload.discount_type === 'fixed' ? (payload.amount_cents ?? 0) : null,
                starts_at: payload.starts_at || null,
                ends_at: payload.ends_at || null,
                max_redemptions: payload.max_redemptions ?? null,
                per_user_limit: payload.per_user_limit ?? null
            };
            const { error } = await supabase.from('coupons').insert(insert);

            if (error) throw error;
        },
        onSuccess: () => triggerRefresh()
    });

    function createNew() {
        setCreateErr(null);
        if (!cCode.trim()) {
            setCreateErr('코드 필수');

            return false;
        }
        createMutation.mutate({
            code: cCode,
            discount_type: cType,
            percent: cType === 'percent' ? (typeof cValue === 'number' ? cValue : 0) : undefined,
            amount_cents: cType === 'fixed' ? (typeof cValue === 'number' ? cValue : 0) : undefined,
            max_redemptions: typeof cMaxUses === 'number' ? cMaxUses : undefined,
            per_user_limit: typeof cPerUser === 'number' ? cPerUser : undefined,
            starts_at: cStart || undefined,
            ends_at: cEnd || undefined
        });
        // success
        resetCreateForm();
        setCreateOpen(false);
        setPage(1);

        return true;
    }

    return {
        data,
        isLoading,
        page,
        q,
        activeFilter,
        createErr,
        editErr,
        setQ,
        setActiveFilter,
        setPage,
        setCreateErr,
        setEditErr,
        editId,
        editDraft,
        setEditDraft,
        setEditId,
        openEdit,
        commitEdit,
        toggleActive,
        softDeactivate,
        resetFilters,
        createOpen,
        setCreateOpen,
        // creation form state
        cCode,
        cType,
        cValue,
        cCurrency,
        cMaxUses,
        cPerUser,
        cStart,
        cEnd,
        setCCode,
        setCType,
        setCValue,
        setCCurrency,
        setCMaxUses,
        setCPerUser,
        setCStart,
        setCEnd,
        createNew,
        resetCreateForm,
        refresh: triggerRefresh,
        pageSize
    } as const;
}

export default useAdminCoupons;
