import { Title, Text } from '@mantine/core';
import { useParams } from 'react-router-dom';
import PageContainer from '@main/components/layout/PageContainer';
import { useI18n } from '@main/lib/i18n';

export default function ExamAttemptPage() {
    const { examId } = useParams();
    const { t } = useI18n();

    return (
        <PageContainer roleMain py={48}>
            <Title order={2}>{t('exam.attemptTitle')}</Title>
            <Text>
                {t('exam.attemptId')}: {examId}
            </Text>
            <Text>{t('exam.attemptPlaceholder')}</Text>
        </PageContainer>
    );
}
