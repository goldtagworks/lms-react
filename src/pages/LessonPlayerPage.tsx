import { Title, Text, Card } from '@mantine/core';
import { useParams } from 'react-router-dom';
import PageContainer from '@main/components/layout/PageContainer';
import MarkdownView from '@main/components/markdown/MarkdownView';
import { useLessons } from '@main/lib/repository';
import { t } from '@main/lib/i18n';

export default function LessonPlayerPage() {
    const { enrollmentId } = useParams();
    // 데모: enrollmentId 대신 lesson id가 param으로 올 수도 있으나 현재 스키마 단순화
    const lessons = useLessons(undefined); // 전체 불러온 뒤 첫 번째를 표시 (mock)
    const first = lessons[0];

    return (
        <PageContainer roleMain py={48}>
            <Title order={2}>{t('player.title')}</Title>
            <Text>{t('player.enrollmentId', { id: enrollmentId || '' })}</Text>
            <Text mb="sm">{t('player.mockVideo')}</Text>
            <Card withBorder p="lg" radius="md" shadow="sm">
                <MarkdownView source={first?.content_md || `# ${t('lesson.sampleTitle')}` + `\n${t('lesson.emptyContent')}`} />
            </Card>
        </PageContainer>
    );
}
