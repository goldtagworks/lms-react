import React, { memo } from 'react';
import { Box, Container, Group, Title, Text, Button } from '@mantine/core';
import { Link } from 'react-router-dom';
import AppImage from '@main/components/AppImage';
import { useAuth } from '@main/lib/auth';
import { useMediaQuery } from '@mantine/hooks';
import { useI18n } from '@main/lib/i18n';

interface HeroSectionProps {
    heading?: string;
    subHeading?: string;
    primaryCtaLabel?: string;
    primaryCtaTo?: string;
    secondaryCtaLabel?: string;
    secondaryCtaTo?: string;
    imageUrl?: string;
}

// 디자인 토큰 적용 TODO: theme layer(src/lib/theme.ts) 완료 후 spacing/color 치환
function HeroSectionBase({
    heading = undefined,
    subHeading,
    primaryCtaLabel = undefined,
    primaryCtaTo = '/courses',
    secondaryCtaLabel = undefined,
    secondaryCtaTo = '/signup',
    imageUrl = 'https://cdn.inflearn.com/public/main/hero@2x.png'
}: HeroSectionProps) {
    const isMobile = useMediaQuery('(max-width: 48em)'); // Mantine sm breakpoint (≈768px)
    // CSS 변수 기반(색상 모드 자동 전환). token fallback 포함.
    const heroBg = 'var(--gradient-hero, linear-gradient(90deg, #f5f7fa 60%, #e0e7ff 100%))';
    const { user } = useAuth();
    const { t } = useI18n();
    const finalTitle = heading || t('home.hero.title');
    const finalSub = subHeading || t('home.hero.subtitle');
    const primaryLabel = primaryCtaLabel || t('home.hero.primaryCta');
    const secondaryLabel = secondaryCtaLabel || t('home.hero.secondaryCta');

    return (
        <Box bg={heroBg} component="section" mih={isMobile ? 620 : 420} px={0} py={0} style={{ alignItems: 'center', display: 'flex' }}>
            <Container size="lg" w="100%">
                <Group align="center" justify="space-between" wrap="wrap">
                    <Box maw={520}>
                        <Title mb="xl" order={1} size="xl">
                            {finalTitle}
                        </Title>
                        <Text c="dimmed" mb="xl" size="lg" style={{ whiteSpace: 'pre-line' }}>
                            {finalSub}
                        </Text>
                        <Group gap={12}>
                            <Button color="gray" component={Link} radius="xl" size="lg" to={primaryCtaTo}>
                                {primaryLabel}
                            </Button>
                            {!user && (
                                <Button component={Link} radius="xl" size="lg" to={secondaryCtaTo} variant="outline">
                                    {secondaryLabel}
                                </Button>
                            )}
                        </Group>
                    </Box>
                    <AppImage
                        alt={t('home.hero.imageAlt')}
                        height={260}
                        radius={24}
                        shadow="sm"
                        src={imageUrl}
                        style={{ boxShadow: '0 8px 32px rgba(80,120,200,0.08)', objectFit: 'cover' }}
                        width={400}
                    />
                </Group>
            </Container>
        </Box>
    );
}

export const HeroSection = memo(HeroSectionBase);
export default HeroSection;
