import { Title, Text, Button, Group, Stack, TextInput, Paper, ThemeIcon, Anchor, Divider } from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import PageContainer from '@main/components/layout/PageContainer';
import { useI18n } from '@main/lib/i18n';
import { Compass, Home, LifeBuoy, Search } from 'lucide-react';
import { useState } from 'react';

const NotFoundPage = () => {
    const { t } = useI18n();
    const nav = useNavigate();
    const [query, setQuery] = useState('');

    function onSearch(e: React.FormEvent) {
        e.preventDefault();
        if (!query.trim()) return;
        // 검색 라우터 미정: 추후 /search?q= 로 합의되면 수정
        nav(`/courses?search=${encodeURIComponent(query.trim())}`);
    }

    return (
        <PageContainer roleMain py={72}>
            <Stack align="center" gap="xl">
                <ThemeIcon color="blue" radius="xl" size={88} variant="light">
                    <Compass size={56} strokeWidth={1.3} />
                </ThemeIcon>
                <Stack gap={4} maw={640} ta="center">
                    <Title order={1}>{t('notFound.title')}</Title>
                    <Text c="dimmed" fz="lg">
                        {t('notFound.message')}
                    </Text>
                </Stack>
                <Paper withBorder maw={640} p="lg" radius="md" w="100%">
                    <form onSubmit={onSearch}>
                        <TextInput
                            aria-label={t('notFound.searchPlaceholder')}
                            leftSection={<Search size={16} />}
                            placeholder={t('notFound.searchPlaceholder')}
                            value={query}
                            onChange={(e) => setQuery(e.currentTarget.value)}
                        />
                    </form>
                    <Group gap="sm" justify="center" mt="md">
                        <Button color="blue" component={Link} leftSection={<Home size={16} />} to="/" variant="light">
                            {t('notFound.home')}
                        </Button>
                        <Button color="blue" component={Link} leftSection={<Compass size={16} />} to="/courses" variant="subtle">
                            {t('notFound.browseCourses')}
                        </Button>
                        <Button color="gray" component={Link} leftSection={<LifeBuoy size={16} />} to="/support" variant="subtle">
                            {t('notFound.goSupport')}
                        </Button>
                    </Group>
                </Paper>
                <Divider label={t('common.viewAll')} labelPosition="center" maw={640} w="100%" />
                <Group c="dimmed" fz="sm" gap="md" justify="center" maw={640} ta="center" wrap="wrap">
                    <Anchor component={Link} to="/courses" underline="always">
                        {t('home.featured')}
                    </Anchor>
                    <Anchor component={Link} to="/faq" underline="always">
                        FAQ
                    </Anchor>
                    <Anchor component={Link} to="/support" underline="always">
                        {t('nav.support')}
                    </Anchor>
                    <Anchor component={Link} to="/" underline="always">
                        {t('nav.home')}
                    </Anchor>
                </Group>
            </Stack>
        </PageContainer>
    );
};

export default NotFoundPage;
