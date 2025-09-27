import React, { memo } from 'react';
import { Container, Title, Card, Text, Stack, SimpleGrid, Tooltip } from '@mantine/core';
import { AppImage } from '@main/components/AppImage';

import { InstructorVM } from '../../../viewmodels/home';

interface InstructorsSectionProps {
    instructors: InstructorVM[];
    title?: string;
    limit?: number;
}

function InstructorsSectionBase({ instructors, title = '주요 강사진', limit }: InstructorsSectionProps) {
    const list = limit ? instructors.slice(0, limit) : instructors;

    return (
        <Container py="xl" size="lg">
            <Title mb="md" order={2} size="xl">
                {title}
            </Title>
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing={24} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {list.map((i) => {
                    const headlineNode = i.headline ? (
                        <Tooltip multiline withArrow disabled={i.headline.length <= 42} label={i.headline} w={260}>
                            <Text c="dimmed" lineClamp={2} size="sm" style={{ lineHeight: 1.4 }}>
                                {i.headline}
                            </Text>
                        </Tooltip>
                    ) : null;

                    return (
                        <Card
                            key={i.user_id}
                            withBorder
                            aria-label={`강사 ${i.name}${i.headline ? ' - ' + i.headline : ''}`}
                            p="lg"
                            radius="md"
                            shadow="sm"
                            style={{
                                alignItems: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                textAlign: 'center',
                                transition: 'box-shadow 120ms ease, transform 120ms ease'
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)';
                                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.boxShadow = '';
                                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                            }}
                        >
                            {i.avatar_url && <AppImage loadingSkeleton alt={i.name} height={96} radius={96} src={i.avatar_url} style={{ marginBottom: 12, objectFit: 'cover' }} width={96} />}
                            <Stack gap={4} w="100%">
                                <Title order={4} size="sm">
                                    {i.name}
                                </Title>
                                {headlineNode}
                            </Stack>
                        </Card>
                    );
                })}
            </SimpleGrid>
        </Container>
    );
}

export const InstructorsSection = memo(InstructorsSectionBase);
export default InstructorsSection;
