import type { PaginatedResult } from '@main/types/pagination';
import type { CourseReview } from '@main/types/review';

import { useState, useMemo } from 'react';
import { Badge, Box, Button, Card, Divider, Group, Progress, Select, Stack, Textarea } from '@mantine/core';
import { TextTitle, TextBody, TextMeta } from '@main/components/typography';
import { useCreateOrUpdateReview } from '@main/hooks/course/useCourseReviews'; // mutate 재사용 (legacy hook 중 유지되는 부분)
import { ReviewSort } from '@main/hooks/course/useCourseReviewsPaged';
import { useCourseRatingSummaryState } from '@main/lib/repository';
import { Save } from 'lucide-react';
import { useI18n } from '@main/lib/i18n';

interface Props {
    courseId: string;
    userId?: string;
    enrolled: boolean;
    data: PaginatedResult<CourseReview> | undefined; // 외부에서 제공되는 표준 페이지네이션 결과
    sort: ReviewSort;
    onChangeSort: (s: ReviewSort) => void;
}

function Stars({ value }: { value: number }) {
    return (
        <TextMeta aria-label={`평점 ${value}`} c="yellow.7">
            {'★'.repeat(value)}
            {'☆'.repeat(5 - value)}
        </TextMeta>
    );
}

export default function CourseReviewsSection({ courseId, userId, enrolled, data, sort, onChangeSort }: Props) {
    const [ratingInput, setRatingInput] = useState(5);
    const [commentInput, setCommentInput] = useState('');
    const { mutate, error } = useCreateOrUpdateReview(courseId, userId);
    const summary = useCourseRatingSummaryState(courseId);

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

    const { t } = useI18n();

    return (
        <Stack gap="lg">
            <Group align="flex-start" gap="xl" wrap="wrap">
                <Card withBorder p="md" radius="lg" style={{ flex: '0 0 240px' }}>
                    <TextTitle fw={700} mb={4} sizeOverride="lg">
                        {t('review.ratingLabel', undefined, '평점')}
                    </TextTitle>
                    <Group align="center" gap={6}>
                        <TextTitle fw={700} sizeOverride="xl">
                            {summary.avg.toFixed(1)}
                        </TextTitle>
                        <TextMeta c="dimmed" sizeOverride="sm">
                            {t('review.ratingOutOf', undefined, '/ 5')}
                        </TextMeta>
                    </Group>
                    <TextBody c="dimmed" mb="sm">
                        {t('review.count', { count: summary.count }, `리뷰 ${summary.count}개`)}
                    </TextBody>
                    <Stack gap={4}>
                        {distributionPercents.map((row) => (
                            <Group key={row.rating} gap={8} wrap="nowrap">
                                <TextMeta style={{ width: 14 }} ta="right">
                                    {row.rating}
                                </TextMeta>
                                <Progress aria-label={t('review.ratingAria', { rating: row.rating }, `${row.rating}점 비율`)} size="sm" style={{ flex: 1 }} value={row.percent} />
                                <TextMeta c="dimmed" sizeOverride="10px" style={{ width: 32 }} ta="right">
                                    {row.percent}%
                                </TextMeta>
                            </Group>
                        ))}
                    </Stack>
                </Card>
                <Box style={{ flex: 1, minWidth: 320 }}>
                    <Group justify="space-between" mb="xs">
                        <Select
                            data={[
                                { value: 'latest', label: t('review.sort.latest', undefined, '최신순') },
                                { value: 'ratingHigh', label: t('review.sort.ratingHigh', undefined, '평점 높은순') },
                                { value: 'ratingLow', label: t('review.sort.ratingLow', undefined, '평점 낮은순') }
                            ]}
                            radius="md"
                            size="sm"
                            value={sort}
                            w={160}
                            onChange={(v) => v && onChangeSort(v as ReviewSort)}
                        />
                    </Group>
                    <Stack gap="sm">
                        {(!data || data.items.length === 0) && <TextBody c="dimmed">{t('review.none', undefined, '아직 후기가 없습니다')}</TextBody>}
                        {data?.items.map((r) => (
                            <Card key={r.id} withBorder p="sm" radius="lg">
                                <Group align="center" gap={6} mb={4}>
                                    <Stars value={r.rating} />
                                    <TextMeta>{new Date(r.created_at).toLocaleDateString()}</TextMeta>
                                </Group>
                                {r.comment && <TextBody lh={1.5}>{r.comment}</TextBody>}
                            </Card>
                        ))}
                    </Stack>
                </Box>
            </Group>
            <Divider />
            <Box>
                <TextTitle fw={600} mb={8}>
                    {t('review.write', undefined, '후기 작성')}
                </TextTitle>
                {!canWrite && <TextBody c="dimmed">{t('review.onlyEnrolled', undefined, '수강 중인 사용자만 후기를 작성할 수 있습니다')}</TextBody>}
                {canWrite && (
                    <Card withBorder p="md" radius="lg">
                        <Group align="center" gap="sm" mb="xs">
                            <Select
                                data={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: t('review.form.ratingValue', { rating: n }, `${n}점`) }))}
                                radius="md"
                                size="sm"
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
                        <Textarea
                            autosize
                            minRows={3}
                            placeholder={t('review.form.commentPlaceholder', undefined, '(선택) 코멘트를 입력하세요')}
                            radius="md"
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.currentTarget.value)}
                        />
                        <Group justify="flex-end" mt="sm">
                            <Button leftSection={<Save size={16} />} size="sm" onClick={handleSubmit}>
                                {t('common.save', undefined, '저장')}
                            </Button>
                        </Group>
                    </Card>
                )}
            </Box>
        </Stack>
    );
}
