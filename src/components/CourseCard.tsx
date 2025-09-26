import { Card, Title, Badge, Text, Group, Button, CardProps } from '@mantine/core';
import { memo } from 'react';

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
            <Title mb="xs" order={4} size={18}>
                {title}
            </Title>
            <Badge color="gray" mb="xs" variant="light">
                {level}
            </Badge>
            <Text c="dimmed" mb="xs" size="sm">
                응시 기준 <strong>{percent}%</strong> · {price}
            </Text>
            <Group align="center" justify="space-between" mt="sm">
                <Text c="dimmed" size="sm">
                    {weeks}주 · {lessons}차시
                </Text>
                <Button color="primary" component="a" href="#detail" size="xs">
                    자세히
                </Button>
            </Group>
        </Card>
    );
};

export const CourseCard = memo(CourseCardComponent);
