import type { Lesson } from '@main/types/lesson';

import { YOUTUBE_REGEX } from './constants';

export function validateLessonTitle(title: string): string | null {
    const t = title.trim();

    if (t.length < 2) return '제목은 2글자 이상이어야 합니다.';
    if (t.length > 150) return '제목은 150자를 넘을 수 없습니다.';

    return null;
}

export function validateDuration(seconds: number): string | null {
    if (seconds < 0) return '길이는 0 이상이어야 합니다.';
    if (seconds > 60 * 60 * 5) return '5시간을 초과할 수 없습니다.';

    return null;
}

export function isYouTubeUrl(url: string): boolean {
    return YOUTUBE_REGEX.test(url);
}

export function normalizeVideoUrl(url: string): string {
    return url.trim();
}

export function parseAttachments(raw: string): string[] | undefined {
    const r = raw.trim();

    if (!r) return undefined;
    const arr = r
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    return arr.length ? arr : undefined;
}

export function formatAttachments(attachments: Lesson['attachments']): string {
    if (!Array.isArray(attachments)) return '';

    return (attachments as any[]).join(',');
}
