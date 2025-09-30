import React, { memo } from 'react';
import { Card, Title, Text, Group, Button } from '@mantine/core';
import { Eye } from 'lucide-react';
import { TagChip } from '@main/components/TagChip';
import { Link } from 'react-router-dom';
import { AppImage } from '@main/components/AppImage';
import { useI18n } from '@main/lib/i18n';

import { CourseCardVM } from '../../../viewmodels/home';

interface CourseCardProps {
    course: CourseCardVM;
    to?: string; // 상세 페이지 링크 (기본 /course/:id)
}

function CourseCardBase({ course, to }: CourseCardProps) {
    const finalLink = to || `/course/${course.id}`;
    const { t } = useI18n();
    const hasDiscount = !!course.sale_price_cents && course.sale_price_cents < course.list_price_cents;

    return (
        <Card withBorder p="lg" radius="md" shadow="md">
            {course.thumbnail_url && <AppImage alt={course.title} height={160} mb="md" radius="lg" src={course.thumbnail_url || ''} width="100%" />}

            <Title mb={4} order={4} size="md">
                {course.title}
            </Title>
            {course.summary && (
                <Text c="dimmed" lineClamp={2} mb={4} size="sm">
                    {course.summary}
                </Text>
            )}
            <Group gap={4} mb={4}>
                {course.tags?.map((tag) => (
                    <TagChip key={tag} label={tag} />
                ))}
            </Group>
            <Group align="center" gap={8} mb={4}>
                <Text c={hasDiscount ? 'red.6' : 'dark'} fw={700} size="lg">
                    {course.effectivePriceCents.toLocaleString()}
                    {t('price.currencyWon', undefined, '원').replace('{{value}}', '')}
                </Text>
                {hasDiscount && (
                    <Text c="dimmed" className="text-strike" size="sm">
                        {course.list_price_cents.toLocaleString()}
                        {t('price.currencyWon', undefined, '원').replace('{{value}}', '')}
                    </Text>
                )}
            </Group>
            <Group align="center" gap={8} mb={8}>
                {course.avg_rating && (
                    <Text c="yellow.7" size="sm">
                        ★ {t('home.card.rating', { rating: course.avg_rating.toFixed(1) }, `평점 ${course.avg_rating.toFixed(1)}`)}
                    </Text>
                )}
                {course.student_count && (
                    <Text c="dimmed" size="sm">
                        {t('home.card.students', { count: course.student_count.toLocaleString() }, `수강생 ${course.student_count.toLocaleString()}명`)}
                    </Text>
                )}
            </Group>
            <Button fullWidth component={Link} leftSection={<Eye size={16} />} mt="sm" radius="md" size="sm" to={finalLink} variant="light">
                {t('terms.viewDetails')}
            </Button>
        </Card>
    );
}

export const CourseCard = memo(CourseCardBase);
export default CourseCard;
