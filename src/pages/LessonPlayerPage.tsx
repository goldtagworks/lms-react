import { Title, Text, Card } from '@mantine/core';
import { useParams } from 'react-router-dom';
import PageContainer from '@main/components/layout/PageContainer';
import MarkdownView from '@main/components/markdown/MarkdownView';
import { useLessons } from '@main/lib/repository';
import { t } from '@main/lib/i18n';

export default function LessonPlayerPage() {
    const { enrollmentId } = useParams();
    // 데모: enrollmentId 대신 lesson id가 param으로 올 수도 있으나 현재 스키마 단순화
    const lessons = useLessons(undefined); // TODO: 단일 lesson fetch + enrollment progress 연동 예정
    const first = lessons[0];

    return (
        <PageContainer roleMain py={48}>
            <Title order={2}>{t('player.title')}</Title>
            <Text>{t('player.enrollmentId', { id: enrollmentId || '' })}</Text>
            <Text mb="sm">{t('player.mockVideo')}</Text> {/* 키 값은 이미 '(mock)' 제거됨 */}
            <Card withBorder p="lg" radius="lg" shadow="sm">
                <MarkdownView source={first?.content_md || `# ${t('lesson.sampleTitle')}` + `\n${t('lesson.emptyContent')}`} />
            </Card>
        </PageContainer>
    );
}
