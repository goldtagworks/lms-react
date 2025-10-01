import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@main/lib/supabase';
import { mapSupabaseError } from '@main/lib/errors';

interface UpsertInput {
    id?: string;
    title: string;
    body?: string;
    pinned?: boolean;
    published?: boolean;
}

async function createNotice(input: UpsertInput) {
    const { data, error } = await supabase
        .from('notices')
        .insert({ title: input.title, body: input.body ?? null, pinned: !!input.pinned, published: input.published ?? true })
        .select('*')
        .single();

    if (error) throw mapSupabaseError(error);

    return data;
}

async function updateNoticeMutation(input: UpsertInput) {
    if (!input.id) throw new Error('id required');
    const { data, error } = await supabase
        .from('notices')
        .update({ title: input.title, body: input.body ?? null, pinned: !!input.pinned, published: input.published ?? true })
        .eq('id', input.id)
        .select('*')
        .single();

    if (error) throw mapSupabaseError(error);

    return data;
}

async function deleteNoticeMutation(id: string) {
    const { error } = await supabase.from('notices').delete().eq('id', id);

    if (error) throw mapSupabaseError(error);

    return true;
}

async function togglePinMutation(id: string) {
    // 읽어와서 토글 (경쟁 조건 단순) → 필요시 RPC로 변경
    const { data: current, error: selErr } = await supabase.from('notices').select('pinned').eq('id', id).single();

    if (selErr) throw mapSupabaseError(selErr);
    const { data, error } = await supabase.from('notices').update({ pinned: !current.pinned }).eq('id', id).select('*').single();

    if (error) throw mapSupabaseError(error);

    return data;
}

export function useNoticeMutations() {
    const qc = useQueryClient();
    const invalidate = () => qc.invalidateQueries({ queryKey: ['notices'] });

    const create = useMutation({
        mutationFn: createNotice,
        onSuccess: () => invalidate()
    });
    const update = useMutation({
        mutationFn: updateNoticeMutation,
        onSuccess: () => invalidate()
    });
    const remove = useMutation({
        mutationFn: deleteNoticeMutation,
        onSuccess: () => invalidate()
    });
    const togglePin = useMutation({
        mutationFn: togglePinMutation,
        onSuccess: () => invalidate()
    });

    return { create, update, remove, togglePin } as const;
}
