import { Notice } from '@main/types/notice';
import { useState, useEffect } from 'react';
// In-memory demo seed (sessionStorage persistence optional later)
const seed: Notice[] = [
    {
        id: 'n1',
        title: '시스템 점검 안내 (10/15 02:00~03:00)',
        body: '더 안정적인 서비스를 위해 1시간 동안 점검이 진행됩니다. 점검 중 결제/수강이 일시 제한될 수 있습니다.',
        created_at: new Date().toISOString(),
        pinned: true
    },
    {
        id: 'n2',
        title: '신규 카테고리 AI/ML 오픈',
        body: 'AI/ML 관련 20여 개 강의를 순차적으로 공개합니다. 많은 관심 부탁드립니다.',
        created_at: new Date(Date.now() - 86400000).toISOString()
    }
];

let notices: Notice[] = [...seed];
const noticeListeners = new Set<() => void>();

function bumpNotices() {
    noticeListeners.forEach((l) => {
        try {
            l();
        } catch {
            // swallow
        }
    });
}

export function listNotices(): Notice[] {
    return [...notices].sort((a, b) => Number(b.pinned || 0) - Number(a.pinned || 0) || b.created_at.localeCompare(a.created_at));
}

export function getNotice(id: string): Notice | undefined {
    return notices.find((n) => n.id === id);
}

export function addNotice(input: Omit<Notice, 'id' | 'created_at'>): Notice {
    const n: Notice = { id: 'n' + (Date.now() + Math.floor(Math.random() * 1000)), created_at: new Date().toISOString(), ...input };

    notices = [n, ...notices];

    bumpNotices();

    return n;
}

export function updateNotice(id: string, patch: Partial<Omit<Notice, 'id' | 'created_at'>>): Notice | undefined {
    let updated: Notice | undefined;

    notices = notices.map((n) => {
        if (n.id === id) {
            updated = { ...n, ...patch };

            return updated;
        }

        return n;
    });

    if (updated) bumpNotices();

    return updated;
}

export function deleteNotice(id: string): boolean {
    const len = notices.length;

    notices = notices.filter((n) => n.id !== id);

    if (notices.length !== len) bumpNotices();

    return notices.length !== len;
}

export function togglePin(id: string): Notice | undefined {
    const target = getNotice(id);

    if (!target) return undefined;

    return updateNotice(id, { pinned: !target.pinned });
}

export function clearNotices() {
    notices = [];
    bumpNotices();
}

// Hook for reactive single notice

export function useNotice(id: string | undefined) {
    const [notice, setNotice] = useState<Notice | undefined>(() => (id ? getNotice(id) : undefined));

    useEffect(() => {
        if (id) setNotice(getNotice(id));
    }, [id]);

    useEffect(() => {
        const fn = () => {
            if (id) setNotice(getNotice(id));
        };

        noticeListeners.add(fn);

        return () => {
            noticeListeners.delete(fn);
        };
    }, [id]);

    return notice;
}

// Reactive list hook
export function useNotices() {
    const [items, setItems] = useState<Notice[]>(() => listNotices());

    useEffect(() => {
        const fn = () => setItems(listNotices());

        noticeListeners.add(fn);

        return () => {
            noticeListeners.delete(fn);
        };
    }, []);

    return items;
}
