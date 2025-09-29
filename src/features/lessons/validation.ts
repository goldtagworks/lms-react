import type { Lesson } from '@main/types/lesson';

import { t } from '@main/lib/i18n';

import { YOUTUBE_REGEX } from './constants';

export function validateLessonTitle(title: string): string | null {
    const trimmed = title.trim();

    if (trimmed.length < 2) return t('validation.lesson.title.min');
    if (trimmed.length > 150) return t('validation.lesson.title.max');

    return null;
}

export function validateDuration(seconds: number): string | null {
    if (seconds < 0) return t('validation.lesson.duration.min');
    if (seconds > 60 * 60 * 5) return t('validation.lesson.duration.max');

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
