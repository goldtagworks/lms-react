import { Card, List, rem, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { CheckCircle2, BookOpen, Heart, Award, User } from 'lucide-react';
import { useI18n } from '@main/lib/i18n';

interface EmptyStateHeroProps {
    variant?: 'courses' | 'wishlist' | 'certificates' | 'enrollments' | 'default';
}

export function EmptyStateHero({ variant = 'default' }: EmptyStateHeroProps) {
    const { t } = useI18n();

    const getHeroContent = () => {
        switch (variant) {
            case 'courses':
                return {
                    title: t('hero.courses.title', {}, '수천 개의 강의'),
                    subtitle: t('hero.courses.subtitle', {}, '전문가가 만든 고품질 강의로 새로운 기술을 배워보세요'),
                    icon: <BookOpen size={14} />,
                    items: [
                        t('hero.courses.item1', {}, '실무 중심의 프로젝트 기반 학습'),
                        t('hero.courses.item2', {}, '업계 전문가들의 검증된 커리큘럼'),
                        t('hero.courses.item3', {}, '수료 후 취업까지 연결되는 완벽한 로드맵')
                    ]
                };
            case 'wishlist':
                return {
                    title: t('hero.wishlist.title', {}, '나만의 학습 계획'),
                    subtitle: t('hero.wishlist.subtitle', {}, '관심 있는 강의를 저장하고 체계적으로 학습하세요'),
                    icon: <Heart size={14} />,
                    items: [
                        t('hero.wishlist.item1', {}, '언제든지 찜한 강의에 빠르게 접근'),
                        t('hero.wishlist.item2', {}, '할인 혜택 및 업데이트 알림 받기'),
                        t('hero.wishlist.item3', {}, '개인별 맞춤 학습 추천 받기')
                    ]
                };
            case 'certificates':
                return {
                    title: t('hero.certificates.title', {}, '성취의 증명'),
                    subtitle: t('hero.certificates.subtitle', {}, '완료한 강의의 수료증을 관리하고 공유하세요'),
                    icon: <Award size={14} />,
                    items: [
                        t('hero.certificates.item1', {}, '공식 수료증 발급 및 다운로드'),
                        t('hero.certificates.item2', {}, 'LinkedIn 프로필에 바로 추가'),
                        t('hero.certificates.item3', {}, '취업 시 역량 증명 자료로 활용')
                    ]
                };
            case 'enrollments':
                return {
                    title: t('hero.enrollments.title', {}, '학습 여정의 시작'),
                    subtitle: t('hero.enrollments.subtitle', {}, '체계적인 학습으로 전문가가 되어보세요'),
                    icon: <User size={14} />,
                    items: [
                        t('hero.enrollments.item1', {}, '단계별 진도 관리와 학습 추적'),
                        t('hero.enrollments.item2', {}, '전문 강사의 1:1 피드백 제공'),
                        t('hero.enrollments.item3', {}, '실무 프로젝트로 포트폴리오 구성')
                    ]
                };
            default:
                return {
                    title: 'KSI LMS',
                    subtitle: t('hero.default.subtitle', {}, '전문적인 온라인 학습 플랫폼'),
                    icon: <CheckCircle2 size={14} />,
                    items: [t('hero.default.item1', {}, '고품질 온라인 강의'), t('hero.default.item2', {}, '체계적인 학습 관리'), t('hero.default.item3', {}, '실무 중심 커리큘럼')]
                };
        }
    };

    const content = getHeroContent();

    return (
        <Card withBorder p={{ base: 'lg', md: 'xl' }} radius="lg" shadow="md">
            <Stack gap="lg">
                <div>
                    <Title fw={800} mb={rem(4)} order={2} size={28}>
                        {content.title}
                    </Title>
                    <Text c="dimmed" size="sm">
                        {content.subtitle}
                    </Text>
                </div>
                <List
                    center
                    icon={
                        <ThemeIcon color="primary" radius="xl" size={22} variant="light">
                            {content.icon}
                        </ThemeIcon>
                    }
                    size="sm"
                    spacing={6}
                >
                    {content.items.map((item, index) => (
                        <List.Item key={index}>{item}</List.Item>
                    ))}
                </List>
            </Stack>
        </Card>
    );
}
