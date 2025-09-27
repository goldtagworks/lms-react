import React, { memo } from 'react';
import { Box, Container, Group, Title, Text, Button } from '@mantine/core';
import { Link } from 'react-router-dom';
import AppImage from '@main/components/AppImage';

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
    heading = '최고의 온라인 강의 플랫폼',
    subHeading = '실무 중심의 커리큘럼, 검증된 강사진, 다양한 할인 혜택까지!\n지금 바로 원하는 강의를 찾아보세요.',
    primaryCtaLabel = '강의 전체 보기',
    primaryCtaTo = '/courses',
    secondaryCtaLabel = '회원가입',
    secondaryCtaTo = '/signup',
    imageUrl = 'https://cdn.inflearn.com/public/main/hero@2x.png'
}: HeroSectionProps) {
    // CSS 변수 기반(색상 모드 자동 전환). token fallback 포함.
    const heroBg = 'var(--gradient-hero, linear-gradient(90deg, #f5f7fa 60%, #e0e7ff 100%))';

    return (
        <Box bg={heroBg} component="section" mih={420} px={0} py={0} style={{ alignItems: 'center', display: 'flex' }}>
            <Container size="lg" w="100%">
                <Group align="center" justify="space-between" wrap="wrap">
                    <Box maw={520}>
                        <Title mb="xl" order={1} size="xl">
                            {heading}
                        </Title>
                        <Text c="dimmed" mb="xl" size="lg" style={{ whiteSpace: 'pre-line' }}>
                            {subHeading}
                        </Text>
                        <Group gap={12}>
                            <Button color="primary" component={Link} radius="xl" size="lg" to={primaryCtaTo}>
                                {primaryCtaLabel}
                            </Button>
                            <Button component={Link} radius="xl" size="lg" to={secondaryCtaTo} variant="outline">
                                {secondaryCtaLabel}
                            </Button>
                        </Group>
                    </Box>
                    <AppImage alt="메인 배너" height={260} radius={24} shadow="sm" src={imageUrl} style={{ boxShadow: '0 8px 32px rgba(80,120,200,0.08)', objectFit: 'cover' }} width={400} />
                </Group>
            </Container>
        </Box>
    );
}

export const HeroSection = memo(HeroSectionBase);
export default HeroSection;
