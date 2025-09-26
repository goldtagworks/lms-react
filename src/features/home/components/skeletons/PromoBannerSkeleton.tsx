import React, { memo } from 'react';
import { Card, Skeleton, Group, Stack } from '@mantine/core';

function PromoBannerSkeletonBase() {
    return (
        <Card withBorder p="xl" radius="md" shadow="md" style={{ background: 'linear-gradient(90deg, #e0e7ff 60%, #f5f7fa 100%)' }}>
            <Group align="center" justify="space-between">
                <Stack gap={12} style={{ flex: 1 }}>
                    <Skeleton h={32} w="60%" />
                    <Skeleton h={20} w="80%" />
                    <Skeleton h={20} w="50%" />
                </Stack>
                <Skeleton h={180} radius={12} w={320} />
            </Group>
        </Card>
    );
}

export const PromoBannerSkeleton = memo(PromoBannerSkeletonBase);

export default PromoBannerSkeleton;
