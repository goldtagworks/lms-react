import { Button, Card, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import PageContainer from '@main/components/layout/PageContainer';
import { useI18n } from '@main/lib/i18n';

const mockExam = { id: 1, courseTitle: 'React 입문', user: '홍길동', status: '응시 전', score: null };

const ExamPage = () => {
    const { t } = useI18n();

    // 실제로는 id로 데이터 fetch, 여기선 mock만 사용
    return (
        <PageContainer roleMain py={48} size="sm">
            <Card withBorder padding="xl" radius="lg" shadow="sm">
                <Stack>
                    <Title order={2}>{t('exam.pageTitle')}</Title>
                    <Text fw={700}>{mockExam.courseTitle}</Text>
                    <Text>
                        {t('exam.candidate')}: {mockExam.user}
                    </Text>
                    <Text c="dimmed">
                        {t('exam.status')}: {t('exam.status.before')}
                    </Text>
                    <Button color="primary" component={Link} size="sm" to={`/certificate/1`} variant="filled">
                        {t('exam.completeToCertificate')}
                    </Button>
                    <Button component={Link} size="sm" to={`/my`} variant="outline">
                        {t('exam.backMyPage')}
                    </Button>
                </Stack>
            </Card>
        </PageContainer>
    );
};

export default ExamPage;
