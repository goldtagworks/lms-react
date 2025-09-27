import React, { memo } from 'react';
import { Container, Title, SimpleGrid, Card, Text } from '@mantine/core';

import { ReviewVM } from '../../../viewmodels/home';

interface ReviewsSectionProps {
    reviews: ReviewVM[];
    title?: string;
    limit?: number;
}

function ReviewsSectionBase({ reviews, title = '실제 수강생 후기', limit }: ReviewsSectionProps) {
    const list = limit ? reviews.slice(0, limit) : reviews;

    return (
        <Container py="xl" size="lg">
            <Title mb="md" order={2} size={24}>
                {title}
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 2 }} spacing="lg">
                {list.map((r) => (
                    <Card key={r.id} withBorder p="lg" radius="md" shadow="sm">
                        <Text fw={700} mb={4}>
                            {r.user_name || r.user_id}
                        </Text>
                        <Text aria-label={`평점 ${r.rating}점`} c="yellow.7" size="sm">
                            ★ {r.rating}
                        </Text>
                        <Text c="dimmed" mb={8} size="sm">
                            {new Date(r.created_at).toISOString().slice(0, 10)}
                        </Text>
                        {r.comment && <Text>{r.comment}</Text>}
                        {r.course_title && (
                            <Text c="blue.6" mt={8} size="sm">
                                {r.course_title}
                            </Text>
                        )}
                    </Card>
                ))}
            </SimpleGrid>
        </Container>
    );
}

export const ReviewsSection = memo(ReviewsSectionBase);

export default ReviewsSection;
