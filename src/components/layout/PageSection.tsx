import { Box, Title, BoxProps } from '@mantine/core';
import React from 'react';

interface PageSectionProps extends BoxProps {
    title?: string;
    subtitle?: string;
    withGapTop?: boolean;
    headingOrder?: 2 | 3;
    children?: React.ReactNode;
}

export function PageSection({ title, subtitle, withGapTop = true, headingOrder = 2, children, ...rest }: PageSectionProps) {
    // spacing: mt uses section default token, mb uses small token
    const mtValue = withGapTop ? 'var(--space-section, 40px)' : 0;
    const mbValue = 'var(--space-section-sm, 32px)';

    return (
        <Box component="section" mb={mbValue} mt={mtValue} {...rest}>
            {title && (
                <Title fw={700} mb={subtitle ? 4 : 16} order={headingOrder} size={headingOrder === 2 ? 'lg' : 'md'} style={{ letterSpacing: '.2px' }}>
                    {title}
                </Title>
            )}
            {subtitle && (
                <Box c="dimmed" component="p" fz="sm" mb={16}>
                    {subtitle}
                </Box>
            )}
            {children}
        </Box>
    );
}

export default PageSection;
