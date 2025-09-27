import React, { memo } from 'react';
import { Card, Skeleton, Stack } from '@mantine/core';

function InstructorCardSkeletonBase() {
    return (
        <Card withBorder miw={220} p="lg" radius="md" shadow="sm">
            <Skeleton circle h={80} mb={12} w={80} />
            <Stack gap={6}>
                <Skeleton h={18} w="70%" />
                <Skeleton h={14} w="90%" />
            </Stack>
        </Card>
    );
}

export const InstructorCardSkeleton = memo(InstructorCardSkeletonBase);

export default InstructorCardSkeleton;
