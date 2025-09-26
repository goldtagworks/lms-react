import React, { memo } from 'react';
import { Container, Card, Group, Title, Text } from '@mantine/core';

import { PromoBannerVM } from '../../../viewmodels/home';

interface PromoBannerSectionProps {
    banner: PromoBannerVM;
}

function PromoBannerSectionBase({ banner }: PromoBannerSectionProps) {
    return (
        <Container py={32} size="lg">
            <Card withBorder aria-labelledby={`promo-${banner.id}-title`} p="xl" radius="md" shadow="md" style={{ background: 'linear-gradient(90deg, #e0e7ff 60%, #f5f7fa 100%)' }}>
                <Group align="center" justify="space-between">
                    <div>
                        <Title id={`promo-${banner.id}-title`} mb={8} order={3}>
                            {banner.title}
                        </Title>
                        {banner.description && (
                            <Text mb={8} size="lg">
                                {banner.description}
                            </Text>
                        )}
                        {banner.coupon_code && (
                            <Text c="blue.6" fw={600} size="sm">
                                쿠폰코드: {banner.coupon_code}
                            </Text>
                        )}
                    </div>
                    {banner.image_url && <img alt={banner.title} src={banner.image_url} style={{ maxWidth: 320, borderRadius: 12 }} />}
                </Group>
            </Card>
        </Container>
    );
}

export const PromoBannerSection = memo(PromoBannerSectionBase);
export default PromoBannerSection;
