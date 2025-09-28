import { useEffect, useMemo, useState } from 'react';
import { listCategories, createCategory, moveCategory, updateCategory, deactivateCategory, CategoryItem } from '@main/lib/repository';

export type CategoryActiveFilter = 'all' | 'active' | 'inactive';

interface UseAdminCategoriesOptions {
    pageSize?: number;
}

export function useAdminCategories({ pageSize = 15 }: UseAdminCategoriesOptions = {}) {
    const [items, setItems] = useState<CategoryItem[]>([]);
    const [q, setQ] = useState('');
    const [filterActive, setFilterActive] = useState<CategoryActiveFilter>('all');
    const [page, setPage] = useState(1);
    const [revision, setRevision] = useState(0);

    const [createOpen, setCreateOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [creatingErr, setCreatingErr] = useState<string | null>(null);
    const [renameId, setRenameId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');

    useEffect(() => {
        setItems(listCategories());
    }, [revision]);

    const filtered = useMemo(() => {
        return items
            .filter((c) => (filterActive === 'all' ? true : filterActive === 'active' ? c.active : !c.active))
            .filter((c) => {
                if (!q.trim()) return true;
                const qq = q.trim().toLowerCase();

                return c.name.toLowerCase().includes(qq) || c.slug.toLowerCase().includes(qq);
            });
    }, [items, q, filterActive]);

    const pagedCalc = useMemo(() => {
        const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
        const pageSafe = Math.min(page, totalPages);
        const slice = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

        return { items: slice, totalPages, page: pageSafe };
    }, [filtered, page, pageSize]);

    function resetFilters() {
        setQ('');
        setFilterActive('all');
        setPage(1);
    }

    function refresh() {
        setRevision((r) => r + 1);
    }

    function handleCreate() {
        setCreatingErr(null);
        if (!newName.trim()) {
            setCreatingErr('이름 필수');

            return;
        }
        const r = createCategory(newName.trim());

        if ('error' in r) {
            setCreatingErr(r.error || 'error');

            return;
        }
        setNewName('');
        setCreateOpen(false);
        refresh();
        setPage(1);
    }

    function startRename(cat: CategoryItem) {
        setRenameId(cat.id);
        setRenameValue(cat.name);
    }
    function commitRename() {
        if (!renameId) return;
        const name = renameValue.trim();

        if (!name) return;
        updateCategory(renameId, { name });
        setRenameId(null);
        refresh();
        setPage(1);
    }

    function toggleActive(cat: CategoryItem) {
        updateCategory(cat.id, { active: !cat.active });
        refresh();
    }

    function deactivate(cat: CategoryItem) {
        deactivateCategory(cat.id);
        refresh();
    }

    function move(cat: CategoryItem, dir: 'up' | 'down') {
        moveCategory(cat.id, dir);
        refresh();
    }

    return {
        // data
        items: pagedCalc.items,
        page: pagedCalc.page,
        totalPages: pagedCalc.totalPages,
        filteredCount: filtered.length,
        // filters
        q,
        filterActive,
        setQ,
        setFilterActive,
        resetFilters,
        // pagination
        setPage,
        pageSize,
        // creation
        createOpen,
        setCreateOpen,
        newName,
        setNewName,
        creatingErr,
        setCreatingErr,
        handleCreate,
        // rename
        renameId,
        renameValue,
        setRenameValue,
        setRenameId,
        startRename,
        commitRename,
        // actions
        toggleActive,
        deactivate,
        move,
        refresh
    } as const;
}

export default useAdminCategories;
