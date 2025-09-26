import React, { memo } from 'react';
import { Box, Container, Group, Title, Text, Button } from '@mantine/core';
import { Link } from 'react-router-dom';

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
    return (
        <Box bg="linear-gradient(90deg, #f5f7fa 60%, #e0e7ff 100%)" px={0} py={64} style={{ minHeight: 340 }}>
            <Container size="lg">
                <Group align="center" justify="space-between" wrap="wrap">
                    <Box style={{ maxWidth: 520 }}>
                        <Title mb={16} order={1} size={40}>
                            {heading}
                        </Title>
                        <Text c="dimmed" mb={24} size="lg" style={{ whiteSpace: 'pre-line' }}>
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
                    <img alt="메인 배너" src={imageUrl} style={{ maxWidth: 400, width: '100%', borderRadius: 24, boxShadow: '0 8px 32px rgba(80,120,200,0.08)' }} />
                </Group>
            </Container>
        </Box>
    );
}

export const HeroSection = memo(HeroSectionBase);
export default HeroSection;
