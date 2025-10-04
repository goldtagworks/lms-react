import { Button, Card, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import PageContainer from '@main/components/layout/PageContainer';
import { useI18n } from '@main/lib/i18n';

// TODO: 실제 시험 데이터 fetch 로 대체 예정 (임시 placeholder)
const placeholderExam = { id: 1, courseTitle: 'React 입문', user: '홍길동', status: '응시 전', score: null };

const ExamPage = () => {
    const { t } = useI18n();

    // NOTE: 실제 구현 시 URL param 기반 시험/attempt fetch로 교체
    return (
        <PageContainer roleMain py={48} size="sm">
            <Card withBorder p={{ base: 'lg', md: 'xl' }} radius="lg" shadow="sm">
                <Stack>
                    <Title order={2}>{t('exam.pageTitle')}</Title>
                    <Text fw={700}>{placeholderExam.courseTitle}</Text>
                    <Text>
                        {t('exam.candidate')}: {placeholderExam.user}
                    </Text>
                    <Text c="dimmed">
                        {t('exam.status')}: {t('exam.status.before')}
                    </Text>
                    <Button component={Link} radius="md" size="sm" to={`/certificate/1`} variant="filled">
                        {t('exam.completeToCertificate')}
                    </Button>
                    <Button component={Link} radius="md" size="sm" to={`/my`} variant="outline">
                        {t('exam.backMyPage')}
                    </Button>
                </Stack>
            </Card>
        </PageContainer>
    );
};

export default ExamPage;
