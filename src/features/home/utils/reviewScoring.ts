import { ReviewVM } from '@main/viewmodels/home';

/**
 * 임시 베스트 리뷰 점수 계산 로직 (클라이언트 가중치) - 서버 이전 예정
 * score = rating * 1.5 + commentLengthNorm * 0.7 + recencyBonus
 */
export function computeReviewScore(r: ReviewVM, now = Date.now()): number {
    const ratingPart = (r.rating || 0) * 1.5;
    const commentLen = r.comment?.trim().length || 0;
    const commentNorm = Math.min(commentLen / 200, 1) * 0.7; // 200자 기준 캡
    const days = (now - new Date(r.created_at).getTime()) / 86400000;
    let recency = -0.2;

    if (days < 30) recency = 0.6;
    else if (days < 90) recency = 0.2;

    return ratingPart + commentNorm + recency;
}

/** 다양성 확보: 코스별 최대 perCourse 개수만 선별 (정렬된 리스트 입력 가정) */
export function diversifyReviews(sorted: ReviewVM[], perCourse = 1, limit = 6): ReviewVM[] {
    const used: Record<string, number> = {};
    const out: ReviewVM[] = [];

    for (const r of sorted) {
        const cid = r.course_id || 'unknown';

        if ((used[cid] || 0) >= perCourse) continue;
        used[cid] = (used[cid] || 0) + 1;
        out.push(r);
        if (out.length >= limit) break;
    }

    return out;
}

export interface BestReviewOptions {
    limit?: number;
    perCourse?: number;
}

export function selectBestReviews(reviews: ReviewVM[], opts: BestReviewOptions = {}): ReviewVM[] {
    const { limit = 6, perCourse = 1 } = opts;
    const scored = reviews
        .map((r) => ({ r, s: computeReviewScore(r) }))
        .sort((a, b) => b.s - a.s)
        .map((x) => x.r);

    return diversifyReviews(scored, perCourse, limit);
}
