import React, { memo } from 'react';
import { Group, Button } from '@mantine/core';

import { CategoryVM } from '../../../viewmodels/home';

interface CategoryChipsProps {
    categories: CategoryVM[];
    onSelect?: (slug: string) => void;
    selectedSlug?: string;
}

function CategoryChipsBase({ categories, onSelect, selectedSlug }: CategoryChipsProps) {
    return (
        <Group gap={24} justify="center">
            {categories.map((cat) => (
                <Button
                    key={cat.id}
                    aria-pressed={selectedSlug === cat.slug}
                    leftSection={cat.icon}
                    radius="xl"
                    size="lg"
                    variant={selectedSlug === cat.slug ? 'filled' : 'light'}
                    onClick={() => onSelect?.(cat.slug)}
                >
                    {cat.name}
                </Button>
            ))}
        </Group>
    );
}

export const CategoryChips = memo(CategoryChipsBase);

export default CategoryChips;
