import React, { memo } from 'react';
import { Container, Title, Group, Card, Text } from '@mantine/core';

import { InstructorVM } from '../../../viewmodels/home';

interface InstructorsSectionProps {
    instructors: InstructorVM[];
    title?: string;
    limit?: number;
}

function InstructorsSectionBase({ instructors, title = '주요 강사진', limit }: InstructorsSectionProps) {
    const list = limit ? instructors.slice(0, limit) : instructors;

    return (
        <Container py={32} size="lg">
            <Title mb="md" order={2} size={24}>
                {title}
            </Title>
            <Group gap={24}>
                {list.map((i) => (
                    <Card key={i.user_id} withBorder p="lg" radius="md" shadow="sm" style={{ minWidth: 220 }}>
                        {i.avatar_url && <img alt={i.name} src={i.avatar_url} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginBottom: 12 }} />}
                        <Title mb={4} order={4} size={18}>
                            {i.name}
                        </Title>
                        {i.headline && (
                            <Text c="dimmed" mb={4} size="sm">
                                {i.headline}
                            </Text>
                        )}
                    </Card>
                ))}
            </Group>
        </Container>
    );
}

export const InstructorsSection = memo(InstructorsSectionBase);
export default InstructorsSection;
