import { Title, Text, Button } from '@mantine/core';
import { Link } from 'react-router-dom';
import PageContainer from '@main/components/layout/PageContainer';
import { useI18n } from '@main/lib/i18n';

const NotFoundPage = () => {
    const { t } = useI18n();

    return (
        <PageContainer roleMain py={48} ta="center">
            <Title mb="md" order={1}>
                {t('notFound.title')}
            </Title>
            <Text c="dimmed" mb="lg">
                {t('notFound.message')}
            </Text>
            <Button color="primary" component={Link} to="/" variant="filled">
                {t('notFound.home')}
            </Button>
        </PageContainer>
    );
};

export default NotFoundPage;
