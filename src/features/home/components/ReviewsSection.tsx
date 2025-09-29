import React, { memo, useMemo, useState } from 'react';
import { Container, Title, SimpleGrid, Card, Group, Button, Tooltip } from '@mantine/core';
import { TextBody, TextMeta } from '@main/components/typography';

import { ReviewVM } from '../../../viewmodels/home';
import { selectBestReviews } from '../utils/reviewScoring';

// TODO i18n: 문자열 키 추출 필요
function formatRelative(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        const now = Date.now();
        const days = Math.floor((now - d.getTime()) / 86400000);

        if (days < 1) return '오늘';
        if (days < 30) return `${days}일 전`;

        const months = Math.floor(days / 30);

        if (months < 12) return `${months}개월 전`;

        const years = Math.floor(months / 12);

        return `${years}년 전`;
    } catch {
        return dateStr;
    }
}

function StarRating({ value }: { value: number }) {
    const full = Math.round(value);
    const stars = Array.from({ length: 5 }, (_, i) => (i < full ? '★' : '☆')).join(' ');

    return (
        <TextBody aria-label={`평점 ${value}점 (5점 만점)`} c="yellow.7" fw={600} sizeOverride="sm" style={{ letterSpacing: 1 }}>
            {stars} <span style={{ fontWeight: 400, marginLeft: 4 }}>{value.toFixed(1)}</span>
        </TextBody>
    );
}

interface ReviewsSectionProps {
    reviews: ReviewVM[];
    title?: string;
    limit?: number;
}

function ReviewsSectionBase({ reviews, title = '실제 수강생 후기', limit = 6 }: ReviewsSectionProps) {
    const best = useMemo(() => selectBestReviews(reviews, { limit, perCourse: 1 }), [reviews, limit]);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    function toggle(id: string) {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    }

    return (
        <Container py="xl" size="lg">
            <Title mb="md" order={2} size={24}>
                {title}
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 2 }} spacing="lg">
                {best.map((r) => {
                    const isLong = (r.comment?.length || 0) > 180;
                    const showFull = expanded[r.id];
                    const displayComment = !r.comment ? '' : showFull || !isLong ? r.comment : r.comment.slice(0, 180) + '…';

                    return (
                        <Card key={r.id} withBorder aria-labelledby={`review-${r.id}-user`} component="article" p="lg" radius="md" shadow="sm">
                            <Group justify="space-between" mb={4}>
                                <TextBody fw={700} sizeOverride="sm">
                                    {r.user_name || r.user_id}
                                </TextBody>
                                <StarRating value={r.rating} />
                            </Group>
                            <Tooltip withArrow label={new Date(r.created_at).toISOString().slice(0, 10)}>
                                <TextMeta mb={8}>{formatRelative(r.created_at)}</TextMeta>
                            </Tooltip>
                            {displayComment && <TextBody style={{ lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{displayComment}</TextBody>}
                            {isLong && (
                                <Button mt={6} size="compact-xs" variant="subtle" onClick={() => toggle(r.id)}>
                                    {showFull ? '접기' : '더보기'}
                                </Button>
                            )}
                            {r.course_title && (
                                <TextBody c="blue.6" fw={500} mt={10} sizeOverride="sm">
                                    {r.course_title}
                                </TextBody>
                            )}
                        </Card>
                    );
                })}
            </SimpleGrid>
        </Container>
    );
}

export const ReviewsSection = memo(ReviewsSectionBase);

export default ReviewsSection;
