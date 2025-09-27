import { Box, Group, Title, Text } from '@mantine/core';
import React from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    mb?: number | string;
    children?: React.ReactNode; // optional extra content below description
    titleSize?: 'sm' | 'md' | 'lg' | 'xl'; // Mantine size token (px 대신 토큰 사용)
    descriptionSize?: 'xs' | 'sm' | 'md' | 'lg';
}

export function PageHeader({ title, description, actions, mb = 32, children, titleSize = 'xl', descriptionSize = 'sm' }: PageHeaderProps) {
    return (
        <Box component="header" mb={mb}>
            <Group align="flex-start" justify="space-between" mb={description ? 8 : 0} wrap="nowrap">
                <Title fw={800} lh={1.2} order={1} size={titleSize} style={{ letterSpacing: '.2px' }}>
                    {title}
                </Title>
                {actions && <Box>{actions}</Box>}
            </Group>
            {description && (
                <Text c="dimmed" size={descriptionSize}>
                    {description}
                </Text>
            )}
            {children}
        </Box>
    );
}

export default PageHeader;
