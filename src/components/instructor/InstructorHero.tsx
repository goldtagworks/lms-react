import { Card, List, rem, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { CheckCircle2 } from 'lucide-react';
import { useI18n } from '@main/lib/i18n';

export interface InstructorHeroProps {
    variant: 'apply' | 'courses' | 'courseEdit' | 'profile';
    isNewCourse?: boolean; // courseEdit 전용
}

export function InstructorHero({ variant, isNewCourse }: InstructorHeroProps) {
    const { t } = useI18n();

    function title() {
        if (variant === 'apply') {
            return t('instructor.hero.apply.title');
        }
        if (variant === 'courses') {
            return t('instructor.hero.courses.title');
        }
        if (variant === 'courseEdit') {
            return isNewCourse ? t('instructor.hero.courseEdit.newTitle') : t('instructor.hero.courseEdit.editTitle');
        }
        if (variant === 'profile') {
            return t('instructor.hero.profile.title');
        }

        return 'Instructor';
    }

    function subtitle() {
        if (variant === 'apply') {
            return t('instructor.hero.apply.subtitle');
        }
        if (variant === 'courses') {
            return t('instructor.hero.courses.subtitle');
        }
        if (variant === 'courseEdit') {
            return t('instructor.hero.courseEdit.subtitle');
        }
        if (variant === 'profile') {
            return t('instructor.hero.profile.subtitle');
        }

        return '';
    }

    function items(): string[] {
        switch (variant) {
            case 'apply':
                return [t('instructor.hero.apply.li1'), t('instructor.hero.apply.li2'), t('instructor.hero.apply.li3')];
            case 'courses':
                return [t('instructor.hero.courses.li1'), t('instructor.hero.courses.li2'), t('instructor.hero.courses.li3')];
            case 'courseEdit':
                return [t('instructor.hero.courseEdit.li1'), t('instructor.hero.courseEdit.li2'), t('instructor.hero.courseEdit.li3')];
            case 'profile':
                return [t('instructor.hero.profile.li1'), t('instructor.hero.profile.li2'), t('instructor.hero.profile.li3')];
            default:
                return [];
        }
    }

    const list = items();

    return (
        <Card withBorder p={{ base: 'lg', md: 'xl' }} radius="lg" shadow="md">
            <Stack gap="lg">
                <div>
                    <Title fw={800} mb={rem(4)} order={2} size={28}>
                        {title()}
                    </Title>
                    <Text c="dimmed" size="sm">
                        {subtitle()}
                    </Text>
                </div>
                {list.length > 0 && (
                    <List
                        center
                        icon={
                            <ThemeIcon color="primary" radius="xl" size={22} variant="light">
                                <CheckCircle2 size={14} />
                            </ThemeIcon>
                        }
                        size="sm"
                        spacing={6}
                    >
                        {list.map((li, i) => (
                            <List.Item key={i}>{li}</List.Item>
                        ))}
                    </List>
                )}
            </Stack>
        </Card>
    );
}

export default InstructorHero;
