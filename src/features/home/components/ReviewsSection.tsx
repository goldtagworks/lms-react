import React, { memo, useMemo, useState } from 'react';
import { Container, Title, SimpleGrid, Card, Text, Group, Button, Tooltip } from '@mantine/core';

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
        <Text aria-label={`평점 ${value}점 (5점 만점)`} c="yellow.7" fw={600} size="sm" style={{ letterSpacing: 1 }}>
            {stars}{' '}
            <Text component="span" fw={400} size="xs" style={{ marginLeft: 4 }}>
                {value.toFixed(1)}
            </Text>
        </Text>
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
                                <Text fw={700} id={`review-${r.id}-user`} size="sm">
                                    {r.user_name || r.user_id}
                                </Text>
                                <StarRating value={r.rating} />
                            </Group>
                            <Tooltip withArrow label={new Date(r.created_at).toISOString().slice(0, 10)}>
                                <Text c="dimmed" mb={8} size="xs">
                                    {formatRelative(r.created_at)}
                                </Text>
                            </Tooltip>
                            {displayComment && (
                                <Text size="sm" style={{ lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                                    {displayComment}
                                </Text>
                            )}
                            {isLong && (
                                <Button mt={6} size="compact-xs" variant="subtle" onClick={() => toggle(r.id)}>
                                    {showFull ? '접기' : '더보기'}
                                </Button>
                            )}
                            {r.course_title && (
                                <Text c="blue.6" fw={500} mt={10} size="xs">
                                    {r.course_title}
                                </Text>
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
