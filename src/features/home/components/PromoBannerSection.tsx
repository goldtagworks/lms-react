import React, { memo } from 'react';
import { Container, Card, Group, Title, Text } from '@mantine/core';
import { AppImage } from '@main/components/AppImage';
import { useI18n } from '@main/lib/i18n';

import { PromoBannerVM } from '../../../viewmodels/home';

interface PromoBannerSectionProps {
    banner: PromoBannerVM;
}

function PromoBannerSectionBase({ banner }: PromoBannerSectionProps) {
    const { t } = useI18n();
    // CSS 변수 기반 배경 (다크/라이트 자동 전환)
    const promoBg = 'var(--gradient-promo, linear-gradient(90deg, #e0e7ff 60%, #f5f7fa 100%))';

    return (
        <Container py="xl" size="lg">
            <Card withBorder aria-labelledby={`promo-${banner.id}-title`} p={{ base: 'lg', md: 'xl' }} radius="lg" shadow="md" style={{ background: promoBg }}>
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
                                {t('home.promo.couponLabel', { code: banner.coupon_code })}
                            </Text>
                        )}
                    </div>
                    {banner.image_url && <AppImage loadingSkeleton alt={banner.title || t('a11y.image.mainBanner')} height={180} radius={12} shadow="md" src={banner.image_url} width={320} />}
                </Group>
            </Card>
        </Container>
    );
}

export const PromoBannerSection = memo(PromoBannerSectionBase);
export default PromoBannerSection;
