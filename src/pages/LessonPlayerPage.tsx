import { Title, Text, Card } from '@mantine/core';
import { useParams } from 'react-router-dom';
import PageContainer from '@main/components/layout/PageContainer';
import MarkdownView from '@main/components/markdown/MarkdownView';
import { useLessons } from '@main/lib/repository';
import { t } from '@main/lib/i18n';

export default function LessonPlayerPage() {
    const { enrollmentId } = useParams();
    // enrollmentId를 기반으로 레슨 및 진도 정보를 가져옴
    const lessons = useLessons(undefined); // TODO: 단일 lesson fetch + enrollment progress 연동 예정
    const first = lessons[0];

    return (
        <PageContainer roleMain py={48}>
            <Title order={2}>{t('player.title')}</Title>
            <Text mb="sm">{t('player.enrollmentId', { id: enrollmentId || '' })}</Text>
            <Card withBorder p="lg" radius="lg" shadow="sm">
                <MarkdownView source={first?.content_md || `# ${t('lesson.sampleTitle')}` + `\n${t('lesson.emptyContent')}`} />
            </Card>
        </PageContainer>
    );
}
