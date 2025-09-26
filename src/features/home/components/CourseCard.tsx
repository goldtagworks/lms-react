import React, { memo } from 'react';
import { Card, Title, Text, Group, Button } from '@mantine/core';
import { Link } from 'react-router-dom';

import { CourseCardVM } from '../../../viewmodels/home';

interface CourseCardProps {
    course: CourseCardVM;
    to?: string; // 상세 페이지 링크 (기본 /course/:id)
}

function CourseCardBase({ course, to }: CourseCardProps) {
    const finalLink = to || `/course/${course.id}`;
    const hasDiscount = !!course.sale_price_cents && course.sale_price_cents < course.list_price_cents;

    return (
        <Card withBorder p="lg" radius="md" shadow="md">
            {course.thumbnail_url && <img alt={course.title} src={course.thumbnail_url} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 12, marginBottom: 16 }} />}
            <Title mb={4} order={4} size={20}>
                {course.title}
            </Title>
            {course.summary && (
                <Text c="dimmed" lineClamp={2} mb={4} size="sm">
                    {course.summary}
                </Text>
            )}
            <Group gap={4} mb={4}>
                {course.tags?.map((tag) => (
                    <Text key={tag} bg="#e0e7ff" c="blue.6" px={8} py={2} size="xs" style={{ borderRadius: 8 }}>
                        {tag}
                    </Text>
                ))}
            </Group>
            <Group align="center" gap={8} mb={4}>
                <Text c={hasDiscount ? 'red.6' : 'dark'} fw={700} size="lg">
                    {course.effectivePriceCents.toLocaleString()}원
                </Text>
                {hasDiscount && (
                    <Text c="dimmed" size="sm" style={{ textDecoration: 'line-through' }}>
                        {course.list_price_cents.toLocaleString()}원
                    </Text>
                )}
            </Group>
            <Group align="center" gap={8} mb={8}>
                {course.avg_rating && (
                    <Text c="yellow.7" size="sm">
                        ★ {course.avg_rating.toFixed(1)}
                    </Text>
                )}
                {course.student_count && (
                    <Text c="dimmed" size="xs">
                        수강생 {course.student_count.toLocaleString()}명
                    </Text>
                )}
            </Group>
            <Button fullWidth component={Link} mt="sm" radius="md" to={finalLink} variant="light">
                자세히 보기
            </Button>
        </Card>
    );
}

export const CourseCard = memo(CourseCardBase);
export default CourseCard;
