import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@main/lib/supabase';
import { qk } from '@main/lib/queryKeys';

export interface CategoryRow {
    id: string;
    slug: string;
    name: string;
}

export interface UseAdminCategoriesOptions {
    pageSize?: number;
}

function slugify(name: string) {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

async function fetchCategories(): Promise<CategoryRow[]> {
    const { data, error } = await supabase.from('categories').select('id,slug,name').order('name', { ascending: true });

    if (error) throw error;

    return (data as CategoryRow[]) || [];
}

export function useAdminCategories({ pageSize = 15 }: UseAdminCategoriesOptions = {}) {
    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    const [createOpen, setCreateOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [renameId, setRenameId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const qc = useQueryClient();

    const query = useQuery({ queryKey: qk.categories(), queryFn: fetchCategories, staleTime: 60_000 });
    const items = query.data || [];

    const filtered = useMemo(() => {
        if (!q.trim()) return items;
        const qq = q.trim().toLowerCase();

        return items.filter((c) => c.name.toLowerCase().includes(qq) || c.slug.toLowerCase().includes(qq));
    }, [items, q]);

    const paged = useMemo(() => {
        const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
        const safe = Math.min(page, totalPages);
        const slice = filtered.slice((safe - 1) * pageSize, safe * pageSize);

        return { items: slice, totalPages, page: safe };
    }, [filtered, page, pageSize]);

    function resetFilters() {
        setQ('');
        setPage(1);
    }

    function invalidate() {
        qc.invalidateQueries({ queryKey: qk.categories() });
    }

    const createMut = useMutation({
        mutationFn: async (name: string) => {
            const base = slugify(name);
            let candidate = base;
            let i = 1;

            // 간단 충돌 회피: 최대 20회 시도
            while (i < 20) {
                const { data: exists, error } = await supabase.from('categories').select('id').eq('slug', candidate).limit(1);

                if (error) throw error;
                if (!exists || exists.length === 0) break;
                candidate = `${base}-${i++}`;
            }
            const { error } = await supabase.from('categories').insert({ name, slug: candidate });

            if (error) throw error;
        },
        onSuccess: () => {
            invalidate();
            setNewName('');
            setCreateOpen(false);
        },
        onError: (e: any) => setErrorMsg(e.message || 'error')
    });

    function handleCreate() {
        if (!newName.trim()) {
            setErrorMsg('이름 필수');

            return;
        }
        createMut.mutate(newName.trim());
    }

    const renameMut = useMutation({
        mutationFn: async ({ id, name }: { id: string; name: string }) => {
            const { error } = await supabase.from('categories').update({ name }).eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            invalidate();
            setRenameId(null);
        },
        onError: (e: any) => setErrorMsg(e.message || 'error')
    });

    function startRename(cat: CategoryRow) {
        setRenameId(cat.id);
        setRenameValue(cat.name);
    }
    function commitRename() {
        if (!renameId) return;
        const name = renameValue.trim();

        if (!name) return;
        renameMut.mutate({ id: renameId, name });
    }

    // 삭제 기능 필요 시 구현 (스키마 상 soft delete 컬럼 없음) → 추후 확장 지점

    return {
        items: paged.items,
        page: paged.page,
        totalPages: paged.totalPages,
        filteredCount: filtered.length,
        // filters
        q,
        setQ,
        resetFilters,
        // pagination
        setPage,
        pageSize,
        // create
        createOpen,
        setCreateOpen,
        newName,
        setNewName,
        handleCreate,
        creating: createMut.isPending,
        // rename
        renameId,
        renameValue,
        setRenameValue,
        setRenameId,
        startRename,
        commitRename,
        renaming: renameMut.isPending,
        // error & state
        errorMsg,
        setErrorMsg,
        isLoading: query.isLoading,
        refresh: invalidate
    } as const;
}

export default useAdminCategories;
