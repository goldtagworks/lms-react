import { useEffect, useMemo, useState } from 'react';
import { deactivateCoupon, listCouponsPaged, updateCoupon, createCoupon, Coupon } from '@main/lib/repository';

export type CouponActiveFilter = 'all' | 'active' | 'inactive';

interface UseAdminCouponsOptions {
    pageSize?: number;
}

export function useAdminCoupons({ pageSize = 20 }: UseAdminCouponsOptions = {}) {
    const [q, setQ] = useState('');
    const [activeFilter, setActiveFilter] = useState<CouponActiveFilter>('all');
    const [page, setPage] = useState(1);
    const [revision, setRevision] = useState(0);

    const activeParam = useMemo(() => (activeFilter === 'all' ? undefined : activeFilter === 'active'), [activeFilter]);
    const [paged, setPaged] = useState(() => listCouponsPaged({ q: undefined, active: activeParam }, 1, pageSize));
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
    const [editDraft, setEditDraft] = useState<Partial<Coupon>>({});

    useEffect(() => {
        const res = listCouponsPaged({ q: q.trim() || undefined, active: activeParam }, page, pageSize);

        setPaged(res);
        if (page !== res.page) setPage(res.page); // auto correct
    }, [q, activeParam, page, pageSize, revision]);

    function resetFilters() {
        setQ('');
        setActiveFilter('all');
        setPage(1);
    }

    function triggerRefresh() {
        setRevision((r) => r + 1);
    }

    function openEdit(c: Coupon) {
        setEditId(c.id);
        setEditDraft({ ...c });
        setEditErr(null);
    }

    function commitEdit() {
        if (!editId) return false;
        if (editDraft.code && !editDraft.code.trim()) {
            setEditErr('코드 필수');

            return false;
        }
        const r = updateCoupon(editId, {
            code: editDraft.code,
            type: editDraft.type,
            value: editDraft.value,
            currency_code: editDraft.currency_code,
            max_uses: editDraft.max_uses,
            per_user_limit: editDraft.per_user_limit,
            starts_at: editDraft.starts_at,
            ends_at: editDraft.ends_at,
            active: editDraft.active
        });

        if ('error' in r) {
            setEditErr(r.error || 'error');

            return false;
        }
        setEditId(null);
        triggerRefresh();

        return true;
    }

    function toggleActive(c: Coupon) {
        updateCoupon(c.id, { active: !c.active });
        triggerRefresh();
    }

    function softDeactivate(c: Coupon) {
        deactivateCoupon(c.id);
        triggerRefresh();
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

    function createNew() {
        setCreateErr(null);
        if (!cCode.trim()) {
            setCreateErr('코드 필수');

            return false;
        }
        const r = createCoupon({
            code: cCode.trim(),
            type: cType,
            value: typeof cValue === 'number' ? cValue : 0,
            currency_code: cType === 'fixed' ? cCurrency : undefined,
            max_uses: typeof cMaxUses === 'number' ? cMaxUses : undefined,
            per_user_limit: typeof cPerUser === 'number' ? cPerUser : undefined,
            starts_at: cStart || undefined,
            ends_at: cEnd || undefined
        });

        if ('error' in r) {
            setCreateErr(r.error || 'error');

            return false;
        }
        // success
        resetCreateForm();
        setCreateOpen(false);
        triggerRefresh();
        setPage(1);

        return true;
    }

    return {
        paged,
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
