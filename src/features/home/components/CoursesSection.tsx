import React, { memo } from 'react';
import { Container, Group, Title, SimpleGrid, Button } from '@mantine/core';
import { Link } from 'react-router-dom';

import { CourseCardVM } from '../../../viewmodels/home';

import { CourseCard } from './CourseCard';

interface CoursesSectionProps {
    title: string;
    courses: CourseCardVM[];
    viewAllTo?: string;
    limit?: number;
    gridCols?: { base?: number; sm?: number; md?: number; lg?: number };
}

function CoursesSectionBase({ title, courses, viewAllTo = '/courses', limit, gridCols }: CoursesSectionProps) {
    const list = limit ? courses.slice(0, limit) : courses;

    return (
        <Container py="xl" size="lg">
            <Group align="center" justify="space-between" mb="md">
                <Title order={2} size="xl">
                    {title}
                </Title>
                <Button component={Link} size="xs" to={viewAllTo} variant="subtle">
                    전체 보기
                </Button>
            </Group>
            <SimpleGrid cols={gridCols || { base: 1, sm: 2, md: 3 }} spacing="xl">
                {list.map((c) => (
                    <CourseCard key={c.id} course={c} />
                ))}
            </SimpleGrid>
        </Container>
    );
}

export const CoursesSection = memo(CoursesSectionBase);
export default CoursesSection;
