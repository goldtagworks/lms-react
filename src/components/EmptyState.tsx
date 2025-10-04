import { Card, Stack, Text, Title, Button } from '@mantine/core';
import { Link } from 'react-router-dom';
import React from 'react';

export interface EmptyStateProps {
    title?: string;
    message?: string;
    actionLabel?: string;
    to?: string;
    onActionClick?: () => void;
    className?: string;
    'data-testid'?: string;
}

/**
 * 단순 빈 상태 표현 컴포넌트.
 * - 과도한 추상화 방지: 아이콘/일러스트 등은 필요 시 확장
 * - title, message, action 세 가지만 노출
 */
export function EmptyState({ title, message, actionLabel, to, onActionClick, className, 'data-testid': testId }: EmptyStateProps) {
    const ActionWrapper: any = to ? Link : 'button';
    const hasAction = !!actionLabel && (!!to || !!onActionClick);
    const ariaTitleId = title ? `empty-title-${Math.random().toString(36).slice(2, 8)}` : undefined;

    return (
        <Card
            withBorder
            aria-labelledby={ariaTitleId}
            className={className}
            data-testid={testId}
            p={{ base: 'lg', md: 'xl' }}
            radius="lg"
            role="group"
            shadow="sm"
            style={{ maxWidth: 480, textAlign: 'center', margin: '0 auto' }}
        >
            <Stack gap={10}>
                {title && (
                    <Title id={ariaTitleId} order={4} size={22} style={{ fontWeight: 700 }}>
                        {title}
                    </Title>
                )}
                {message && (
                    <Text size="sm" style={{ whiteSpace: 'pre-line' }}>
                        {message}
                    </Text>
                )}
                {hasAction && (
                    <Button component={ActionWrapper} mt="lg" radius="md" size="xs" {...(to ? { to } : {})} variant="light" onClick={onActionClick}>
                        {actionLabel}
                    </Button>
                )}
            </Stack>
        </Card>
    );
}

export default EmptyState;
