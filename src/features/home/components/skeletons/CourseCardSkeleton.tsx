import React, { memo } from 'react';
import { Card, Skeleton, Stack, Group } from '@mantine/core';

function CourseCardSkeletonBase() {
    return (
        <Card withBorder p={{ base: 'lg', md: 'xl' }} radius="lg" shadow="sm">
            <Skeleton h={160} mb={16} radius={12} />
            <Stack gap={8}>
                <Skeleton h={20} w="80%" />
                <Skeleton h={14} w="60%" />
                <Group gap={4}>
                    <Skeleton h={18} radius="xl" w={60} />
                    <Skeleton h={18} radius="xl" w={50} />
                </Group>
                <Skeleton h={24} w="40%" />
                <Skeleton h={14} w="50%" />
                <Skeleton h={36} mt={8} radius="md" />
            </Stack>
        </Card>
    );
}

export const CourseCardSkeleton = memo(CourseCardSkeletonBase);

export default CourseCardSkeleton;
