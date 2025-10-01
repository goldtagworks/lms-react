import { memo } from 'react';
import { Card, Title, Badge, Group, Button, CardProps } from '@mantine/core';
import { useI18n } from '@main/lib/i18n';

import { TextBody, TextMeta } from './typography';

interface CourseCardProps extends CardProps {
    title: string;
    level: string;
    percent: number;
    price: string;
    weeks: number;
    lessons: number;
}

const CourseCardComponent = ({ title, level, percent, price, weeks, lessons, ...cardProps }: CourseCardProps) => {
    const { t } = useI18n();

    return (
        <Card withBorder radius="lg" shadow="md" {...cardProps}>
            <Title mb="sm" order={4} size="lg">
                {title}
            </Title>
            <Badge color="gray" mb="sm" variant="light">
                {level}
            </Badge>
            <TextBody c="dimmed" mb="sm">
                {t('course.examCriteria', { percent, price })}
            </TextBody>
            <Group align="center" justify="space-between" mt="sm">
                <TextMeta c="dimmed">{t('course.durationSummary', { weeks, lessons })}</TextMeta>
                <Button color="primary" component="a" href="#detail" size="sm">
                    {t('terms.viewDetails')}
                </Button>
            </Group>
        </Card>
    );
};

export const CourseCard = memo(CourseCardComponent);
