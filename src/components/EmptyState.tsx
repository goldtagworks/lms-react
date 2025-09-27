import { Box, Stack, Text, Title, Button } from '@mantine/core';
import { Link } from 'react-router-dom';
import React from 'react';

export interface EmptyStateProps {
    title?: string;
    message?: string;
    actionLabel?: string;
    to?: string; // react-router link target (optional)
    onActionClick?: () => void;
}

/**
 * 단순 빈 상태 표현 컴포넌트.
 * - 과도한 추상화 방지: 아이콘/일러스트 등은 필요 시 확장
 * - title, message, action 세 가지만 노출
 */
export function EmptyState({ title, message, actionLabel, to, onActionClick }: EmptyStateProps) {
    const ActionWrapper: any = to ? Link : 'button';
    const hasAction = !!actionLabel && (!!to || !!onActionClick);

    return (
        <Box c="dimmed">
            <Stack gap={6}>
                {title && (
                    <Title order={4} size="md">
                        {title}
                    </Title>
                )}
                {message && (
                    <Text c="dimmed" size="sm">
                        {message}
                    </Text>
                )}
                {hasAction && (
                    <Button component={ActionWrapper} mt={4} size="xs" to={to} variant="light" onClick={onActionClick}>
                        {actionLabel}
                    </Button>
                )}
            </Stack>
        </Box>
    );
}

export default EmptyState;
