import { memo } from 'react';
import { Card, Title, Badge, Group, Button, CardProps } from '@mantine/core';

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
    return (
        <Card withBorder radius="md" shadow="md" {...cardProps}>
            <Title mb="sm" order={4} size="lg">
                {title}
            </Title>
            <Badge color="gray" mb="sm" variant="light">
                {level}
            </Badge>
            <TextBody c="dimmed" mb="sm">
                응시 기준 <strong>{percent}%</strong> · {price}
            </TextBody>
            <Group align="center" justify="space-between" mt="sm">
                <TextMeta c="dimmed">
                    {weeks}주 · {lessons}차시
                </TextMeta>
                <Button color="primary" component="a" href="#detail" size="sm">
                    자세히
                </Button>
            </Group>
        </Card>
    );
};

export const CourseCard = memo(CourseCardComponent);
