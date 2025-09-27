export interface Notice {
    id: string; // n1, n2...
    title: string;
    body: string;
    created_at: string; // ISO timestamp
    pinned?: boolean;
}

export type NoticeSummary = Pick<Notice, 'id' | 'title' | 'created_at' | 'pinned'>;
