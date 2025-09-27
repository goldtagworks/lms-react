import { useState, useMemo } from 'react';
import { Badge, Box, Button, Card, Divider, Group, Pagination, Progress, Select, Stack, Text, Textarea } from '@mantine/core';
import { useCreateOrUpdateReview, useCourseReviews, ReviewSort } from '@main/hooks/useCourseReviews';

interface Props {
    courseId: string;
    userId?: string;
    enrolled: boolean;
}

function Stars({ value }: { value: number }) {
    return (
        <Text aria-label={`평점 ${value}`} c="yellow.7" size="xs">
            {'★'.repeat(value)}
            {'☆'.repeat(5 - value)}
        </Text>
    );
}

export default function CourseReviewsSection({ courseId, userId, enrolled }: Props) {
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState<ReviewSort>('latest');
    const [ratingInput, setRatingInput] = useState(5);
    const [commentInput, setCommentInput] = useState('');
    const { reviews, summary, pageCount } = useCourseReviews(courseId, { page, sort, pageSize: 5 });
    const { mutate, error } = useCreateOrUpdateReview(courseId, userId);

    const distributionPercents = useMemo(() => {
        const total = summary.count || 1;

        return [5, 4, 3, 2, 1].map((r) => ({ rating: r, percent: Math.round((summary.distribution[r] / total) * 100) }));
    }, [summary]);

    const canWrite = enrolled && !!userId;

    const handleSubmit = () => {
        if (!canWrite) return;
        mutate(ratingInput, commentInput.trim() || undefined);
        setCommentInput('');
    };

    return (
        <Stack gap="lg">
            <Group align="flex-start" gap="xl" wrap="wrap">
                <Card withBorder p="md" radius="md" style={{ flex: '0 0 240px' }}>
                    <Text fw={700} mb={4} size="lg">
                        평점
                    </Text>
                    <Group align="center" gap={6}>
                        <Text fw={700} size="xl">
                            {summary.avg.toFixed(1)}
                        </Text>
                        <Text c="dimmed" size="sm">
                            / 5
                        </Text>
                    </Group>
                    <Text c="dimmed" mb="sm" size="xs">
                        총 {summary.count}개 후기
                    </Text>
                    <Stack gap={4}>
                        {distributionPercents.map((row) => (
                            <Group key={row.rating} gap={8} wrap="nowrap">
                                <Text size="xs" style={{ width: 14 }} ta="right">
                                    {row.rating}
                                </Text>
                                <Progress aria-label={`${row.rating}점 비율`} size="sm" style={{ flex: 1 }} value={row.percent} />
                                <Text c="dimmed" size="10px" style={{ width: 32 }} ta="right">
                                    {row.percent}%
                                </Text>
                            </Group>
                        ))}
                    </Stack>
                </Card>
                <Box style={{ flex: 1, minWidth: 320 }}>
                    <Group justify="space-between" mb="xs">
                        <Select
                            data={[
                                { value: 'latest', label: '최신순' },
                                { value: 'ratingHigh', label: '평점 높은순' },
                                { value: 'ratingLow', label: '평점 낮은순' }
                            ]}
                            size="xs"
                            value={sort}
                            w={160}
                            onChange={(v) => v && setSort(v as ReviewSort)}
                        />
                        {pageCount > 1 && <Pagination size="xs" total={pageCount} value={page} onChange={setPage} />}
                    </Group>
                    <Stack gap="sm">
                        {reviews.length === 0 && (
                            <Text c="dimmed" size="sm">
                                아직 후기가 없습니다.
                            </Text>
                        )}
                        {reviews.map((r) => (
                            <Card key={r.id} withBorder p="sm" radius="md">
                                <Group align="center" gap={6} mb={4}>
                                    <Stars value={r.rating} />
                                    <Text c="dimmed" size="xs">
                                        {new Date(r.created_at).toLocaleDateString()}
                                    </Text>
                                </Group>
                                {r.comment && (
                                    <Text lh={1.5} size="sm">
                                        {r.comment}
                                    </Text>
                                )}
                            </Card>
                        ))}
                    </Stack>
                </Box>
            </Group>
            <Divider />
            <Box>
                <Text fw={600} mb={8} size="sm">
                    후기 작성
                </Text>
                {!canWrite && (
                    <Text c="dimmed" size="xs">
                        수강 중인 사용자만 후기를 작성할 수 있습니다.
                    </Text>
                )}
                {canWrite && (
                    <Card withBorder p="md" radius="md">
                        <Group align="center" gap="sm" mb="xs">
                            <Select
                                data={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}점` }))}
                                size="xs"
                                value={String(ratingInput)}
                                w={100}
                                onChange={(v) => v && setRatingInput(Number(v))}
                            />
                            <Stars value={ratingInput} />
                            {error && (
                                <Badge color="red" size="xs" variant="light">
                                    {error}
                                </Badge>
                            )}
                        </Group>
                        <Textarea autosize minRows={3} placeholder="(선택) 코멘트를 입력하세요" value={commentInput} onChange={(e) => setCommentInput(e.currentTarget.value)} />
                        <Group justify="flex-end" mt="sm">
                            <Button size="xs" onClick={handleSubmit}>
                                저장
                            </Button>
                        </Group>
                    </Card>
                )}
            </Box>
        </Stack>
    );
}
