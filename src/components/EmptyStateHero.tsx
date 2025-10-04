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
                    title: t('hero.courses.title'),
                    subtitle: t('hero.courses.subtitle'),
                    icon: <BookOpen size={14} />,
                    items: [t('hero.courses.item1'), t('hero.courses.item2'), t('hero.courses.item3')]
                };
            case 'wishlist':
                return {
                    title: t('hero.wishlist.title'),
                    subtitle: t('hero.wishlist.subtitle'),
                    icon: <Heart size={14} />,
                    items: [t('hero.wishlist.item1'), t('hero.wishlist.item2'), t('hero.wishlist.item3')]
                };
            case 'certificates':
                return {
                    title: t('hero.certificates.title'),
                    subtitle: t('hero.certificates.subtitle'),
                    icon: <Award size={14} />,
                    items: [t('hero.certificates.item1'), t('hero.certificates.item2'), t('hero.certificates.item3')]
                };
            case 'enrollments':
                return {
                    title: t('hero.enrollments.title'),
                    subtitle: t('hero.enrollments.subtitle'),
                    icon: <User size={14} />,
                    items: [t('hero.enrollments.item1'), t('hero.enrollments.item2'), t('hero.enrollments.item3')]
                };
            default:
                return {
                    title: t('hero.default.title'),
                    subtitle: t('hero.default.subtitle'),
                    icon: <CheckCircle2 size={14} />,
                    items: [t('hero.default.item1'), t('hero.default.item2'), t('hero.default.item3')]
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
