import { Group, Text } from '@mantine/core';
import React from 'react';
import { formatPrice } from '@main/utils/format';

type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface PriceTextProps {
    price: number; // base price (원)
    discount?: number | null; // 할인 가격 (원)
    size?: TextSize;
    showStrike?: boolean; // 원가 취소선
}

export function PriceText({ price, discount, size = 'md', showStrike = true }: PriceTextProps) {
    const hasDiscount = discount != null && discount < price;

    return (
        <Group align="flex-end" gap={8}>
            <Text c={hasDiscount ? 'red.6' : 'dark'} fw={700} size={size}>
                {formatPrice(hasDiscount ? discount! : price)}
            </Text>
            {hasDiscount && showStrike && (
                <Text c="dimmed" className="text-strike" size="sm">
                    {formatPrice(price)}
                </Text>
            )}
        </Group>
    );
}

export default PriceText;
