import React, { memo } from 'react';
import { Badge, BadgeProps } from '@mantine/core';

export interface TagChipProps extends Omit<BadgeProps, 'children'> {
    label: string;
}

// Mantine Badge 기반 태그 (색상/패딩 일관화)
function TagChipBase({ label, color = 'blue', radius = 'sm', size = 'xs', variant = 'light', ...rest }: TagChipProps) {
    return (
        <Badge color={color} radius={radius} size={size} variant={variant} {...rest}>
            {label}
        </Badge>
    );
}

export const TagChip = memo(TagChipBase);
export default TagChip;
